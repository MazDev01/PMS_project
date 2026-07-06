"use client";

import Link from "next/link";
import StatCard from "@/app/components/StatCard";
import DataTable from "@/app/components/DataTable";
import { useTableRows, TableToolbar } from "@/app/components/TableControls";
import {
  IconAlertTriangle, IconClock, IconCheckCircle, IconEye, IconFileText,
} from "@/app/components/icons";
import { useRepairTickets, useTeams, useJobs } from "@/app/lib/store";
import { formatDateTH } from "@/app/lib/format";
import { useState } from "react";

const priorityLabel = { high: "สูง", medium: "กลาง", low: "ต่ำ" };
const priorityBadge = { high: "badge-destructive", medium: "badge-warning", low: "badge-secondary" };
const statusLabel = { open: "เปิดเคส", in_progress: "กำลังดำเนินการ", closed: "ปิดเคสแล้ว" };
const statusBadge = { open: "badge-destructive", in_progress: "badge-warning", closed: "badge-success" };

export default function AdminTeamRepairsPage() {
  const [tickets] = useRepairTickets();
  const [teams] = useTeams();
  const [jobs] = useJobs();

  const [teamFilter, setTeamFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const jobExists = (jobId) => jobId && jobs.some((j) => j.id === jobId);

  // ── KPI counts ────────────────────────────────────────────────
  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const closedCount = tickets.filter((t) => t.status === "closed").length;
  const highOpenCount = tickets.filter((t) => t.priority === "high" && t.status !== "closed").length;
  const closedPct = tickets.length ? Math.round((closedCount / tickets.length) * 100) : 0;

  // ── Per-team open backlog (open + in_progress) ────────────────
  const teamSummary = teams
    .map((tm) => ({
      name: tm.name,
      total: tickets.filter((t) => t.team === tm.name).length,
      openCount: tickets.filter((t) => t.team === tm.name && t.status !== "closed").length,
    }))
    .filter((s) => s.total > 0)
    .sort((a, b) => b.openCount - a.openCount);
  const maxOpen = Math.max(1, ...teamSummary.map((s) => s.openCount));
  const hasBacklog = teamSummary.some((s) => s.openCount > 0);

  // ── Table: apply team + status filters BEFORE useTableRows ────
  const filteredTickets = tickets.filter(
    (t) =>
      (teamFilter === "all" || t.team === teamFilter) &&
      (statusFilter === "all" || t.status === statusFilter)
  );

  const { search, setSearch, sortBy, setSortBy, rows, resultCount, isFiltered } = useTableRows(filteredTickets, {
    searchFields: (r) => [r.id, r.customer, r.issue, r.team],
    sortOptions: [
      { key: "reportedDate", label: "วันที่แจ้งล่าสุด", compare: (a, b) => (a.reportedDate < b.reportedDate ? 1 : -1) },
      { key: "priority", label: "ความสำคัญ", compare: (a, b) => {
        const rank = { high: 0, medium: 1, low: 2 };
        return rank[a.priority] - rank[b.priority];
      } },
      { key: "team", label: "ทีมช่าง", compare: (a, b) => a.team.localeCompare(b.team, "th") },
    ],
  });

  const columns = [
    { key: "id", label: "เลขที่เคส", render: (r) => <span style={{ fontWeight: 600 }}>{r.id}</span> },
    { key: "team", label: "ทีมช่าง" },
    { key: "customer", label: "ลูกค้า" },
    {
      key: "issue",
      label: "อาการ/ปัญหา",
      render: (r) => (
        <span title={r.issue}>{r.issue.length > 40 ? `${r.issue.slice(0, 40)}…` : r.issue}</span>
      ),
    },
    {
      key: "priority",
      label: "ความสำคัญ",
      render: (r) => <span className={`badge ${priorityBadge[r.priority]}`}>{priorityLabel[r.priority]}</span>,
    },
    {
      key: "status",
      label: "สถานะ",
      render: (r) => <span className={`badge ${statusBadge[r.status]}`}>{statusLabel[r.status]}</span>,
    },
    { key: "reportedDate", label: "วันที่แจ้ง", render: (r) => formatDateTH(r.reportedDate) },
    {
      key: "actions",
      label: "",
      render: (r) =>
        jobExists(r.jobId) ? (
          <Link href={`/coordinator/jobs/${r.jobId}`} className="btn btn-icon btn-ghost" title="ดูงานที่เกี่ยวข้อง">
            <IconEye size={16} />
          </Link>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>คิวเคสแจ้งซ่อมรายทีม</h2>
          <p>ติดตามเคสแจ้งซ่อม/เคลมประกัน จัดกลุ่มตามทีมช่างที่รับผิดชอบ พร้อมสถานะการปิดเคส</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpi-grid">
        <StatCard
          label="เคสทั้งหมด"
          value={tickets.length}
          icon={<IconFileText size={19} />}
        />
        <StatCard
          label="เปิดค้างอยู่"
          value={openCount}
          icon={<IconAlertTriangle size={19} />}
          subLabel={`ความสำคัญสูง ${highOpenCount} เคส`}
          deltaText={openCount > 0 ? "รอดำเนินการ" : "ไม่มีเคสค้าง"}
          deltaTone={openCount > 0 ? "destructive" : "success"}
        />
        <StatCard
          label="กำลังดำเนินการ"
          value={inProgressCount}
          icon={<IconClock size={19} />}
          deltaText={inProgressCount > 0 ? "อยู่ระหว่างซ่อม" : "ไม่มี"}
          deltaTone="warning"
        />
        <StatCard
          label="ปิดเคสแล้ว"
          value={closedCount}
          icon={<IconCheckCircle size={19} />}
          deltaText={`${closedPct}%`}
          deltaTone="success"
        />
      </div>

      {/* Per-team open backlog */}
      <div className="section-block">
        <div className="ds-card">
          <div className="ds-card-header">
            <div className="ds-card-title">เคสค้างรายทีม (เปิด + กำลังทำ)</div>
            <div className="ds-card-desc">จำนวนเคสที่ยังไม่ปิด แยกตามทีมช่างที่รับผิดชอบ · เรียงจากทีมที่ค้างมากสุด</div>
          </div>
          <div className="ds-card-content">
            {hasBacklog ? (
              <div className="teamperf-list">
                {teamSummary
                  .filter((s) => s.openCount > 0)
                  .map((s, idx) => (
                    <div key={s.name} className="teamperf-row">
                      <div className="progress-label">
                        <span className="text-sm">{s.name}</span>
                        <span className="text-sm" style={{ fontWeight: 700 }}>{s.openCount} เคส</span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-bar"
                          style={{
                            width: `${(s.openCount / maxOpen) * 100}%`,
                            background: idx === 0 ? "var(--destructive)" : "var(--primary)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-sm text-muted">ไม่มีเคสค้าง</div>
            )}
          </div>
        </div>
      </div>

      {/* Full ticket list */}
      <div className="section-block">
        <h3>รายการเคสแจ้งซ่อมทั้งหมด</h3>
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="ค้นหาเลขที่เคส / ลูกค้า / อาการ / ทีม..."
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOptions={[
            { key: "reportedDate", label: "วันที่แจ้งล่าสุด" },
            { key: "priority", label: "ความสำคัญ" },
            { key: "team", label: "ทีมช่าง" },
          ]}
        >
          <select
            className="ds-input"
            style={{ flex: "0 1 200px" }}
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            <option value="all">ทุกทีมช่าง</option>
            {teams.map((tm) => (
              <option key={tm.id} value={tm.name}>{tm.name}</option>
            ))}
          </select>
          <select
            className="ds-input"
            style={{ flex: "0 1 200px" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">ทุกสถานะ</option>
            <option value="open">เปิดเคส</option>
            <option value="in_progress">กำลังดำเนินการ</option>
            <option value="closed">ปิดเคสแล้ว</option>
          </select>
        </TableToolbar>

        {isFiltered && (
          <div className="text-xs text-muted" style={{ marginBottom: "0.5rem" }}>แสดง {resultCount} รายการ</div>
        )}

        <DataTable
          columns={columns}
          rows={rows}
          rowClassName={(r) => (r.priority === "high" && r.status !== "closed" ? "row-accent-destructive" : undefined)}
          emptyMessage="ไม่พบเคสตามเงื่อนไข"
        />
      </div>
    </div>
  );
}
