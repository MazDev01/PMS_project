"use client";

import StatCard from "@/app/components/StatCard";
import {
  IconUsers, IconUser, IconPhone, IconCheckCircle,
  IconAlertTriangle, IconTruck, IconClock,
} from "@/app/components/icons";
import { teamPerformanceDetailed, teamCoverage, specialtyShort } from "@/app/lib/mockData";
import { usePersonnel, useTeams, useJobs } from "@/app/lib/store";

const STATUS_BADGE = {
  working: { cls: "badge-info", label: "กำลังทำงาน", icon: <IconTruck size={13} /> },
  available: { cls: "badge-success", label: "ว่าง พร้อมรับงาน", icon: <IconCheckCircle size={13} /> },
  leave: { cls: "badge-warning", label: "มีคนลา", icon: <IconClock size={13} /> },
};

// One member row (avatar + name/specialty column on the left, a role badge on
// the right). Shared by both the team cards and the unassigned list so they
// read identically.
function MemberRow({ person, rightBadge }) {
  const initial = (person.name || "?").trim().charAt(0);
  return (
    <div className="list-row flex-between" style={{ gap: 12 }}>
      <div className="flex-row" style={{ gap: 10, alignItems: "center", minWidth: 0 }}>
        <span className="avatar avatar-sm">{initial}</span>
        <div style={{ minWidth: 0 }}>
          <div className="text-sm" style={{ fontWeight: person.lead ? 700 : 500 }}>{person.name}</div>
          <div className="text-xs text-muted" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {specialtyShort[person.specialty] || person.specialty}
            {" · "}
            <IconPhone size={11} />
            {person.phone}
          </div>
        </div>
      </div>
      {rightBadge}
    </div>
  );
}

// Lead first, then everyone else — the supervisor should head the roster.
function sortMembers(members) {
  return [...members].sort((a, b) => (b.lead ? 1 : 0) - (a.lead ? 1 : 0));
}

export default function AdminTeamRosterPage() {
  const [personnel] = usePersonnel();
  const [teams] = useTeams();
  const [jobs] = useJobs();

  const perf = teamPerformanceDetailed(jobs, teams);

  const membersOf = (teamId) => personnel.filter((p) => p.teamId === teamId);
  const perfFor = (teamId) => perf.find((x) => x.id === teamId);

  const totalTech = personnel.length;
  const leadCount = personnel.filter((p) => p.lead).length;
  const unassigned = personnel.filter((p) => !p.teamId);
  const teamsOnLeave = teams.filter((t) => t.onLeave).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>กำลังพลและความพร้อมทีม</h2>
          <p>ดูสมาชิกแต่ละทีม สายงานที่ถนัด สถานะความพร้อม และช่างที่ยังไม่สังกัดทีม</p>
        </div>
      </div>

      <div className="kpi-grid">
        <StatCard
          label="ช่างทั้งหมด"
          value={totalTech}
          icon={<IconUsers size={19} />}
        />
        <StatCard
          label="หัวหน้าช่าง"
          value={leadCount}
          icon={<IconCheckCircle size={19} />}
          subLabel="ผู้มีสิทธิ์เป็นหัวหน้างาน"
        />
        <StatCard
          label="ช่างยังไม่สังกัดทีม"
          value={unassigned.length}
          icon={<IconUser size={19} />}
          deltaTone={unassigned.length > 0 ? "warning" : "success"}
          deltaText={unassigned.length > 0 ? "พร้อมจัดเข้าทีม" : "จัดครบแล้ว"}
        />
        <StatCard
          label="ทีมที่มีคนลา"
          value={teamsOnLeave}
          icon={<IconAlertTriangle size={19} />}
          deltaTone={teamsOnLeave > 0 ? "warning" : "success"}
          deltaText={teamsOnLeave > 0 ? "มีทีมที่กำลังลา" : "พร้อมทุกทีม"}
        />
      </div>

      <div className="section-block">
        <h3>รายชื่อทีมและสมาชิก</h3>
        <div className="teamperf-grid">
          {teams.map((team) => {
            const members = sortMembers(membersOf(team.id));
            const p = perfFor(team.id);
            const status = p?.status || "available";
            const badge = STATUS_BADGE[status] || STATUS_BADGE.available;
            const coverage = teamCoverage(team.id, personnel);
            return (
              <div key={team.id} className="ds-card">
                <div className="ds-card-header">
                  <div className="flex-between" style={{ gap: 8 }}>
                    <span className="ds-card-title" style={{ fontWeight: 700 }}>{team.name}</span>
                    <span className={`badge ${badge.cls}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {badge.icon}
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex-row" style={{ flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {coverage.length > 0 ? (
                      coverage.map((s) => (
                        <span key={s} className="badge badge-secondary">{specialtyShort[s] || s}</span>
                      ))
                    ) : (
                      <span className="text-xs text-muted">ยังไม่ระบุสายงาน</span>
                    )}
                  </div>
                  <div className="ds-card-desc text-xs text-muted" style={{ marginTop: 8 }}>
                    สมาชิก {members.length} คน · ภาระงาน {p ? p.workload : 0} งาน
                  </div>
                </div>
                <div className="ds-card-content">
                  {members.length > 0 ? (
                    members.map((person) => (
                      <MemberRow
                        key={person.id}
                        person={person}
                        rightBadge={
                          person.lead
                            ? <span className="badge badge-info">หัวหน้างาน</span>
                            : <span className="badge badge-secondary">ช่าง</span>
                        }
                      />
                    ))
                  ) : (
                    <div className="empty-state text-sm text-muted">ยังไม่มีสมาชิกในทีมนี้</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {unassigned.length > 0 && (
        <div className="section-block">
          <h3>ช่างที่ยังไม่สังกัดทีม ({unassigned.length})</h3>
          <div className="ds-card">
            <div className="ds-card-content">
              {unassigned.map((person) => (
                <MemberRow
                  key={person.id}
                  person={person}
                  rightBadge={<span className="badge badge-warning">รอจัดเข้าทีม</span>}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
