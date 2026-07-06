"use client";

import { useState } from "react";
import Modal from "@/app/components/Modal";
import DataTable from "@/app/components/DataTable";
import ViewOnlyBanner from "@/app/components/ViewOnlyBanner";
import {
  IconFileText, IconCalendar, IconTruck, IconDownload, IconUpload, IconAlertTriangle,
} from "@/app/components/icons";
import { useTableRows, TableToolbar } from "@/app/components/TableControls";
import { TODAY_ISO } from "@/app/lib/mockData";
import { useJobs, useGeneratedLinks, useStore } from "@/app/lib/store";
import { useAuth } from "@/app/lib/auth";
import { formatDateTimeTH } from "@/app/lib/format";

const LINK_TYPES = [
  { type: "quotation", label: "ใบเสนอราคา", icon: IconFileText, desc: "ส่งใบเสนอราคาให้ลูกค้ายืนยันและเซ็นออนไลน์" },
  { type: "plan", label: "แผนงาน", icon: IconCalendar, desc: "ส่งแผนงาน/นัดหมายให้ลูกค้ายืนยันวันเข้าติดตั้ง" },
  { type: "delivery", label: "ใบส่งมอบงาน", icon: IconTruck, desc: "ส่งใบส่งมอบงานให้ลูกค้าตรวจรับและเซ็นปิดงาน" },
];

// Internal link "type" values (quotation/plan/delivery) map to the actual
// Guest Access route segments, which are named after their page content
// (คอนเฟิร์มวัน → /guest/confirm, ใบส่งมอบงาน → /guest/signoff).
function guestRouteFor(type) {
  return { quotation: "quotation", plan: "confirm", delivery: "signoff" }[type] || type;
}

function linkStatusLabel(status) {
  return { active: "ใช้งานได้", expired: "หมดอายุ", revoked: "ยกเลิกแล้ว" }[status] || status;
}
function linkStatusBadgeClass(status) {
  return { active: "badge-success", expired: "badge-secondary", revoked: "badge-destructive" }[status] || "badge-secondary";
}

