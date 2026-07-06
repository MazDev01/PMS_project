"use client";

// ติดตามหลักฐานหน้างาน (Evidence Tracker) — QA view for admins.
// Shows which jobs are missing before/during/after site photos and flags jobs
// that were CLOSED (done) without any evidence trail. Reads photo data from
// db.uploads (keyed by jobId) via useStore — never a per-job hook (Rules of Hooks).

import { useState } from "react";
import Link from "next/link";
import StatCard from "@/app/components/StatCard";
import DataTable from "@/app/components/DataTable";
import { useTableRows, TableToolbar } from "@/app/components/TableControls";
import {
  IconBriefcase, IconCheckCircle, IconImage, IconAlertTriangle, IconEye,
} from "@/app/components/icons";
import { jobStatusLabel, jobStatusBadgeClass } from "@/app/lib/mockData";
import { useJobs, useTeams, useStore } from "@/app/lib/store";
import { formatDateTH } from "@/app/lib/format";

const COMPLETENESS_BADGE = {
  "ครบ": "badge-success",
  "บางส่วน": "badge-warning",
  "ขาด": "badge-destructive",
};

export default function AdminTeamEvidencePage() {
  const [jobList] = useJobs();
  const [teamList] = useTeams();
  const { db } = useStore();

  const [teamFilter, setTeamFilter] = useState("all");
  const [onlyMissing, setOnlyMissing] = useState(false);

  // Jobs that REQUIRE an evidence trail.
  const trackedJobs = jobList
    .filter((j) => j.status === "in_progress" || j.status === "done" || j.status === "repair")
    .map((job) => {
      const up = db.uploads[job.id] || {};
      const hasBefore = (up.before?.length || 0) > 0;
      const hasDuring = (up.during?.length || 0) > 0;
      const hasAfter = (up.after?.length || 0) > 0;
      const totalPhotos = (up.before?.length || 0) + (up.during?.length || 0) + (up.after?.length || 0);
      const hasDelivery = !!up.deliveryFileName;
      const completeness = hasBefore && hasDuring && hasAfter
        ? "ครบ"
        : (hasBefore || hasDuring || hasAfter)
          ? "บางส่วน"
          : "ขาด";
      const criticalMissing = job.status === "done" && totalPhotos === 0;
      return { ...job, hasBefore, hasDuring, hasAfter, totalPhotos, hasDelivery, completeness, criticalMissing };
    });

  // KPI figures over the full tracked set (before team/missing filters).
  const completeCount = trackedJobs.filter((j) => j.completeness === "ครบ").length;
  const incompleteCount = trackedJobs.filter((j) => j.completeness !== "ครบ").length;
  const criticalCount = trackedJobs.filter((j) => j.criticalMissing).length;
  const completePct = trackedJobs.length > 0 ? Math.round((completeCount / trackedJobs.length) * 100) : 0;

  // Filter pipeline: team → onlyMissing.
  const scoped = trackedJobs
    .filter((j) => teamFilter === "all" || (j.teams || [j.team]).includes(teamFilter))
    .filter((j) => !onlyMissing || j.completeness !== "ครบ");

  const { search, setSearch, sortBy, setSortBy, rows, resultCount, isFiltered } = useTableRows(scoped, {
    searchFields: (r) => [r.id, r.customer, r.team],
    sortOptions: [
      { key: "scheduledDate", label: "วันนัดหมาย", compare: (a, b) => a.scheduledDate.localeCompare(b.scheduledDate) },
      { key: "status", label: "สถานะงาน", compare: (a, b) => a.status.localeCompare(b.status) },
      { key: "completeness", label: "จำนวนรูป (น้อย→มาก)", compare: (a, b) => a.totalPhotos - b.totalPhotos },
    ],
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>ติดตามหลักฐานหน้างาน</h2>
          <p>ตรวจว่าทีมช่างอัปโหลดรูปก่อน/ขณะ/หลัง และเอกสารส่งมอบครบหรือยัง — เน้นงานที่ปิดโดยไม่มีหลักฐาน</p>
        </div>
      </div>

      {/* KPI strip over tracked jobs */}
      <div className="kpi-grid">
        <StatCard
          label="งานที่ต้องมีหลักฐาน"
          value={trackedJobs.length}
          icon={<IconBriefcase size={19} />}
          subLabel="งานที่กำลังทำ / เสร็จ / ซ่อม"
        />
        <StatCard
          label="หลักฐานครบ"
          value={completeCount}
          icon={<IconCheckCircle size={19} />}
          deltaText={`${completePct}%`}
          deltaTone="success"
        />
        <StatCard
          label="หลักฐานไม่ครบ"
          value={incompleteCount}
          icon={<IconImage size={19} />}
          deltaText="ต้องติดตามให้ครบ"
          deltaTone="warning"
        />
        <StatCard
          label="งานปิดแล้วแต่ไม่มีรูป"
          value={criticalCount}
          icon={<IconAlertTriangle size={19} />}
          deltaText={criticalCount > 0 ? "ต้องตามด่วน" : "ไม่มี"}
          deltaTone={criticalCount > 0 ? "destructive" : "success"}
        />
      </div>

      <div className="section-block">
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="ค้นหาเลขที่งาน / ลูกค้า / ทีมช่าง..."
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOptions={[
            { key: "scheduledDate", label: "วันนัดหมาย" },
            { key: "status", label: "สถานะงาน" },
            { key: "completeness", label: "จำนวนรูป (น้อย→มาก)" },
          ]}
        >
          <select
            className="ds-input"
            style={{ flex: "0 1 220px" }}
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            <option value="all">ทุกทีมช่าง</option>
            {teamList.map((t) => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
          <button
            type="button"
            className={`btn btn-sm ${onlyMissing ? "btn-default" : "btn-outline"}`}
            onClick={() => setOnlyMissing((v) => !v)}
          >
            แสดงเฉพาะงานที่หลักฐานไม่ครบ
          </button>
        </TableToolbar>

        {isFiltered && (
          <div className="text-xs text-muted" style={{ marginBottom: "0.5rem" }}>
            แสดง {resultCount} รายการ
          </div>
        )}

        <DataTable
          columns={[
            { key: "id", label: "เลขที่งาน" },
            { key: "team", label: "ทีมช่าง" },
            { key: "customer", label: "ลูกค้า" },
            {
              key: "status",
              label: "สถานะงาน",
              render: (r) => <span className={`badge ${jobStatusBadgeClass(r.status)}`}>{jobStatusLabel(r.status)}</span>,
            },
            {
              key: "before",
              label: "ก่อนทำ",
              render: (r) => <span className={`badge ${r.hasBefore ? "badge-success" : "badge-secondary"}`}>{r.hasBefore ? "✓" : "✗"}</span>,
            },
            {
              key: "during",
              label: "ขณะทำ",
              render: (r) => <span className={`badge ${r.hasDuring ? "badge-success" : "badge-secondary"}`}>{r.hasDuring ? "✓" : "✗"}</span>,
            },
            {
              key: "after",
              label: "หลังทำ",
              render: (r) => <span className={`badge ${r.hasAfter ? "badge-success" : "badge-secondary"}`}>{r.hasAfter ? "✓" : "✗"}</span>,
            },
            {
              key: "delivery",
              label: "ใบส่งมอบ",
              render: (r) => <span className={`badge ${r.hasDelivery ? "badge-success" : "badge-secondary"}`}>{r.hasDelivery ? "มี" : "ไม่มี"}</span>,
            },
            {
              key: "completeness",
              label: "ความครบถ้วน",
              render: (r) => <span className={`badge ${COMPLETENESS_BADGE[r.completeness]}`}>{r.completeness}</span>,
            },
            {
              key: "scheduledDate",
              label: "วันนัดหมาย",
              render: (r) => <span className="text-sm">{formatDateTH(r.scheduledDate)}</span>,
            },
            {
              key: "actions",
              label: "",
              render: (r) => (
                <Link href={`/coordinator/jobs/${r.id}`} className="btn btn-icon btn-ghost" title="ดูรายละเอียดงาน">
                  <IconEye size={16} />
                </Link>
              ),
            },
          ]}
          rows={rows}
          rowClassName={(r) => (r.criticalMissing ? "row-accent-destructive" : "")}
          emptyMessage="ไม่พบงานตามเงื่อนไข"
        />
      </div>
    </div>
  );
}
