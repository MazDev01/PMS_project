"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import JobFormModal from "@/app/components/JobFormModal";
import ViewOnlyBanner from "@/app/components/ViewOnlyBanner";
import {
  IconChevronLeft, IconLink, IconDollar, IconFileText, IconDownload, IconRefresh,
  IconShield, IconUsers, IconMapPin, IconPhone, IconCalendar, IconImage, IconEdit, IconLock,
  IconCheckCircle, IconUpload,
} from "@/app/components/icons";
import {
  buildJobTimeline, getJobLineItems, getJobDocumentTrail, jobStatusLabel, jobStatusBadgeClass,
  crewCoverage, specialtyShort, jobTypeToSpecialties, mangoQuotationUrl,
} from "@/app/lib/mockData";
import { formatAddress } from "@/app/lib/thaiAddress";
import { useStore, useUploads } from "@/app/lib/store";
import { useAuth } from "@/app/lib/auth";
import { formatDateTH, formatTHB } from "@/app/lib/format";

function SyncBadge({ status }) {
  const map = {
    success: { cls: "badge-success", label: "ซิงค์สำเร็จ" },
    pending: { cls: "badge-warning", label: "กำลังซิงค์" },
    failed: { cls: "badge-destructive", label: "ล้มเหลว" },
  };
  const m = map[status] || { cls: "badge-secondary", label: status };
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
}

