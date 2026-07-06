"use client";

import StatCard from "@/app/components/StatCard";
import DataTable from "@/app/components/DataTable";
import { SimpleBarChart } from "@/app/components/charts";
import { IconTruck, IconBriefcase, IconCheckCircle, IconImage, IconAlertTriangle } from "@/app/components/icons";
import { useTableRows, TableToolbar } from "@/app/components/TableControls";
import { TODAY_ISO, chartBlueShades, teamCoverage, specialtyShort } from "@/app/lib/mockData";
import { useTeams, useJobs, usePersonnel, useScheduleEvents, useRepairTickets, useStore } from "@/app/lib/store";

export default function AdminContractorOverviewPage() {
  const [teams] = useTeams();
  const [jobs] = useJobs();
  const [personnel] = usePersonnel();
  const [scheduleEvents] = useScheduleEvents();
  const [repairTickets] = useRepairTickets();
  const { db } = useStore();
  const onTeam = (j, name) => (j.teams || [j.team]).includes(name);

  const todayJobsAllTeams = scheduleEvents.filter((e) => e.date === TODAY_ISO).length;
  const doneJobsAllTeams = jobs.filter((j) => j.status === "done").length;
  const overdueJobsAllTeams = jobs.filter((j) => j.status === "in_progress" && j.scheduledDate < TODAY_ISO).length;
  const uploadsToday = Object.keys(db.uploads).filter((jobId) => {
    const u = db.uploads[jobId];
    return u.before.length || u.during.length || u.after.length;
  }).length;

  const teamWorkload = teams.map((t, i) => ({
    id: t.id,
    name: t.name,
    specialty: teamCoverage(t.id, personnel).map((c) => specialtyShort[c] || c).join(", ") || "—",
    activeJobs: jobs.filter((j) => onTeam(j, t.name) && j.status === "in_progress").length,
    todayJobs: scheduleEvents.filter((e) => e.team === t.name && e.date === TODAY_ISO).length,
    doneJobs: jobs.filter((j) => onTeam(j, t.name) && j.status === "done").length,
    overdueJobs: jobs.filter((j) => onTeam(j, t.name) && j.status === "in_progress" && j.scheduledDate < TODAY_ISO).length,
    openRepairTickets: repairTickets.filter((rt) => rt.team === t.name && rt.status !== "closed").length,
    color: chartBlueShades[i % chartBlueShades.length],
  }));

  const { search, setSearch, sortBy, setSortBy, rows: workloadRows, resultCount, isFiltered } = useTableRows(teamWorkload, {
    searchFields: (t) => [t.name, t.specialty],
    sortOptions: [
      { key: "default", label: "เรียงตามลำดับเดิม" },
      { key: "activeJobs", label: "เรียงตามงานที่กำลังทำ (มาก→น้อย)", compare: (a, b) => b.activeJobs - a.activeJobs },
      { key: "overdueJobs", label: "เรียงตามงานเลยกำหนด (มาก→น้อย)", compare: (a, b) => b.overdueJobs - a.overdueJobs },
      { key: "name", label: "เรียงตามชื่อทีม", compare: (a, b) => a.name.localeCompare(b.name, "th") },
    ],
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>ภาพรวมทีมช่าง</h2>
          <p>มุมมองผู้ดูแลระบบ — สรุปภาระงานของทีมช่างทุกทีมในระบบ ณ วันที่ {TODAY_ISO}</p>
        </div>
      </div>

      <div className="kpi-grid">
        <StatCard label="ทีมช่างทั้งหมด" value={teams.length} icon={<IconTruck size={18} />} deltaText="ทุกทีมในระบบ" deltaTone="secondary" />
        <StatCard label="งานวันนี้ (ทุกทีม)" value={todayJobsAllTeams} icon={<IconBriefcase size={18} />} deltaText="ตามคิวที่วางแผนไว้" deltaTone="warning" />
        <StatCard label="งานเสร็จสิ้นแล้ว" value={doneJobsAllTeams} icon={<IconCheckCircle size={18} />} deltaText="สะสมทั้งหมด" deltaTone="success" />
        <StatCard label="งานที่มีรูปอัปโหลดแล้ว" value={uploadsToday} icon={<IconImage size={18} />} deltaText="รูปหน้างาน/ใบส่งมอบ" deltaTone="secondary" />
        <StatCard label="งานเลยกำหนดนัดหมาย" value={overdueJobsAllTeams} icon={<IconAlertTriangle size={18} />} deltaText={overdueJobsAllTeams > 0 ? "ควรติดตามด่วน" : "ไม่มีงานค้าง"} deltaTone={overdueJobsAllTeams > 0 ? "destructive" : "success"} />
      </div>

      <div className="ds-card section-block chart-card-wrap">
        <div className="ds-card-header">
          <div className="ds-card-title">จำนวนงานที่กำลังทำ แยกตามทีมช่าง</div>
        </div>
        <div className="ds-card-content">
          <SimpleBarChart data={teamWorkload.map((t) => ({ label: t.name.replace("ทีมช่าง", ""), value: t.activeJobs, color: t.color }))} />
        </div>
      </div>

      <div className="section-block">
        <h3>ภาระงานของทีมช่างทุกทีม</h3>
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="ค้นหา ชื่อทีม / ความเชี่ยวชาญ"
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOptions={[
            { key: "default", label: "เรียงตามลำดับเดิม" },
            { key: "activeJobs", label: "เรียงตามงานที่กำลังทำ" },
            { key: "overdueJobs", label: "เรียงตามงานเลยกำหนด" },
            { key: "name", label: "เรียงตามชื่อทีม" },
          ]}
        />
        {isFiltered && <p className="text-xs text-muted" style={{ marginTop: "-0.4rem", marginBottom: "0.75rem" }}>แสดง {resultCount} รายการ</p>}
        <DataTable
          columns={[
            { key: "name", label: "ทีมช่าง" },
            { key: "specialty", label: "ความเชี่ยวชาญ" },
            { key: "activeJobs", label: "งานที่กำลังทำ" },
            { key: "todayJobs", label: "งานวันนี้" },
            { key: "doneJobs", label: "เสร็จสิ้นแล้ว" },
            {
              key: "overdueJobs",
              label: "เลยกำหนด",
              render: (r) => (r.overdueJobs > 0 ? <span className="badge badge-destructive">{r.overdueJobs}</span> : "-"),
            },
            {
              key: "openRepairTickets",
              label: "เคสแจ้งซ่อมเปิดอยู่",
              render: (r) => (r.openRepairTickets > 0 ? <span className="badge badge-warning">{r.openRepairTickets}</span> : "-"),
            },
          ]}
          rows={workloadRows}
        />
      </div>
    </div>
  );
}
