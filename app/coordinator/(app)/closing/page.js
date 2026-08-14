"use client";

import { useState } from "react";
import Modal from "@/app/components/Modal";
import DataTable from "@/app/components/DataTable";
import StatCard from "@/app/components/StatCard";
import ViewOnlyBanner from "@/app/components/ViewOnlyBanner";
import { IconCheck, IconDownload, IconClock, IconCheckCircle, IconAlertTriangle, IconPhone, IconMapPin, IconUser } from "@/app/components/icons";
import { TODAY_ISO, getJobLineItems, jobStatusLabel, scopeJobsToSession } from "@/app/lib/mockData";
import { useJobs, useWarranties, useStore, useCustomers } from "@/app/lib/store";
import { useAuth } from "@/app/lib/auth";
import { formatDateTH, formatTHB } from "@/app/lib/format";
import { formatAddress } from "@/app/lib/thaiAddress";
import { exportToCSV } from "@/app/lib/csv";

const CLOSING_DOCS = ["ใบเสนอราคา", "ใบส่งมอบงาน", "ใบสั่งจ้าง (PO)"];

function addMonthsISO(iso, months) {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export default function CoordinatorClosingPage() {
  const [jobList, setJobList] = useJobs();
  const [, setWarranties] = useWarranties();
  const [customerList] = useCustomers();
  const { addAuditLog, addNotification } = useStore();
  const { session } = useAuth();
  const actor = session?.name || "นภัสสร ใจดี";
  const actorRole = session?.role || "coordinator";
  const viewOnly = session?.role !== "coordinator";
  const [confirmJob, setConfirmJob] = useState(null);
  const [contactJob, setContactJob] = useState(null);

  // A coordinator closes/exports only their own jobs; admin/executive see all.
  const visibleJobs = scopeJobsToSession(jobList, session);
  const pending = visibleJobs.filter((j) => j.status === "in_progress");
  const closed = visibleJobs.filter((j) => j.status === "done");
  const readyToClose = pending.filter((j) => j.paymentStatus === "ชำระแล้ว");
  const pendingAmount = pending.reduce((s, j) => s + j.amount, 0);
  const closedAmount = closed.reduce((s, j) => s + j.amount, 0);

  function handleExportFinancialReport() {
    // Include every job regardless of status — a "repair" job is a fully
    // closed-out job with a later warranty complaint against it (its payment
    // already happened), so leaving it out undercounts real, paid revenue.
    exportToCSV(
      `financial-report-${TODAY_ISO}.csv`,
      [
        { label: "เลขที่งาน", value: (r) => r.id },
        { label: "ลูกค้า", value: (r) => r.customer },
        { label: "ยอดเงิน", value: (r) => r.amount },
        { label: "สถานะการชำระ", value: (r) => r.paymentStatus },
        { label: "สถานะงาน", value: (r) => (r.status === "in_progress" ? "รอปิดงาน" : jobStatusLabel(r.status)) },
        { label: "วันที่ปิดงาน", value: (r) => (r.closedDate ? formatDateTH(r.closedDate) : "-") },
      ],
      visibleJobs
    );
  }

  function openConfirm(job) {
    if (job.paymentStatus !== "ชำระแล้ว") return;
    setConfirmJob(job);
  }

  function handleConfirmClose() {
    const job = confirmJob;
    setJobList((prev) =>
      prev.map((j) => (j.id === job.id ? { ...j, status: "done", closedDate: TODAY_ISO } : j))
    );
    // Matches the proposal's "เริ่มนับระยะเวลาประกันทันทีที่ปิดยอดสำเร็จ" —
    // closing a job kicks off its warranty countdown automatically.
    const months = getJobLineItems(job)[0]?.warrantyMonths || 12;
    setWarranties((prev) => {
      if (prev.some((w) => w.jobId === job.id)) return prev;
      return [
        {
          id: `W-${Date.now()}`,
          customer: job.customer,
          jobId: job.id,
          months,
          startDate: TODAY_ISO,
          endDate: addMonthsISO(TODAY_ISO, months),
          status: "active",
          percentLeft: 100,
        },
        ...prev,
      ];
    });
    addAuditLog({ actor, role: actorRole, action: "ยืนยันปิดงานและส่งเข้า Mango", target: job.id });
    addNotification({ audience: "contractor", title: "งานถูกปิดเรียบร้อยแล้ว", detail: `${job.id} — ${job.customer}` });
    setConfirmJob(null);
  }

  // Demo stand-in for the Mango payment sync — lets the coordinator mark a job
  // as paid so the "Confirm ปิดงาน" flow can be completed without a live Mango.
  function handleMarkPaid(jobId) {
    setJobList((prev) => prev.map((j) => (j.id === jobId ? { ...j, paymentStatus: "ชำระแล้ว" } : j)));
    addAuditLog({ actor, role: actorRole, action: "บันทึกรับชำระเงินแล้ว (ซิงค์จาก Mango)", target: jobId });
    setContactJob(null);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>ปิดงาน &amp; การเงิน</h2>
          <p>บันทึกยอดชำระเงินและยืนยันปิดงานหลังซิงค์ข้อมูลจาก Mango</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-md btn-outline" onClick={handleExportFinancialReport}>
            <IconDownload size={16} />
            Export รายงานการเงิน
          </button>
        </div>
      </div>

      {viewOnly && <ViewOnlyBanner />}

      <div className="kpi-grid" style={{ marginBottom: "1.5rem" }}>
        <StatCard label="งานที่รอปิด" value={pending.length} icon={<IconClock size={19} />} subLabel={formatTHB(pendingAmount)} />
        <StatCard
          label="พร้อมปิดงานได้ทันที"
          value={readyToClose.length}
          icon={<IconCheckCircle size={19} />}
          deltaText={readyToClose.length > 0 ? "ชำระเงินแล้ว" : undefined}
          deltaTone="success"
        />
        <StatCard label="งานที่ปิดแล้ว" value={closed.length} icon={<IconCheck size={19} />} subLabel={formatTHB(closedAmount)} />
        <StatCard
          label="รอชำระจาก Mango"
          value={pending.length - readyToClose.length}
          icon={<IconAlertTriangle size={19} />}
          deltaText={pending.length - readyToClose.length > 0 ? "ติดตามการชำระ" : undefined}
          deltaTone="warning"
        />
      </div>

      <div className="section-block">
        <h3>งานที่รอปิด</h3>
        <DataTable
          rowClassName={(r) => (r.paymentStatus === "ชำระแล้ว" ? "row-accent-success" : "row-accent-warning")}
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
            { key: "amount", label: "ยอดชำระเงิน", render: (r) => <span style={{ fontWeight: 600 }}>{formatTHB(r.amount)}</span> },
            {
              key: "paymentStatus",
              label: "สถานะการชำระ",
              render: (r) => (
                <span className="status-row">
                  <span className={`status-dot ${r.paymentStatus === "ชำระแล้ว" ? "success" : "pending"}`} />
                  {r.paymentStatus === "ชำระแล้ว" ? "ชำระแล้ว (ซิงค์จาก Mango)" : "รอชำระ"}
                </span>
              ),
            },
            {
              key: "actions",
              label: "",
              render: (r) => (
                <div className="flex-row" style={{ gap: "0.4rem", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="btn btn-icon btn-ghost"
                    title="ดูข้อมูลติดต่อลูกค้า / ติดตามการชำระ"
                    onClick={() => setContactJob(r)}
                  >
                    <IconPhone size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary-flat"
                    disabled={viewOnly || r.paymentStatus !== "ชำระแล้ว"}
                    title={viewOnly ? "ดูอย่างเดียว — ปิดงานไม่ได้" : (r.paymentStatus !== "ชำระแล้ว" ? "ต้องรอยืนยันการชำระเงินจาก Mango ก่อนจึงจะปิดงานได้" : "ยืนยันปิดงานนี้")}
                    onClick={() => openConfirm(r)}
                  >
                    Confirm ปิดงาน
                  </button>
                </div>
              ),
            },
          ]}
          rows={pending}
          emptyMessage="ไม่มีงานที่รอปิดในขณะนี้"
        />
      </div>

      <div className="section-block">
        <h3>งานที่ปิดแล้ว</h3>
        <DataTable
          rowClassName={() => "row-accent-success"}
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
            { key: "amount", label: "ยอดชำระ", render: (r) => <span style={{ fontWeight: 600 }}>{formatTHB(r.amount)}</span> },
            { key: "closedDate", label: "วันที่ปิดงาน", render: (r) => (r.closedDate ? formatDateTH(r.closedDate) : "-") },
            { key: "status", label: "", render: () => <span className="badge badge-success">ปิดงานแล้ว</span> },
          ]}
          rows={closed}
          emptyMessage="ยังไม่มีงานที่ปิดแล้ว"
        />
      </div>

      <Modal
        open={!!confirmJob}
        onClose={() => setConfirmJob(null)}
        title={`ยืนยันปิดงาน ${confirmJob?.id || ""}`}
        description={confirmJob ? `ลูกค้า: ${confirmJob.customer}` : ""}
        footer={
          <>
            <button type="button" className="btn btn-md btn-secondary" onClick={() => setConfirmJob(null)}>ยกเลิก</button>
            <button type="button" className="btn btn-md btn-primary-flat" onClick={handleConfirmClose}>
              ยืนยันปิดงานและส่งเข้า Mango อัตโนมัติ
            </button>
          </>
        }
      >
        <p className="text-sm text-muted" style={{ marginBottom: "0.9rem" }}>
          ระบบจะรวมเอกสารทั้งหมดของงานนี้และส่งเข้าสู่ Mango โดยอัตโนมัติเมื่อยืนยันปิดงาน
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {CLOSING_DOCS.map((doc) => (
            <div className="flex-row" key={doc} style={{ fontSize: "0.875rem" }}>
              <span style={{ color: "oklch(0.6 0.18 145)", display: "inline-flex" }}>
                <IconCheck size={15} />
              </span>
              {doc}
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        open={!!contactJob}
        onClose={() => setContactJob(null)}
        title="ข้อมูลติดต่อลูกค้า"
        description={contactJob ? `${contactJob.id} — ${contactJob.customer}` : ""}
        footer={
          <>
            {contactJob && contactJob.paymentStatus !== "ชำระแล้ว" && !viewOnly && (
              <button type="button" className="btn btn-md btn-primary-flat" onClick={() => handleMarkPaid(contactJob.id)}>
                <IconCheck size={15} /> ยืนยันรับชำระเงินแล้ว
              </button>
            )}
            <button type="button" className="btn btn-md btn-secondary" onClick={() => setContactJob(null)}>ปิด</button>
          </>
        }
      >
        {contactJob && (() => {
          const c = customerList.find((cu) => cu.id === contactJob?.customerId);
          const phone = c?.phone || contactJob.phone || "";
          const paid = contactJob.paymentStatus === "ชำระแล้ว";
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
              <div className="doc-row">
                <span className="lbl"><IconUser size={15} /> ชื่อลูกค้า</span>
                <span>{c?.name || contactJob.customer}</span>
              </div>
              <div className="doc-row">
                <span className="lbl"><IconPhone size={15} /> เบอร์โทร</span>
                <span>{phone ? <a href={`tel:${phone}`}>{phone}</a> : "-"}</span>
              </div>
              <div className="doc-row">
                <span className="lbl"><IconMapPin size={15} /> ที่อยู่</span>
                <span>{formatAddress(c?.address || contactJob.siteAddress)}</span>
              </div>
              {c?.address?.mapUrl && (
                <div className="doc-row">
                  <span className="lbl"><IconMapPin size={15} /> แผนที่</span>
                  <span>
                    <a href={c.address.mapUrl} target="_blank" rel="noreferrer">เปิดแผนที่</a>
                  </span>
                </div>
              )}
              <div className="doc-row">
                <span className="lbl">ยอดค้างชำระ</span>
                <span style={{ fontWeight: 600 }}>{formatTHB(contactJob.amount)}</span>
              </div>
              <div className="doc-row">
                <span className="lbl">สถานะการชำระ</span>
                <span>{contactJob.paymentStatus}</span>
              </div>
              {!paid && (
                <p className="text-sm" style={{ color: "oklch(0.6 0.16 65)", margin: 0 }}>
                  รอชำระ — ควรติดต่อติดตาม
                </p>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
