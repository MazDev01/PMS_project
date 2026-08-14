"use client";

import { useState } from "react";
import Link from "next/link";
import DataTable from "@/app/components/DataTable";
import StatCard from "@/app/components/StatCard";
import JobFormModal from "@/app/components/JobFormModal";
import Modal from "@/app/components/Modal";
import ViewOnlyBanner from "@/app/components/ViewOnlyBanner";
import {
  IconPlus, IconEdit, IconTrash, IconBriefcase, IconEye, IconDownload,
  IconClock, IconCheckCircle, IconAlertTriangle,
} from "@/app/components/icons";
import { useTableRows, TableToolbar } from "@/app/components/TableControls";
import {
  jobStatusLabel, jobStatusBadgeClass, TODAY_ISO, chartBlueShades, scopeJobsToSession,
} from "@/app/lib/mockData";
import { formatAddress } from "@/app/lib/thaiAddress";
import { useJobs, useTeams, useStore } from "@/app/lib/store";
import { useAuth } from "@/app/lib/auth";
import { formatDateTH, formatTHB } from "@/app/lib/format";
import { exportToCSV } from "@/app/lib/csv";

const STATUS_FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "in_progress", label: "กำลังดำเนินการ" },
  { key: "done", label: "เสร็จสิ้นแล้ว" },
  { key: "repair", label: "แจ้งซ่อม" },
];

