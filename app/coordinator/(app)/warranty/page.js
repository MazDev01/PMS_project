"use client";

import { useState } from "react";
import Modal from "@/app/components/Modal";
import DataTable from "@/app/components/DataTable";
import ViewOnlyBanner from "@/app/components/ViewOnlyBanner";
import Tabs from "@/app/components/Tabs";
import StatCard from "@/app/components/StatCard";
import FileDropzone from "@/app/components/FileDropzone";
import { IconPlus, IconShield, IconBriefcase, IconAlertTriangle } from "@/app/components/icons";
import { useTableRows, TableToolbar } from "@/app/components/TableControls";
import { TODAY_ISO } from "@/app/lib/mockData";
import { useJobs, useWarranties, useRepairTickets, useStore } from "@/app/lib/store";
import { useAuth } from "@/app/lib/auth";
import { formatDateTH } from "@/app/lib/format";

function warrantyProgressClass(percentLeft) {
  if (percentLeft < 20) return "danger";
  if (percentLeft < 50) return "secondary";
  return "success";
}

// Whole days from today until an ISO date (warranty end date).
function daysUntil(iso) {
  if (!iso) return 0;
  const [ty, tm, td] = TODAY_ISO.split("-").map(Number);
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(ty, tm - 1, td)) / 86400000);
}

function priorityLabel(p) {
  return { high: "สูง", medium: "กลาง", low: "ต่ำ" }[p] || p;
}
function priorityBadgeClass(p) {
  return { high: "badge-destructive", medium: "badge-warning", low: "badge-secondary" }[p] || "badge-secondary";
}
function ticketStatusLabel(s) {
  return { open: "เปิดเคส", in_progress: "กำลังดำเนินการ", closed: "ปิดเคสแล้ว" }[s] || s;
}
function ticketStatusBadgeClass(s) {
  return { open: "badge-warning", in_progress: "badge-info", closed: "badge-success" }[s] || "badge-secondary";
}

function WarrantyPanel() {
  const [warranties] = useWarranties();
  const [statusFilter, setStatusFilter] = useState("all");

  const statusFiltered = statusFilter === "all" ? warranties : warranties.filter((w) => w.status === statusFilter);
  const { search, setSearch, sortBy, setSortBy, rows: filtered, resultCount, isFiltered } = useTableRows(statusFiltered, {
    searchFields: (w) => [w.customer, w.jobId],
    sortOptions: [
      { key: "percentLeft", label: "เรียงตามระยะเวลาคงเหลือ (น้อย→มาก)", compare: (a, b) => a.percentLeft - b.percentLeft },
      { key: "endDate", label: "เรียงตามวันหมดอายุ", compare: (a, b) => a.endDate.localeCompare(b.endDate) },
      { key: "customer", label: "เรียงตามชื่อลูกค้า", compare: (a, b) => a.customer.localeCompare(b.customer, "th") },
    ],
  });

  return (
    <div>
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="ค้นหา ชื่อลูกค้า / เลขที่งาน"
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOptions={[
          { key: "percentLeft", label: "เรียงตามระยะเวลาคงเหลือ" },
          { key: "endDate", label: "เรียงตามวันหมดอายุ" },
          { key: "customer", label: "เรียงตามชื่อลูกค้า" },
        ]}
      >
        <select className="ds-select" style={{ maxWidth: 220 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">ทั้งหมด</option>
          <option value="active">อยู่ในการคุ้มครอง</option>
          <option value="expired">หมดอายุ</option>
        </select>
      </TableToolbar>
      {isFiltered && <p className="text-xs text-muted" style={{ marginTop: "-0.4rem", marginBottom: "0.75rem" }}>แสดง {resultCount} รายการ</p>}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <IconShield size={40} />
          <div>ไม่พบข้อมูลประกันที่ตรงกับเงื่อนไขการค้นหา</div>
        </div>
      ) : (
        <DataTable
          rowClassName={(r) => (r.status !== "active" ? "" : r.percentLeft < 20 ? "row-accent-destructive" : r.percentLeft < 50 ? "row-accent-warning" : "row-accent-success")}
          columns={[
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
            { key: "jobId", label: "งาน" },
            { key: "months", label: "ระยะเวลารับประกัน", render: (r) => `${r.months} เดือน` },
            {
              key: "period",
              label: "เริ่ม–หมดอายุ",
              render: (r) => `${formatDateTH(r.startDate)} – ${formatDateTH(r.endDate)}`,
            },
            {
              key: "percentLeft",
              label: "ระยะเวลาคงเหลือ",
              render: (r) => {
                const daysLeft = daysUntil(r.endDate);
                return (
                  <div style={{ minWidth: 130 }}>
                    <div className="progress-label">
                      <span style={{ fontWeight: 600 }}>
                        {daysLeft > 0 ? `เหลือ ${daysLeft.toLocaleString("th-TH")} วัน` : "หมดอายุแล้ว"}
                      </span>
                    </div>
                    <div className="progress-track">
                      <div className={`progress-bar ${warrantyProgressClass(r.percentLeft)}`} style={{ width: `${r.percentLeft}%` }} />
                    </div>
                  </div>
                );
              },
            },
            {
              key: "status",
              label: "สถานะ",
              render: (r) => (
                <span className={`badge ${r.status === "active" ? "badge-success" : "badge-secondary"}`}>
                  {r.status === "active" ? "อยู่ในการคุ้มครอง" : "หมดอายุ"}
                </span>
              ),
            },
          ]}
          rows={filtered}
        />
      )}
    </div>
  );
}