export default function CoordinatorLinksPage() {
  const [jobs] = useJobs();
  const [links, setLinks] = useGeneratedLinks();
  const { addAuditLog } = useStore();
  const { session } = useAuth();
  const actor = session?.name || "นภัสสร ใจดี";
  const actorRole = session?.role || "coordinator";
  const viewOnly = session?.role !== "coordinator";
  const [modalType, setModalType] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [jobSearch, setJobSearch] = useState("");
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id);

  const activeType = LINK_TYPES.find((lt) => lt.type === modalType);
  const { search, setSearch, sortBy, setSortBy, rows: linkRows, resultCount, isFiltered } = useTableRows(links, {
    searchFields: (l) => [l.label, l.jobId, l.customer, l.id],
    sortOptions: [
      { key: "default", label: "เรียงตามล่าสุด" },
      { key: "expiresAt", label: "เรียงตามวันหมดอายุ", compare: (a, b) => a.expiresAt.localeCompare(b.expiresAt) },
      { key: "customer", label: "เรียงตามลูกค้า", compare: (a, b) => a.customer.localeCompare(b.customer, "th") },
      { key: "status", label: "เรียงตามสถานะ", compare: (a, b) => a.status.localeCompare(b.status) },
    ],
  });

  function openModal(type) {
    setModalType(type);
    setResultUrl(null);
    setJobSearch("");
    setSelectedJobId(jobs[0]?.id);
  }

  function closeModal() {
    setModalType(null);
    setResultUrl(null);
  }

  function handleCopy(text, key) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
  }

  function handleRevoke(id) {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, status: "revoked" } : l)));
    addAuditLog({ actor, role: actorRole, action: "ยกเลิกลิงก์เอกสาร", target: id });
  }

  function handleDownloadBackup() {
    const lines = [
      "เอกสารสำรอง (Backup Document) — MACCA PMS",
      `ดาวน์โหลดเมื่อ: ${formatDateTimeTH(new Date().toISOString())}`,
      "",
      "รายการเอกสารที่ยังไม่ได้ซิงค์เข้า Mango โดยอัตโนมัติ:",
      ...jobs.slice(0, 5).map((j) => `- ${j.id} · ${j.customer} · ${j.jobType}`),
      "",
      "หมายเหตุ: ไฟล์นี้เป็นไฟล์สำรองสำหรับใช้งานกรณี auto-sync ล้มเหลว",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-documents-${TODAY_ISO}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleGenerate(e) {
    e.preventDefault();
    const form = e.target;
    const job = jobs.find((j) => j.id === selectedJobId);
    const token = Math.random().toString(36).slice(2, 10);
    const url = `https://pms.maccalight.co.th/guest/${guestRouteFor(modalType)}?token=${token}`;
    const expiresAtValue = form.expiresAt.value
      ? new Date(form.expiresAt.value).toISOString()
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const nums = links
      .map((l) => parseInt(l.id.split("-").pop(), 10))
      .filter((n) => !Number.isNaN(n));
    const nextNum = (nums.length ? Math.max(...nums) : 1000) + 1;
    const newLink = {
      id: `LK-${nextNum}`,
      token,
      type: modalType,
      label: activeType?.label || "",
      jobId: job?.id || selectedJobId,
      customer: job?.customer || "",
      createdAt: new Date().toISOString(),
      expiresAt: expiresAtValue,
      status: "active",
    };
    setLinks((prev) => [newLink, ...prev]);
    addAuditLog({ actor, role: actorRole, action: `สร้างลิงก์${activeType?.label || ""}`, target: newLink.id });
    setResultUrl(url);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>สร้างลิงก์</h2>
          <p>สร้างลิงก์ชั่วคราวสำหรับส่งเอกสารให้ลูกค้าผ่าน Guest Access &amp; E-Signature</p>
        </div>
      </div>

      {viewOnly && <ViewOnlyBanner />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.1rem" }}>
        {LINK_TYPES.map((lt) => (
          <div className="ds-card" key={lt.type}>
            <div className="ds-card-header">
              <div className="ds-card-title flex-row">
                <lt.icon size={16} style={{ color: "var(--primary)" }} />
                {lt.label}
              </div>
              <div className="ds-card-desc">{lt.desc}</div>
            </div>
            <div className="ds-card-footer">
              <button type="button" className="btn btn-sm btn-default" disabled={viewOnly} onClick={() => openModal(lt.type)}>
                สร้างลิงก์
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="section-block" style={{ marginTop: "1.75rem" }}>
        <h3>ลิงก์ที่สร้างไว้ทั้งหมด</h3>
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="ค้นหา ประเภท / งาน / ลูกค้า"
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOptions={[
            { key: "default", label: "เรียงตามล่าสุด" },
            { key: "expiresAt", label: "เรียงตามวันหมดอายุ" },
            { key: "customer", label: "เรียงตามลูกค้า" },
            { key: "status", label: "เรียงตามสถานะ" },
          ]}
        />
        {isFiltered && <p className="text-xs text-muted" style={{ marginTop: "-0.4rem", marginBottom: "0.75rem" }}>แสดง {resultCount} รายการ</p>}
        <DataTable
          rowClassName={(r) => (r.status === "active" ? "row-accent-success" : r.status === "revoked" ? "row-accent-destructive" : "")}
          columns={[
            {
              key: "label",
              label: "ประเภท",
              render: (r) => {
                const lt = LINK_TYPES.find((t) => t.type === r.type);
                return (
                  <span className="flex-row" style={{ gap: "0.4rem" }}>
                    {lt && <lt.icon size={14} style={{ color: "var(--primary)" }} />}
                    {r.label}
                  </span>
                );
              },
            },
            { key: "jobId", label: "งาน/ลูกค้า", render: (r) => <span>{r.jobId} — {r.customer}</span> },
            { key: "createdAt", label: "สร้างเมื่อ", render: (r) => formatDateTimeTH(r.createdAt) },
            { key: "expiresAt", label: "หมดอายุ", render: (r) => formatDateTimeTH(r.expiresAt) },
            {
              key: "status",
              label: "สถานะ",
              render: (r) => <span className={`badge ${linkStatusBadgeClass(r.status)}`}>{linkStatusLabel(r.status)}</span>,
            },
            {
              key: "actions",
              label: "",
              render: (r) => (
                <div className="flex-row">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    disabled={viewOnly}
                    title={viewOnly ? "ดูอย่างเดียว — คัดลอกลิงก์ไม่ได้" : undefined}
                    onClick={() => handleCopy(`https://pms.maccalight.co.th/guest/${guestRouteFor(r.type)}?token=${r.token}`, r.id)}
                  >
                    {copiedKey === r.id ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
                  </button>
                  {r.status === "active" && !viewOnly && (
                    <button type="button" className="btn btn-sm btn-destructive" onClick={() => handleRevoke(r.id)}>
                      ยกเลิก/ปิดการเข้าถึง
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          rows={linkRows}
        />
      </div>

      <div className="ds-alert ds-alert-warning">
        <div className="ds-alert-icon"><IconAlertTriangle size={16} /></div>
        <div style={{ flex: 1 }}>
          <strong>กรณี auto-sync ล้มเหลว</strong>
          หากระบบไม่สามารถส่งเอกสารเข้า Mango ได้โดยอัตโนมัติ สามารถดาวน์โหลดเอกสารสำรองไว้ใช้งาน หรืออัปโหลดไฟล์ PO/ใบเซ็นเสนอราคาด้วยตนเองได้ที่นี่
          {!viewOnly && (
            <div className="flex-row" style={{ marginTop: "0.75rem", flexWrap: "wrap" }}>
              <button type="button" className="btn btn-sm btn-outline" onClick={handleDownloadBackup}>
                <IconDownload size={14} />
                ดาวน์โหลดเอกสารสำรอง
              </button>
              <label className="btn btn-sm btn-outline" style={{ cursor: "pointer" }}>
                <IconUpload size={14} />
                อัปโหลดไฟล์ PO/ใบเซ็นเสนอราคา
                <input type="file" style={{ display: "none" }} />
              </label>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={!!modalType}
        onClose={closeModal}
        title={`สร้างลิงก์${activeType?.label || ""}`}
        description="กำหนดวันหมดอายุและสิทธิ์การเข้าถึงก่อนส่งลิงก์ให้ลูกค้า"
        footer={
          !resultUrl ? (
            <>
              <button type="button" className="btn btn-md btn-secondary" onClick={closeModal}>ยกเลิก</button>
              <button type="submit" form="link-form" className="btn btn-md btn-default">สร้างลิงก์</button>
            </>
          ) : (
            <button type="button" className="btn btn-md btn-default" onClick={closeModal}>เสร็จสิ้น</button>
          )
        }
      >
        {!resultUrl ? (
          <form id="link-form" onSubmit={handleGenerate}>
            <div className="form-group">
              <label className="ds-label">เลือกงาน</label>
              <input
                className="ds-input"
                placeholder="ค้นหา เลขที่งาน / ลูกค้า"
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
              />
              {(() => {
                const q = jobSearch.trim().toLowerCase();
                const filtered = q
                  ? jobs.filter(
                      (j) =>
                        j.id.toLowerCase().includes(q) ||
                        (j.customer || "").toLowerCase().includes(q)
                    )
                  : jobs;
                return (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      maxHeight: 220,
                      overflowY: "auto",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    {filtered.length === 0 ? (
                      <div className="text-sm text-muted" style={{ padding: "0.75rem" }}>
                        ไม่พบงานที่ตรงกับคำค้นหา
                      </div>
                    ) : (
                      filtered.map((j) => {
                        const isSelected = j.id === selectedJobId;
                        return (
                          <button
                            type="button"
                            key={j.id}
                            onClick={() => setSelectedJobId(j.id)}
                            style={{
                              display: "block",
                              width: "100%",
                              textAlign: "left",
                              padding: "0.5rem 0.75rem",
                              border: "none",
                              borderBottom: "1px solid var(--border)",
                              cursor: "pointer",
                              background: isSelected ? "oklch(0.55 0.18 240 / 0.08)" : "transparent",
                              fontWeight: isSelected ? 600 : 400,
                            }}
                          >
                            <span className="text-sm">{j.id} — {j.customer}</span>
                            <span className="text-xs text-muted"> · {j.jobType}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="form-group">
              <label className="ds-label">กำหนดวันหมดอายุ</label>
              <input className="ds-input" type="datetime-local" name="expiresAt" />
            </div>
            <div className="form-group">
              <label className="ds-label">กำหนดสิทธิ์ผู้เข้าถึง</label>
              <select className="ds-select" name="access" defaultValue="specific">
                <option value="specific">เฉพาะลูกค้าที่ระบุ</option>
                <option value="anyone">ทุกคนที่มีลิงก์</option>
              </select>
            </div>
          </form>
        ) : (
          <div className="form-group">
            <label className="ds-label">ลิงก์ที่สร้าง</label>
            <div className="flex-row">
              <input className="ds-input font-mono" readOnly value={resultUrl} style={{ flex: 1 }} />
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => handleCopy(resultUrl, "result")}>
                {copiedKey === "result" ? "คัดลอกแล้ว" : "คัดลอก"}
              </button>
            </div>
            <span className="ds-helper">ส่งลิงก์นี้ให้ลูกค้าผ่าน LINE หรือ SMS เพื่อเข้าดูและเซ็นเอกสารออนไลน์</span>
          </div>
        )}
      </Modal>
    </div>
  );
}
