"use client";

import { useState } from "react";
import Link from "next/link";
import StatCard from "@/app/components/StatCard";
import {
  IconUsers, IconClock, IconCheckCircle, IconAlertTriangle, IconEye,
  IconChevronDown,
} from "@/app/components/icons";
import {
  teamPerformanceDetailed, teamCoverage, specialtyShort, TODAY_ISO,
} from "@/app/lib/mockData";
import { useJobs, useTeams, usePersonnel } from "@/app/lib/store";
import { formatDateTH } from "@/app/lib/format";

const TEAM_STATUS_BADGE = {
  working: { cls: "badge-info", label: "กำลังทำงาน" },
  available: { cls: "badge-success", label: "ว่าง" },
  leave: { cls: "badge-warning", label: "มีคนลา" },
};

const JOBS_PREVIEW = 5;

// One team card. Kept as its own component so each card owns its expand state
// (a hook can't live inside the .map over teams). Collapsed, it shows the first
// JOBS_PREVIEW jobs with a "ดูเพิ่มเติม" button; expanded, it shows all.
function TeamDispatchCard({ team, activeJobs, status, coverage }) {
  const [expanded, setExpanded] = useState(false);
  const target = team.monthlyJobTarget || 0;
  const overloaded = target > 0 && activeJobs.length > target;
  const pct = target > 0 ? Math.min(100, (activeJobs.length / target) * 100) : (activeJobs.length > 0 ? 100 : 0);
  const badge = TEAM_STATUS_BADGE[status] || TEAM_STATUS_BADGE.available;
  const shownJobs = expanded ? activeJobs : activeJobs.slice(0, JOBS_PREVIEW);
  const extraCount = activeJobs.length - JOBS_PREVIEW;

  return (
    <div className="ds-card">
      <div className="ds-card-header">
        <div className="flex-between" style={{ gap: "0.5rem" }}>
          <div className="ds-card-title">{team.name}</div>
          <span className={`badge ${badge.cls}`}>{badge.label}</span>
        </div>
      </div>
      <div className="ds-card-content" style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
        {/* Specialty coverage */}
        <div className="flex-row" style={{ gap: "0.35rem", flexWrap: "wrap" }}>
          {coverage.length ? (
            coverage.map((s) => (
              <span key={s} className="badge badge-secondary">{specialtyShort[s] || s}</span>
            ))
          ) : (
            <span className="text-xs text-muted">ยังไม่ระบุความเชี่ยวชาญ</span>
          )}
        </div>

        {/* Workload bar */}
        <div>
          <div className="progress-label">
            <span className="text-sm text-muted">ภาระงาน</span>
            <span style={{ fontWeight: 700, color: overloaded ? "var(--destructive)" : "var(--foreground)" }}>
              {activeJobs.length}/{target}
            </span>
          </div>
          <div className="progress-track">
            <div
              className="progress-bar"
              style={{ width: `${pct}%`, background: overloaded ? "var(--destructive)" : "var(--primary)" }}
            />
          </div>
        </div>

        {/* Active jobs list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {activeJobs.length === 0 ? (
            <div className="text-sm text-muted">ว่าง — ยังไม่มีงานที่กำลังทำ</div>
          ) : (
            <>
              {shownJobs.map((job) => {
                const overdue = job.scheduledDate < TODAY_ISO;
                return (
                  <Link key={job.id} href={`/coordinator/jobs/${job.id}`} className="list-row">
                    <div className="list-row-main" style={{ minWidth: 0 }}>
                      <div className="flex-row" style={{ gap: "0.4rem", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600 }}>{job.id}</span>
                        {overdue && <span className="badge badge-destructive">เกินกำหนด</span>}
                      </div>
                      <div className="text-xs text-muted">{job.customer} · {formatDateTH(job.scheduledDate)}</div>
                    </div>
                    <IconEye size={14} />
                  </Link>
                );
              })}
              {extraCount > 0 && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline btn-block"
                  style={{ marginTop: "0.3rem" }}
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded ? "ย่อรายการ" : `ดูเพิ่มเติมอีก ${extraCount} งาน`}
                  <IconChevronDown size={14} style={{ transform: expanded ? "rotate(180deg)" : undefined, transition: "transform 0.15s" }} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminTeamDispatchPage() {
  const [jobs] = useJobs();
  const [teams] = useTeams();
  const [personnel] = usePersonnel();

  const perf = teamPerformanceDetailed(jobs, teams);

  const jobsForTeam = (teamName) => jobs.filter((j) => (j.teams || [j.team]).includes(teamName));

  // Build a per-team dispatch row (no hooks inside this map — all data comes
  // from the plain jobs/teams/personnel arrays already read above).
  const rows = teams.map((team) => {
    const teamJobs = jobsForTeam(team.name);
    const activeJobs = teamJobs.filter((j) => j.status === "in_progress");
    const overdueJobs = activeJobs.filter((j) => j.scheduledDate < TODAY_ISO);
    const perfRow = perf.find((p) => p.id === team.id);
    const status = perfRow ? perfRow.status : "available";
    const coverage = teamCoverage(team.id, personnel);
    return { team, activeJobs, overdueJobs, status, coverage };
  });

  // Busiest teams first, so an overloaded crew is the first thing a manager sees.
  const sortedRows = [...rows].sort((a, b) => b.activeJobs.length - a.activeJobs.length);

  const workingCount = perf.filter((p) => p.status === "working").length;
  const availableCount = perf.filter((p) => p.status === "available").length;
  const leaveCount = perf.filter((p) => p.status === "leave").length;
  const overdueTotal = rows.reduce((s, r) => s + r.overdueJobs.length, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>กระดานจ่ายงานทีมช่าง</h2>
          <p>ดูภาระงานรายทีม จัดสมดุลการจ่ายงาน — ทีมไหนงานล้น ทีมไหนว่าง ใครลา</p>
        </div>
      </div>

      {/* KPI strip — team availability at a glance */}
      <div className="kpi-grid">
        <StatCard
          label="ทีมทั้งหมด"
          value={teams.length}
          icon={<IconUsers size={19} />}
          subLabel={overdueTotal > 0 ? `มีงานเลยกำหนดรวม ${overdueTotal} งาน` : "ไม่มีงานเลยกำหนด"}
        />
        <StatCard
          label="ทีมกำลังทำงาน"
          value={workingCount}
          icon={<IconClock size={19} />}
          deltaText="มีงานที่กำลังดำเนินการ"
          deltaTone="success"
        />
        <StatCard
          label="ทีมว่าง (พร้อมรับงาน)"
          value={availableCount}
          icon={<IconCheckCircle size={19} />}
          deltaText={availableCount > 0 ? "จ่ายงานใหม่ได้ทันที" : "ทุกทีมมีงานแล้ว"}
          deltaTone="success"
        />
        <StatCard
          label="ทีมที่มีคนลา"
          value={leaveCount}
          icon={<IconAlertTriangle size={19} />}
          deltaText={leaveCount > 0 ? "ตรวจสอบการจ่ายงาน" : "ไม่มี"}
          deltaTone={leaveCount > 0 ? "warning" : "success"}
        />
      </div>

      {/* Per-team workload board */}
      <div className="section-block">
        <h3>ภาระงานแต่ละทีม</h3>
        <p className="text-xs text-muted" style={{ marginTop: "-0.5rem", marginBottom: "0.75rem" }}>
          เรียงจากทีมที่งานเยอะสุด · ณ วันที่ {formatDateTH(TODAY_ISO)}
        </p>
        <div className="teamperf-grid">
          {sortedRows.map(({ team, activeJobs, status, coverage }) => (
            <TeamDispatchCard
              key={team.id}
              team={team}
              activeJobs={activeJobs}
              status={status}
              coverage={coverage}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