function RepairPanel() {
  const [jobs] = useJobs();
  const [tickets, setTickets] = useRepairTickets();
  const { addAuditLog, addNotification } = useStore();
  const { session } = useAuth();
  const actor = session?.name || "นภัสสร ใจดี";
  const actorRole = session?.role || "coordinator";
  const viewOnly = session?.role !== "coordinator";
  const [modalOpen, setModalOpen] = useState(false);

  function handleCreateTicket(e) {
    e.preventDefault();
    const form = e.target;
    const job = jobs.find((j) => j.id === form.job.value);

    const nums = tickets.map((t) => parseInt(t.id.split("-").pop(), 10)).filter((n) => !Number.isNaN(n));
    const nextNum = (nums.length ? Math.max(...nums) : 0) + 1;
    const newTicket = {
      id: `RT-${nextNum}`,
      customer: job?.customer || "",
      jobId: job?.id || form.job.value,
      issue: form.issue.value.trim() || "-",
      priority: form.priority.value,
      status: "open",
      reportedDate: TODAY_ISO,
      team: job?.team || "-",
    };
    setTickets((prev) => [newTicket, ...prev]);
    addAuditLog({ actor, role: actorRole, action: "เปิดเคสแจ้งซ่อมใหม่", target: newTicket.id });
    addNotification({ audience: "contractor", title: "มีเคสแจ้งซ่อมใหม่", detail: `${newTicket.id} — ${newTicket.customer} (${job?.team || "-"})` });
    setModalOpen(false);
  }

  const { search, setSearch, sortBy, setSortBy, rows, resultCount, isFiltered } = useTableRows(tickets, {
    searchFields: (t) => [t.id, t.customer, t.jobId, t.issue, t.team],
    sortOptions: [
      { key: "default", label: "เรียงตามลำดับล่าสุด" },
      { key: "priority", label: "เรียงตามความสำคัญ (สูง→ต่ำ)", compare: (a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] ?? 3) - ({ high: 0, medium: 1, low: 2 }[b.priority] ?? 3) },
      { key: "status", label: "เรียงตามสถานะ", compare: (a, b) => a.status.localeCompare(b.status) },
      { key: "reportedDate", label: "เรียงตามวันที่แจ้ง", compare: (a, b) => b.reportedDate.localeCompare(a.reportedDate) },
    ],
  });

  return (
    <div>
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="ค้นหา เลขที่เคส / ลูกค้า / งาน / ทีมช่าง"
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOptions={[
          { key: "default", label: "เรียงตามลำดับล่าสุด" },
          { key: "priority", label: "เรียงตามความสำคัญ" },
          { key: "status", label: "เรียงตามสถานะ" },
          { key: "reportedDate", label: "เรียงตามวันที่แจ้ง" },
        ]}
      >
        {!viewOnly && (
          <button type="button" className="btn btn-md btn-default" style={{ marginLeft: "auto" }} onClick={() => setModalOpen(true)}>
            <IconPlus size={16} />
            เปิดเคสแจ้งซ่อมใหม่
          </button>
        )}
      </TableToolbar>
      {isFiltered && <p className="text-xs text-muted" style={{ marginTop: "-0.4rem", marginBottom: "0.75rem" }}>แสดง {resultCount} รายการ</p>}

      {rows.length === 0 ? (
        <div className="empty-state">
          <IconShield size={40} />
          <div>ไม่พบเคสแจ้งซ่อมที่ตรงกับเงื่อนไข</div>
        </div>
      ) : (
      <DataTable
        rowClassName={(r) => (r.status === "closed" ? "row-accent-success" : r.priority === "high" ? "row-accent-destructive" : "row-accent-warning")}
        columns={[
          { key: "id", label: "เลขที่เคส" },
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
          { key: "jobId", label: "งาน" },
          {
            key: "issue",
            label: "รายละเอียด",
            render: (r) => <span title={r.issue}>{r.issue.length > 40 ? `${r.issue.slice(0, 40)}…` : r.issue}</span>,
          },
          {
            key: "priority",
            label: "ระดับความสำคัญ",
            render: (r) => <span className={`badge ${priorityBadgeClass(r.priority)}`}>{priorityLabel(r.priority)}</span>,
          },
          { key: "team", label: "ทีมช่าง" },
          {
            key: "status",
            label: "สถานะ",
            render: (r) => <span className={`badge ${ticketStatusBadgeClass(r.status)}`}>{ticketStatusLabel(r.status)}</span>,
          },
          { key: "reportedDate", label: "วันที่แจ้ง", render: (r) => formatDateTH(r.reportedDate) },
        ]}
        rows={rows}
      />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="เปิดเคสแจ้งซ่อมใหม่"
        description="กรอกรายละเอียดความเสียหายที่ลูกค้าแจ้งเข้ามา"
        footer={
          <>
            <button type="button" className="btn btn-md btn-secondary" onClick={() => setModalOpen(false)}>ยกเลิก</button>
            <button type="submit" form="repair-form" className="btn btn-md btn-default">บันทึก</button>
          </>
        }
      >
        <form id="repair-form" onSubmit={handleCreateTicket}>
          <div className="form-group">
            <label className="ds-label">เลือกลูกค้า/งาน</label>
            <select className="ds-select" name="job" defaultValue={jobs[0].id}>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.id} — {j.customer}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="ds-label">รายละเอียดอาการชำรุดหรือปัญหาที่พบ</label>
            <textarea className="ds-textarea" name="issue" rows={3} placeholder="อธิบายลักษณะความเสียหายที่พบ..." />
          </div>
          <div className="form-group">
            <label className="ds-label">แนบไฟล์รูปภาพความเสียหาย</label>
            <FileDropzone name="photos" accept="image/*" multiple hint="รองรับไฟล์ JPG, PNG หลายไฟล์" />
          </div>
          <div className="form-group">
            <label className="ds-label">ระดับความสำคัญ</label>
            <select className="ds-select" name="priority" defaultValue="medium">
              <option value="low">ต่ำ</option>
              <option value="medium">กลาง</option>
              <option value="high">สูง</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function CoordinatorWarrantyPage() {
  const [jobs] = useJobs();
  const [warranties] = useWarranties();
  const [tickets] = useRepairTickets();
  const { session } = useAuth();
  const viewOnly = session?.role !== "coordinator";

  const activeWarranties = warranties.filter((w) => w.status === "active").length;
  const openTickets = tickets.filter((t) => t.status === "open").length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>บริการหลังการขาย</h2>
          <p>ตรวจสอบระยะเวลารับประกันและบันทึกเคสแจ้งซ่อมหลังจบงาน</p>
        </div>
      </div>

      {viewOnly && <ViewOnlyBanner />}

      <div className="kpi-grid" style={{ marginBottom: "1.5rem" }}>
        <StatCard label="งานทั้งหมด" value={jobs.length} icon={<IconBriefcase size={19} />} />
        <StatCard
          label="งานที่มีประกัน"
          value={warranties.length}
          icon={<IconShield size={19} />}
          subLabel={`อยู่ในการคุ้มครอง ${activeWarranties} รายการ`}
        />
        <StatCard
          label="งานแจ้งซ่อม"
          value={tickets.length}
          icon={<IconAlertTriangle size={19} />}
          subLabel={`เปิดเคสอยู่ ${openTickets} รายการ`}
          deltaText={openTickets > 0 ? `${openTickets} เปิดเคส` : undefined}
          deltaTone="warning"
        />
      </div>

      <Tabs tabs={[{ key: "warranty", label: "เช็คประกัน" }, { key: "repair", label: "แจ้งซ่อม" }]} defaultKey="warranty">
        {(active) => (active === "warranty" ? <WarrantyPanel /> : <RepairPanel />)}
      </Tabs>
    </div>
  );
}
