"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Steps from "@/app/components/Steps";
import GuestLockedActions from "@/app/components/GuestLockedActions";
import GuestInvalidLink from "@/app/components/GuestInvalidLink";
import { IconCheckCircle } from "@/app/components/icons";
import { formatDateTH, formatDateTimeTH } from "@/app/lib/format";
import { TODAY_ISO } from "@/app/lib/mockData";
import { formatAddress } from "@/app/lib/thaiAddress";
import { useJobs, useGeneratedLinks, useScheduleEvents, useStore } from "@/app/lib/store";

// Only used when the page is opened with no ?token= at all — the "Demo Entry
// Points" on /guest link here directly for reviewers to preview the flow.
// A real customer link always carries a token and is resolved via
// generatedLinks below, never this constant.
const DEMO_JOB_ID = "J-2607-041";

function GuestConfirmInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [jobList] = useJobs();
  const [links] = useGeneratedLinks();
  const [, setScheduleEvents] = useScheduleEvents();
  const { addAuditLog, addNotification } = useStore();

  let job = null;
  if (token) {
    const link = links.find((l) => l.token === token && l.type === "plan" && l.status === "active");
    job = link ? jobList.find((j) => j.id === link.jobId) : null;
  } else {
    job = jobList.find((j) => j.id === DEMO_JOB_ID) || jobList[0];
  }

  const [locked, setLocked] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleSent, setRescheduleSent] = useState(false);

  if (!job) {
    return <GuestInvalidLink />;
  }

  function handleConfirmDate() {
    setLocked(true);
    setScheduleEvents((prev) => prev.map((e) => (e.jobId === job.id ? { ...e, status: "confirmed" } : e)));
    addAuditLog({ actor: `ลูกค้า - ${job.customer}`, role: "guest", action: "ยืนยันวันนัดหมายผ่านลิงก์", target: job.id });
    addNotification({ audience: "coordinator", title: "ลูกค้ายืนยันวันนัดหมาย", detail: `${job.id} — ${job.customer}` });
    addNotification({ audience: "contractor", title: "แผนงานได้รับการยืนยัน", detail: `${job.id} — ${job.customer} · ${formatDateTH(job.scheduledDate)}` });
  }

  return (
    <div>
      <Steps steps={["ใบเสนอราคา", "คอนเฟิร์มวัน", "ใบส่งมอบงาน"]} currentIndex={1} />

      {locked ? (
        <div className="locked-wrap">
          <div className="ds-card locked-card">
            <div className="locked-icon"><IconCheckCircle size={32} /></div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              ยืนยันวันนัดหมายเรียบร้อยแล้ว
            </h2>
            <p className="text-sm text-muted" style={{ marginBottom: "1rem" }}>
              ทีมช่างจะเข้าดำเนินการตามวันเวลาที่ระบุ ลิงก์นี้ถูกล็อกโดยอัตโนมัติเพื่อป้องกันการทำรายการซ้ำ
            </p>
            <p className="text-xs text-muted font-mono">
              บันทึกเมื่อ {formatDateTimeTH(`${TODAY_ISO}T14:35:00`)} จาก IP: 203.150.42.18 (บันทึกอัตโนมัติเพื่อความปลอดภัย)
            </p>
            <GuestLockedActions nextHref="/guest/signoff" nextLabel="ใบส่งมอบงาน" />
          </div>
        </div>
      ) : (
        <>
          <div className="doc-preview">
            <div className="doc-preview-head">
              <h4>รายละเอียดนัดหมาย</h4>
              <span className="doc-no">{job.id}</span>
            </div>
            <div className="doc-row"><span className="lbl">วันที่นัดหมาย</span><span>{formatDateTH(job.scheduledDate)}</span></div>
            <div className="doc-row"><span className="lbl">ช่วงเวลา</span><span>08:30 - 16:00 น.</span></div>
            <div className="doc-row"><span className="lbl">ทีมช่างผู้เข้าปฏิบัติงาน</span><span>{job.team}</span></div>
            <div className="doc-row">
              <span className="lbl">สถานที่</span>
              <span style={{ textAlign: "right", maxWidth: 300 }}>{job.customer}, {formatAddress(job.siteAddress)}</span>
            </div>
          </div>

          <div className="section-block">
            <div className="flex-row" style={{ flexWrap: "wrap" }}>
              <button type="button" className="btn btn-md btn-default" onClick={handleConfirmDate}>
                ยืนยันวันนัดหมาย
              </button>
              <button
                type="button"
                className="btn btn-md btn-outline"
                onClick={() => setRescheduleOpen((v) => !v)}
              >
                ขอเลื่อนนัดหมาย / เลือกวันใหม่
              </button>
            </div>

            {rescheduleOpen && (
              <div className="ds-card" style={{ marginTop: "1rem" }}>
                <div className="ds-card-content">
                  {rescheduleSent ? (
                    <div className="ds-alert ds-alert-success">
                      <div className="ds-alert-icon"><IconCheckCircle size={16} /></div>
                      <div>ส่งคำขอเลื่อนนัดไปยังผู้ประสานงานเรียบร้อยแล้ว เจ้าหน้าที่จะติดต่อกลับเพื่อยืนยันวันใหม่</div>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.target;
                        const newDate = form.newDate.value;
                        const newStart = form.newStart.value;
                        const newEnd = form.newEnd.value;
                        const note = form.note.value.trim();
                        const timePart = newStart ? ` เวลา ${newStart}${newEnd ? `-${newEnd}` : ""} น.` : "";
                        addAuditLog({ actor: `ลูกค้า - ${job.customer}`, role: "guest", action: "ขอเลื่อนนัดหมาย", target: job.id });
                        addNotification({
                          audience: "coordinator",
                          title: "ลูกค้าขอเลื่อนนัดหมาย",
                          detail: `${job.id} — ${job.customer} · ขอวันใหม่ ${formatDateTH(newDate)}${timePart}${note ? ` · ${note}` : ""}`,
                        });
                        setRescheduleSent(true);
                      }}
                    >
                      <div className="form-group">
                        <label className="ds-label">เลือกวันใหม่ที่สะดวก</label>
                        <input className="ds-input" type="date" name="newDate" required />
                      </div>
                      <div className="form-group">
                        <label className="ds-label">ช่วงเวลาที่สะดวกให้ช่างเข้า</label>
                        <div className="flex-row" style={{ gap: "0.4rem" }}>
                          <input className="ds-input" type="time" name="newStart" defaultValue="08:30" aria-label="เวลาเริ่ม" />
                          <span className="text-muted">–</span>
                          <input className="ds-input" type="time" name="newEnd" defaultValue="16:00" aria-label="เวลาสิ้นสุด" />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="ds-label">หมายเหตุ</label>
                        <textarea className="ds-textarea" name="note" rows={3} placeholder="ระบุเหตุผลหรือช่วงเวลาที่สะดวก (ถ้ามี)" />
                      </div>
                      <button type="submit" className="btn btn-md btn-default">ส่งคำขอเลื่อนนัด</button>
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

export default function GuestConfirmPage() {
  return (
    <Suspense fallback={null}>
      <GuestConfirmInner />
    </Suspense>
  );
}
