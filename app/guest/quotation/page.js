"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Steps from "@/app/components/Steps";
import SignaturePad from "@/app/components/SignaturePad";
import GuestLockedActions from "@/app/components/GuestLockedActions";
import GuestInvalidLink from "@/app/components/GuestInvalidLink";
import { IconCheckCircle, IconAlertTriangle } from "@/app/components/icons";
import { formatTHB, formatDateTimeTH } from "@/app/lib/format";
import { TODAY_ISO } from "@/app/lib/mockData";
import { useJobs, useGeneratedLinks, useStore } from "@/app/lib/store";

// Only used when the page is opened with no ?token= at all — the "Demo Entry
// Points" on /guest link here directly for reviewers to preview the flow.
// A real customer link always carries a token and is resolved via
// generatedLinks below, never this constant.
const DEMO_JOB_ID = "J-2607-041";

const LINE_ITEMS = [
  { label: "ค่าเครื่องปรับอากาศพร้อมติดตั้ง × 12 เครื่อง", amount: 350000 },
  { label: "ค่าแรงเดินท่อน้ำยาแอร์และท่อระบายน้ำทิ้ง", amount: 96000 },
  { label: "ค่าดำเนินการและขนส่ง", amount: 40000 },
];

function GuestQuotationInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [jobList, setJobList] = useJobs();
  const [links] = useGeneratedLinks();
  const { addAuditLog, addNotification } = useStore();

  let job = null;
  if (token) {
    const link = links.find((l) => l.token === token && l.type === "quotation" && l.status === "active");
    job = link ? jobList.find((j) => j.id === link.jobId) : null;
  } else {
    job = jobList.find((j) => j.id === DEMO_JOB_ID) || jobList[0];
  }

  const [hasSig, setHasSig] = useState(false);
  const [locked, setLocked] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejected, setRejected] = useState(false);

  if (!job) {
    return <GuestInvalidLink />;
  }

  function handleApprove() {
    setLocked(true);
    setJobList((prev) => prev.map((j) => (j.id === job.id ? { ...j, quotationSigned: true } : j)));
    addAuditLog({ actor: `ลูกค้า - ${job.customer}`, role: "guest", action: "เซ็นอนุมัติใบเสนอราคา", target: job.id });
    addNotification({ audience: "coordinator", title: "ลูกค้าเซ็นอนุมัติใบเสนอราคา", detail: `${job.id} — ${job.customer}` });
  }

  function handleReject(e) {
    e.preventDefault();
    const reason = e.target.reason.value.trim();
    addAuditLog({ actor: `ลูกค้า - ${job.customer}`, role: "guest", action: "ปฏิเสธ/ขอแก้ไขใบเสนอราคา", target: job.id });
    addNotification({
      audience: "coordinator",
      title: "ลูกค้าปฏิเสธ / ขอแก้ไขใบเสนอราคา",
      detail: `${job.id} — ${job.customer}${reason ? ` · ${reason}` : " · ขอให้ปรับปรุงใบเสนอราคา"}`,
    });
    setRejected(true);
  }

  return (
    <div>
      <Steps steps={["ใบเสนอราคา", "คอนเฟิร์มวัน", "ใบส่งมอบงาน"]} currentIndex={0} />

      {locked ? (
        <div className="locked-wrap">
          <div className="ds-card locked-card">
            <div className="locked-icon"><IconCheckCircle size={32} /></div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              ใบเสนอราคาได้รับการอนุมัติเรียบร้อยแล้ว
            </h2>
            <p className="text-sm text-muted" style={{ marginBottom: "1rem" }}>
              ขอบคุณที่ใช้บริการ MACCA Light Engineering ลิงก์นี้ถูกล็อกโดยอัตโนมัติเพื่อป้องกันการทำรายการซ้ำ
              หากต้องการดำเนินการเพิ่มเติม กรุณาติดต่อผู้ประสานงานเพื่อขอลิงก์ใหม่
            </p>
            <p className="text-xs text-muted font-mono">
              บันทึกเมื่อ {formatDateTimeTH(`${TODAY_ISO}T14:35:00`)} จาก IP: 203.150.42.18 (บันทึกอัตโนมัติเพื่อความปลอดภัย)
            </p>
            <GuestLockedActions nextHref="/guest/confirm" nextLabel="คอนเฟิร์มวัน" />
          </div>
        </div>
      ) : (
        <>
          <div className="doc-preview">
            <div className="doc-preview-head">
              <h4>ใบเสนอราคา</h4>
              <span className="doc-no">QT-2607-041</span>
            </div>
            <div className="doc-row"><span className="lbl">ลูกค้า</span><span>{job.customer}</span></div>
            <div className="doc-row"><span className="lbl">เลขที่งาน</span><span>{job.id}</span></div>
            <div className="doc-row"><span className="lbl">ประเภทงาน</span><span>{job.jobType}</span></div>
            <div className="doc-row"><span className="lbl">ทีมช่างผู้ดำเนินการ</span><span>{(job.teams || [job.team]).join(", ")}</span></div>
            {LINE_ITEMS.map((item) => (
              <div className="doc-row" key={item.label}>
                <span className="lbl">{item.label}</span>
                <span>{formatTHB(item.amount)}</span>
              </div>
            ))}
            <div className="doc-total">
              <span>ยอดรวมทั้งสิ้น</span>
              <span className="amt">{formatTHB(job.amount)}</span>
            </div>
          </div>

          <div className="section-block">
            <h3>เซ็นอนุมัติใบเสนอราคา</h3>
            <SignaturePad onChange={setHasSig} />

            <div className="flex-row" style={{ marginTop: "1rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-md btn-default"
                disabled={!hasSig}
                onClick={handleApprove}
              >
                ยืนยันการเซ็นอนุมัติใบเสนอราคา
              </button>
              <button
                type="button"
                className="btn btn-md btn-outline"
                onClick={() => setRejectOpen((v) => !v)}
              >
                ปฏิเสธ / ส่งกลับเพื่อแก้ไข
              </button>
            </div>

            {rejectOpen && (
              <div className="ds-card" style={{ marginTop: "1rem" }}>
                <div className="ds-card-content">
                  {rejected ? (
                    <div className="ds-alert ds-alert-warning">
                      <div className="ds-alert-icon"><IconAlertTriangle size={16} /></div>
                      <div>ส่งคำขอแก้ไขกลับไปยังผู้ประสานงานเรียบร้อยแล้ว เจ้าหน้าที่จะติดต่อกลับพร้อมใบเสนอราคาที่ปรับปรุงแล้ว</div>
                    </div>
                  ) : (
                    <form onSubmit={handleReject}>
                      <div className="form-group">
                        <label className="ds-label">เหตุผล / จุดที่ต้องการให้แก้ไข</label>
                        <textarea className="ds-textarea" name="reason" rows={3} placeholder="เช่น ราคาสูงกว่างบ, ขอปรับสเปก, ขอลดจำนวน ฯลฯ" />
                      </div>
                      <button type="submit" className="btn btn-md btn-default">ส่งคำขอแก้ไขให้ผู้ประสานงาน</button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function GuestQuotationPage() {
  return (
    <Suspense fallback={null}>
      <GuestQuotationInner />
    </Suspense>
  );
}