export default function CoordinatorJobDetailPage() {
  const { id } = useParams();
  const { db, update, addAuditLog } = useStore();
  const { session } = useAuth();
  const [upload] = useUploads(id);
  const [editOpen, setEditOpen] = useState(false);
  const job = db.jobs.find((j) => j.id === id);

  if (!job) {
    return (
      <div className="empty-state">
        <IconFileText size={40} />
        <div>ไม่พบงานเลขที่ {id}</div>
        <Link href="/coordinator/jobs" className="btn btn-outline btn-sm" style={{ marginTop: "0.75rem" }}>
          <IconChevronLeft size={14} /> กลับไปหน้าจัดการงาน
        </Link>
      </div>
    );
  }

  const customer = db.customers.find((c) => c.id === job.customerId);
  // The real assignment is a crew of individuals (1 lead + up to 3 members),
  // not a whole team — a person can be borrowed across teams for one job.
  const crew = job.crew || { leadId: null, memberIds: [] };
  const leadPerson = db.personnel.find((p) => p.id === crew.leadId);
  const memberPeople = crew.memberIds.map((pid) => db.personnel.find((p) => p.id === pid)).filter(Boolean);
  const crewPeople = [leadPerson, ...memberPeople].filter(Boolean);
  const personTeamName = (p) => db.teams.find((t) => t.id === p.teamId)?.name;
  const requiredSpecs = jobTypeToSpecialties(job.jobType);
  const assignedCoverage = crewCoverage(crewPeople.map((p) => p.id), db.personnel);
  const uncoveredSpecs = requiredSpecs.filter((s) => !assignedCoverage.includes(s));
  const warranty = db.warranties.find((w) => w.jobId === job.id);
  const timeline = buildJobTimeline(job);
  const items = getJobLineItems(job);
  const documents = getJobDocumentTrail(job, db.syncStatus);
  // A closed-out job (done or a repair ticket against a closed job) is locked —
  // its record, documents and warranty countdown are already committed.
  const isFinished = job.status === "done" || job.status === "repair";
  // Admin/executive can view a coordinator's job but not act on it.
  const viewOnly = session?.role !== "coordinator";

  const actor = session?.name || "นภัสสร ใจดี";
  function attachPO(fileName) {
    update("jobs", (list) => list.map((j) => (j.id === job.id ? { ...j, poUploaded: true, poFileName: fileName } : j)));
    addAuditLog({ actor, role: session?.role || "coordinator", action: `แนบใบสั่งซื้อ (PO) — ${job.id}`, target: job.id });
  }
  function removePO() {
    update("jobs", (list) => list.map((j) => (j.id === job.id ? { ...j, poUploaded: false, poFileName: null } : j)));
  }

  const uploadedPhotos = [
    ...upload.before.map((item) => ({ caption: "ก่อนทำ", url: item.url, uploadedBy: item.uploadedBy })),
    ...upload.during.map((item) => ({ caption: "ขณะทำ", url: item.url, uploadedBy: item.uploadedBy })),
    ...upload.after.map((item) => ({ caption: "หลังทำ", url: item.url, uploadedBy: item.uploadedBy })),
  ];

  return (
    <div>
      <Link href="/coordinator/jobs" className="flex-row text-sm text-muted" style={{ marginBottom: "0.9rem", textDecoration: "none" }}>
        <IconChevronLeft size={15} /> กลับไปหน้าจัดการงาน
      </Link>

      {viewOnly && <ViewOnlyBanner />}

      <div className="job-detail-header">
        <div>
          <div className="job-detail-title-row">
            <h2>{job.jobType}</h2>
            <span className={`badge ${jobStatusBadgeClass(job.status)}`}>{jobStatusLabel(job.status)}</span>
            <span className={`badge ${job.quotationSigned ? "badge-success" : "badge-secondary"}`}>
              {job.quotationSigned ? "ลูกค้าเซ็นอนุมัติใบเสนอราคาแล้ว" : "ยังไม่ได้เซ็นใบเสนอราคา"}
            </span>
          </div>
          <div className="text-sm text-muted">{job.id} · {job.customer}</div>
        </div>
        <div className="page-actions">
          {!isFinished && !viewOnly && (
            <button type="button" className="btn btn-md btn-default" onClick={() => setEditOpen(true)}>
              <IconEdit size={14} /> แก้ไขงาน
            </button>
          )}
          {isFinished && (
            <span className="badge badge-secondary flex-row" title="งานที่ปิดแล้วถูกล็อกไม่ให้แก้ไข" style={{ gap: "0.3rem" }}>
              <IconLock size={13} /> ปิดงานแล้ว — แก้ไขไม่ได้
            </span>
          )}
          <Link href="/coordinator/links" className="btn btn-outline btn-sm">
            <IconLink size={14} /> สร้างลิงก์
          </Link>
          <Link href="/coordinator/closing" className="btn btn-default btn-sm">
            <IconDollar size={14} /> ไปหน้าปิดงาน
          </Link>
        </div>
      </div>

      <div className="job-detail-grid">
        <div>
          <div className="ds-card section-block">
            <div className="ds-card-header">
              <div className="ds-card-title">ลำดับขั้นตอนงาน</div>
              <div className="ds-card-desc">ความคืบหน้าของงานตั้งแต่เปิดงานจนถึงปิดงาน</div>
            </div>
            <div className="ds-card-content">
              <div className="job-timeline">
                {timeline.map((step, i) => (
                  <div key={step.key} className={`job-timeline-item ${step.done ? "done" : ""} ${step.current ? "current" : ""}`}>
                    <div className="job-timeline-marker">
                      <div className="job-timeline-dot" />
                      {i < timeline.length - 1 && <div className="job-timeline-connector" />}
                    </div>
                    <div className="job-timeline-body">
                      <div className="job-timeline-top">
                        <span className="job-timeline-label">{step.label}</span>
                        {step.current && <span className="badge badge-warning">ปัจจุบัน</span>}
                      </div>
                      {step.at && <div className="job-timeline-date">{formatDateTH(step.at)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="section-block">
            <div className="flex-between" style={{ marginBottom: "0.6rem" }}>
              <h3 style={{ margin: 0 }}>รายการใบเสนอราคา</h3>
              <a
                href={mangoQuotationUrl(job)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-outline flex-row"
                title="เปิด Mango เพื่อสร้าง/แก้ไขใบเสนอราคาของงานนี้ แล้วระบบจะซิงค์ยอดกลับมาให้"
              >
                <IconLink size={14} /> สร้าง / แก้ไขใบเสนอราคาใน Mango
              </a>
            </div>
            <p className="text-xs text-muted" style={{ marginTop: "-0.3rem", marginBottom: "0.6rem" }}>
              ใบเสนอราคาจัดทำในระบบ Mango — ยอดด้านล่างดึงมาจาก Mango ผ่านการซิงค์
            </p>
            <DataTableItems items={items} total={job.amount} />
          </div>

          <div className="ds-card section-block">
            <div className="ds-card-header">
              <div className="ds-card-title flex-row"><IconFileText size={15} /> ใบสั่งซื้อ (PO) / ใบเสนอราคาที่ลูกค้าเซ็น</div>
              <div className="ds-card-desc">แนบไฟล์เพื่อแจ้งฝ่ายจัดซื้อว่าต้องสั่งของอะไร และซิงค์ไฟล์เข้า Mango (แนบได้หลังลูกค้าเซ็นใบเสนอราคา)</div>
            </div>
            <div className="ds-card-content">
              <PoAttachment job={job} locked={isFinished} readOnly={viewOnly} onAttach={attachPO} onRemove={removePO} />
            </div>
          </div>

          <div className="ds-card section-block">
            <div className="ds-card-header">
              <div className="ds-card-title flex-row"><IconImage size={15} /> รูปหน้างานที่ทีมช่างอัปโหลด</div>
            </div>
            <div className="ds-card-content">
              {uploadedPhotos.length === 0 ? (
                <div className="text-sm text-muted">ยังไม่มีรูปภาพที่ทีมช่างอัปโหลดสำหรับงานนี้</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "0.5rem" }}>
                  {uploadedPhotos.map((p, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
                      <div className="thumb" style={{ width: 90, height: 90 }} title={p.uploadedBy ? `ถ่ายโดย ${p.uploadedBy}` : ""}>
                        <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <span className="text-xs text-muted">{p.caption}{p.uploadedBy ? ` · ${p.uploadedBy}` : ""}</span>
                    </div>
                  ))}
                </div>
              )}
              {upload.deliveryFileName && (
                <div className="text-xs flex-row" style={{ marginTop: "0.75rem" }}>
                  <IconFileText size={13} /> แนบไฟล์ใบส่งมอบงาน: {upload.deliveryFileName}
                </div>
              )}
            </div>
          </div>

          <div className="ds-card section-block">
            <div className="ds-card-header">
              <div className="ds-card-title">เอกสารและการซิงค์ Mango</div>
            </div>
            <div className="ds-card-content">
              {documents.length === 0 ? (
                <div className="text-sm text-muted">ยังไม่มีเอกสารที่ซิงค์กับ Mango สำหรับงานนี้</div>
              ) : (
                documents.map((d) => (
                  <div className="jobdoc-row" key={d.id}>
                    <div className="jobdoc-row-icon"><IconFileText size={16} /></div>
                    <div className="jobdoc-row-body">
                      <div className="jobdoc-row-label">{d.docType}</div>
                      <div className="jobdoc-row-date">{formatDateTH(d.timestamp)} · {d.direction === "push" ? "Push → Mango" : "Pull ← Mango"}</div>
                    </div>
                    <SyncBadge status={d.status} />
                    <button type="button" className="btn btn-icon btn-ghost" title={d.status === "failed" ? "ลองซิงค์ใหม่" : "ดาวน์โหลด"}>
                      {d.status === "failed" ? <IconRefresh size={15} /> : <IconDownload size={15} />}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="ds-card section-block">
            <div className="ds-card-header">
              <div className="ds-card-title">ข้อมูลลูกค้า</div>
            </div>
            <div className="ds-card-content">
              <div className="info-card-row" style={{ fontWeight: 600, fontSize: "0.9rem" }}>{customer?.name || job.customer}</div>
              <div className="info-card-row"><IconPhone size={14} />{customer?.phone || "-"}</div>
              <div className="info-card-row"><IconMapPin size={14} />{formatAddress(customer?.address)}</div>
              {customer?.address?.mapUrl && (
                <a href={customer.address.mapUrl} target="_blank" rel="noreferrer" className="info-card-row" style={{ color: "var(--primary)" }}>
                  <IconMapPin size={14} />เปิดแผนที่ที่อยู่ลูกค้า
                </a>
              )}
            </div>
          </div>

          <div className="ds-card section-block">
            <div className="ds-card-header">
              <div className="ds-card-title">ที่อยู่หน้างาน (จุดปฏิบัติงาน)</div>
            </div>
            <div className="ds-card-content">
              <div className="info-card-row"><IconMapPin size={14} />{formatAddress(job.siteAddress)}</div>
              {job.siteAddress?.mapUrl && (
                <a href={job.siteAddress.mapUrl} target="_blank" rel="noreferrer" className="info-card-row" style={{ color: "var(--primary)" }}>
                  <IconMapPin size={14} />เปิดแผนที่นำทางหน้างาน
                </a>
              )}
            </div>
          </div>

          <div className="ds-card section-block">
            <div className="ds-card-header">
              <div className="ds-card-title">ทีมช่างที่รับผิดชอบ{crewPeople.length ? ` (${crewPeople.length} คน)` : ""}</div>
              <div className="ds-card-desc flex-row" style={{ flexWrap: "wrap", gap: "0.3rem", marginTop: "0.3rem" }}>
                งานนี้ต้องใช้ช่างสาย:
                {requiredSpecs.map((s) => (
                  <span key={s} className={`badge ${assignedCoverage.includes(s) ? "badge-success" : "badge-warning"}`} style={{ fontSize: "0.62rem" }}>
                    {assignedCoverage.includes(s) ? "✓" : "✗"} {specialtyShort[s] || s}
                  </span>
                ))}
              </div>
              {uncoveredSpecs.length > 0 && (
                <div className="text-xs" style={{ color: "oklch(0.6 0.16 60)", marginTop: "0.3rem" }}>
                  ⚠ ทีมที่จัดไว้ยังไม่ครอบคลุมสาย {uncoveredSpecs.map((s) => specialtyShort[s] || s).join(", ")}
                </div>
              )}
            </div>
            <div className="ds-card-content">
              {crewPeople.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {crewPeople.map((p, i) => (
                    <div key={p.id} style={{ paddingTop: i === 0 ? 0 : "0.85rem", borderTop: i === 0 ? "none" : "1px solid var(--border)" }}>
                      <div className="info-card-row" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                        <div className="avatar avatar-sm">{p.name.slice(0, 1)}</div>
                        {p.name}
                        {p.id === crew.leadId
                          ? <span className="badge badge-success" style={{ fontSize: "0.62rem" }}>หัวหน้างาน</span>
                          : <span className="badge badge-secondary" style={{ fontSize: "0.62rem" }}>สมาชิก</span>}
                      </div>
                      <div className="info-card-row"><IconUsers size={14} />{personTeamName(p) || "ยังไม่มีทีม"} · {specialtyShort[p.specialty] || p.specialty || "—"}</div>
                      <div className="info-card-row"><IconPhone size={14} />{p.phone || "-"}</div>
                    </div>
                  ))}
                  <div className="info-card-row" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.85rem" }}><IconCalendar size={14} />นัดหมาย {formatDateTH(job.scheduledDate)} · {job.startTime}-{job.endTime}</div>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: "1rem" }}>
                  <div>ยังไม่ได้จัดทีมสำหรับงานนี้</div>
                  <Link href="/coordinator/schedule" className="btn btn-outline btn-sm" style={{ marginTop: "0.5rem" }}>ไปหน้าจัดทำแผนงาน</Link>
                </div>
              )}
            </div>
          </div>

          {warranty && (
            <div className="ds-card section-block">
              <div className="ds-card-header">
                <div className="ds-card-title flex-row"><IconShield size={15} /> การรับประกัน</div>
              </div>
              <div className="ds-card-content">
                <div className="info-card-row">
                  <span className={`badge ${warranty.status === "active" ? "badge-success" : "badge-destructive"}`}>
                    {warranty.status === "active" ? "อยู่ในประกัน" : "หมดประกันแล้ว"}
                  </span>
                </div>
                <div className="info-card-row">ครบกำหนดวันที่ {formatDateTH(warranty.endDate)}</div>
                <div className="text-xs text-muted">เริ่มนับระยะเวลาประกันจากวันรับเงิน</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <JobFormModal open={editOpen && !isFinished && !viewOnly} editingJob={job} onClose={() => setEditOpen(false)} />
    </div>
  );
}

// PO attachment — surfaced only after the customer signs the quotation, so the
// coordinator always knows the right moment to upload it.
function PoAttachment({ job, locked, readOnly, onAttach, onRemove }) {
  const inputRef = useRef(null);
  const pick = () => inputRef.current?.click();
  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) onAttach(f.name);
    e.target.value = "";
  };

  if (!job.quotationSigned) {
    return (
      <div className="po-empty">
        <IconLock size={15} />
        <span>รอลูกค้าเซ็นอนุมัติใบเสนอราคาก่อน จึงจะแนบใบสั่งซื้อ (PO) ได้</span>
      </div>
    );
  }

  if (job.poUploaded) {
    return (
      <div>
        <div className="ds-alert ds-alert-success">
          <span className="ds-alert-icon"><IconCheckCircle size={16} /></span>
          <div><strong>แนบใบสั่งซื้อ (PO) เรียบร้อยแล้ว</strong>{job.poFileName ? ` · ${job.poFileName}` : ""}</div>
        </div>
        {!locked && !readOnly && (
          <div className="flex-row" style={{ gap: "0.5rem", marginTop: "0.7rem" }}>
            <button type="button" className="btn btn-sm btn-outline" onClick={pick}>เปลี่ยนไฟล์</button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={onRemove}>เอาไฟล์ออก</button>
            <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={onFile} />
          </div>
        )}
      </div>
    );
  }

  // Signed but no PO on file yet. Admin/executive just sees the state.
  if (readOnly) {
    return (
      <div className="po-empty">
        <IconFileText size={15} />
        <span>ยังไม่มีการแนบใบสั่งซื้อ (PO) สำหรับงานนี้</span>
      </div>
    );
  }

  // Coordinator — the prominent "do this now" upload state.
  return (
    <div>
      <div className="ds-alert ds-alert-info" style={{ marginBottom: "0.8rem" }}>
        <span className="ds-alert-icon"><IconFileText size={16} /></span>
        <div><strong>แนบใบสั่งซื้อ (PO) หรือใบเสนอราคาที่ลูกค้าเซ็น</strong> เพื่อแจ้งฝ่ายจัดซื้อว่าต้องสั่งของอะไร และซิงค์ไฟล์เข้า Mango</div>
      </div>
      <div
        className="file-dropzone"
        role="button"
        tabIndex={0}
        onClick={pick}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } }}
      >
        <div className="file-dropzone-icon"><IconUpload size={17} /></div>
        <div>
          <div className="file-dropzone-text"><strong>คลิกเพื่อเลือกไฟล์ PO</strong> หรือลากไฟล์มาวางที่นี่</div>
          <div className="file-dropzone-hint">รองรับไฟล์ PDF, JPG, PNG</div>
        </div>
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={onFile} />
      </div>
    </div>
  );
}

function DataTableItems({ items, total }) {
  return (
    <div className="ds-table-wrap">
      <table>
        <thead>
          <tr>
            <th>รายการ</th>
            <th style={{ textAlign: "center" }}>จำนวน</th>
            <th style={{ textAlign: "right" }}>ราคา/หน่วย</th>
            <th style={{ textAlign: "center" }}>ประกัน</th>
            <th style={{ textAlign: "right" }}>รวม</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td>{it.description}</td>
              <td style={{ textAlign: "center" }}>{it.qty}</td>
              <td style={{ textAlign: "right" }}>{formatTHB(it.unitPrice)}</td>
              <td style={{ textAlign: "center" }}><span className="badge badge-secondary">{it.warrantyMonths} ด.</span></td>
              <td style={{ textAlign: "right", fontWeight: 600 }}>{formatTHB(it.qty * it.unitPrice)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={4} style={{ textAlign: "right", fontWeight: 600 }}>ยอดรวมทั้งสิ้น</td>
            <td style={{ textAlign: "right", fontWeight: 700, color: "var(--primary)" }}>{formatTHB(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