export default function CoordinatorJobsPage() {
  const [jobList, setJobList] = useJobs();
  const [teams] = useTeams();
  const { addAuditLog } = useStore();
  const { session } = useAuth();
  const actor = session?.name || "นภัสสร ใจดี";
  const actorRole = session?.role || "coordinator";
  // Admin/executive can browse a coordinator's pages but not act on them.
  const viewOnly = session?.role !== "coordinator";
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // A coordinator only sees jobs they own; an admin/executive sees every job.
  const visibleJobs = scopeJobsToSession(jobList, session);
  const countInProgress = visibleJobs.filter((j) => j.status === "in_progress").length;
  const countDone = visibleJobs.filter((j) => j.status === "done").length;
  const countRepair = visibleJobs.filter((j) => j.status === "repair").length;
  const outstandingValue = visibleJobs.filter((j) => j.paymentStatus !== "ชำระแล้ว").reduce((s, j) => s + (j.amount || 0), 0);
  const statusFiltered = statusFilter === "all" ? visibleJobs : visibleJobs.filter((j) => j.status === statusFilter);
  const { search, setSearch, sortBy, setSortBy, rows: filteredJobs, resultCount, isFiltered } = useTableRows(statusFiltered, {
    searchFields: (j) => [j.id, j.customer, j.jobType, ...(j.teams || [j.team])],
    sortOptions: [
      { key: "scheduledDate", label: "เรียงตามวันนัดหมาย (ใกล้สุดก่อน)", compare: (a, b) => a.scheduledDate.localeCompare(b.scheduledDate) },
      { key: "amount", label: "เรียงตามยอดเงิน (มาก→น้อย)", compare: (a, b) => b.amount - a.amount },
      { key: "customer", label: "เรียงตามชื่อลูกค้า", compare: (a, b) => a.customer.localeCompare(b.customer, "th") },
      { key: "id", label: "เรียงตามเลขที่งาน", compare: (a, b) => b.id.localeCompare(a.id) },
    ],
  });

  function openNewJobModal() {
    setEditingJob(null);
    setModalOpen(true);
  }

  function handleExport() {
    exportToCSV(
      `job-list-${TODAY_ISO}.csv`,
      [
        { label: "เลขที่งาน", value: (r) => r.id },
        { label: "ลูกค้า", value: (r) => r.customer },
        { label: "ประเภทงาน", value: (r) => r.jobType },
        { label: "ทีมช่าง", value: (r) => (r.teams || [r.team]).join(", ") },
        { label: "ที่อยู่หน้างาน", value: (r) => formatAddress(r.siteAddress) },
        { label: "วันนัดหมาย", value: (r) => formatDateTH(r.scheduledDate) },
        { label: "ยอดเงิน", value: (r) => r.amount },
        { label: "สถานะ", value: (r) => jobStatusLabel(r.status) },
      ],
      filteredJobs
    );
  }

  function handleDelete(id) {
    setJobList((prev) => prev.filter((j) => j.id !== id));
    addAuditLog({ actor, role: actorRole, action: "ลบงานออกจากระบบ", target: id });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>จัดการงาน</h2>
          <p>เพิ่ม แก้ไข และติดตามสถานะงานทั้งหมดในระบบ</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-md btn-outline" onClick={handleExport}>
            <IconDownload size={16} />
            Export CSV
          </button>
          {!viewOnly && (
            <button type="button" className="btn btn-md btn-default" onClick={openNewJobModal}>
              <IconPlus size={16} />
              เปิดงานใหม่
            </button>
          )}
        </div>
      </div>

      {viewOnly && <ViewOnlyBanner />}

      <div className="kpi-grid" style={{ marginBottom: "1rem" }}>
        <StatCard
          label="งานทั้งหมด"
          value={visibleJobs.length}
          icon={<IconBriefcase size={19} />}
          subLabel={`ค้างรับเงินรวม ${formatTHB(outstandingValue)}`}
        />
        <StatCard
          label="กำลังดำเนินการ"
          value={countInProgress}
          icon={<IconClock size={19} />}
          deltaText={visibleJobs.length ? `${Math.round((countInProgress / visibleJobs.length) * 100)}% ของทั้งหมด` : "—"}
          deltaTone="warning"
        />
        <StatCard
          label="เสร็จสิ้นแล้ว"
          value={countDone}
          icon={<IconCheckCircle size={19} />}
          deltaText={visibleJobs.length ? `${Math.round((countDone / visibleJobs.length) * 100)}% ปิดจบ` : "—"}
          deltaTone="success"
        />
        <StatCard
          label="แจ้งซ่อม"
          value={countRepair}
          icon={<IconAlertTriangle size={19} />}
          deltaText={countRepair > 0 ? "ต้องติดตาม" : "ไม่มีค้าง"}
          deltaTone={countRepair > 0 ? "destructive" : "success"}
        />
      </div>

      <div className="ds-tab-list" style={{ marginBottom: "0.75rem" }}>
        {STATUS_FILTERS.map((f) => {
          const count = f.key === "all" ? visibleJobs.length : visibleJobs.filter((j) => j.status === f.key).length;
          return (
            <button
              key={f.key}
              type="button"
              className={`ds-tab ${statusFilter === f.key ? "active" : ""}`}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
              <span
                className="badge badge-ghost"
                style={{ marginLeft: "0.4rem", fontSize: "0.65rem", height: 16, padding: "0 0.4rem" }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="ค้นหา เลขที่งาน / ลูกค้า / ประเภทงาน / ทีมช่าง"
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOptions={[
          { key: "scheduledDate", label: "เรียงตามวันนัดหมาย" },
          { key: "amount", label: "เรียงตามยอดเงิน" },
          { key: "customer", label: "เรียงตามชื่อลูกค้า" },
          { key: "id", label: "เรียงตามเลขที่งาน" },
        ]}
      />
      {isFiltered && <p className="text-xs text-muted" style={{ marginTop: "-0.4rem", marginBottom: "0.75rem" }}>แสดง {resultCount} รายการ</p>}

      {filteredJobs.length === 0 ? (
        <div className="empty-state">
          <IconBriefcase size={40} />
          <div>ไม่พบงานที่ตรงกับเงื่อนไขการค้นหา</div>
        </div>
      ) : (
        <DataTable
          rowClassName={(r) => `row-accent-${r.status === "done" ? "success" : r.status === "repair" ? "destructive" : "warning"}`}
          columns={[
            { key: "id", label: "เลขที่งาน" },
            {
              key: "customer",
              label: "ลูกค้า",
              render: (r) => (
                <div className="flex-row" style={{ gap: "0.5rem" }}>
                  <div className="avatar avatar-sm">{r.customer.slice(0, 1)}</div>
                  {r.customer}
                </div>
              ),
            },
            { key: "jobType", label: "ประเภทงาน" },
            {
              key: "team",
              label: "ทีมช่าง",
              render: (r) => {
                const ts = r.teams || [r.team];
                const teamIdx = Math.max(0, teams.findIndex((t) => t.name === ts[0]));
                return (
                  <span className="flex-row" style={{ gap: "0.4rem" }}>
                    <span className="dot-chip" style={{ background: chartBlueShades[teamIdx % chartBlueShades.length] }} />
                    {ts[0]}
                    {ts.length > 1 && <span className="badge badge-secondary" style={{ fontSize: "0.62rem" }}>+{ts.length - 1}</span>}
                  </span>
                );
              },
            },
            { key: "scheduledDate", label: "วันนัดหมาย", render: (r) => formatDateTH(r.scheduledDate) },
            { key: "amount", label: "ยอดเงิน", render: (r) => <span style={{ fontWeight: 600 }}>{formatTHB(r.amount)}</span> },
            {
              key: "status",
              label: "สถานะ",
              render: (r) => <span className={`badge ${jobStatusBadgeClass(r.status)}`}>{jobStatusLabel(r.status)}</span>,
            },
            {
              key: "actions",
              label: "",
              render: (r) => (
                <div className="flex-row">
                  <Link href={`/coordinator/jobs/${r.id}`} className="btn btn-icon btn-ghost" title="ดูรายละเอียดงาน">
                    <IconEye size={15} />
                  </Link>
                  <button
                    type="button"
                    className="btn btn-icon btn-ghost"
                    title={viewOnly ? "ดูอย่างเดียว — แก้ไขไม่ได้" : (r.status === "done" || r.status === "repair" ? "งานที่ปิดแล้วไม่สามารถแก้ไขได้" : "แก้ไขงาน")}
                    disabled={viewOnly || r.status === "done" || r.status === "repair"}
                    onClick={() => { setEditingJob(r); setModalOpen(true); }}
                  >
                    <IconEdit size={15} />
                  </button>
                  <button type="button" className="btn btn-icon btn-ghost" title={viewOnly ? "ดูอย่างเดียว — ลบไม่ได้" : "ลบงาน"} disabled={viewOnly} onClick={() => setDeleteTarget(r)}>
                    <IconTrash size={15} />
                  </button>
                </div>
              ),
            },
          ]}
          rows={filteredJobs}
        />
      )}

      <JobFormModal
        open={modalOpen}
        editingJob={editingJob}
        onClose={() => { setModalOpen(false); setEditingJob(null); }}
      />

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="ยืนยันการลบงาน"
        description="การลบนี้ไม่สามารถย้อนกลับได้"
        maxWidth={400}
        footer={
          <>
            <button type="button" className="btn btn-md btn-secondary" onClick={() => setDeleteTarget(null)}>ยกเลิก</button>
            <button
              type="button"
              className="btn btn-md btn-destructive"
              onClick={() => { handleDelete(deleteTarget.id); setDeleteTarget(null); }}
            >
              <IconTrash size={14} /> ลบงาน
            </button>
          </>
        }
      >
        {deleteTarget && (
          <div className="text-sm">
            ต้องการลบงาน <strong>{deleteTarget.id}</strong> ของลูกค้า <strong>{deleteTarget.customer}</strong> ({deleteTarget.jobType}) ใช่หรือไม่?
            <div className="text-xs text-muted" style={{ marginTop: "0.5rem" }}>
              ข้อมูลงานนี้จะถูกลบออกจากระบบทันที
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
