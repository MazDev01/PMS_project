"use client";

import { useState } from "react";
import Modal from "@/app/components/Modal";
import SignaturePad from "@/app/components/SignaturePad";
import { IconFileText, IconClock, IconMapPin, IconChevronLeft, IconShield, IconX } from "@/app/components/icons";
import { TODAY_ISO, personJobs, isJobLead, jobStatusLabel, jobStatusBadgeClass } from "@/app/lib/mockData";
import { formatAddress } from "@/app/lib/thaiAddress";
import { useJobs, useUploads, useStore, fileToDataUrl } from "@/app/lib/store";
import { useAuth } from "@/app/lib/auth";
import { formatDateTH } from "@/app/lib/format";

// Photos are pooled into ONE shared gallery per job (not one per crew
// member) — every member uploads into the same before/during/after arrays,
// each item tagged with who took it, so a 4-person crew doesn't produce 4x
// duplicate galleries.
const MAX_PHOTOS = 3;

function UploadStage({ label, hint, files, onSelect, onRemove, disabled }) {
  const full = files.length >= MAX_PHOTOS;
  return (
    <div className="upload-slot">
      <h5>{label} <span className="upload-count">{files.length}/{MAX_PHOTOS}</span></h5>
      <p>{hint}</p>
      {!disabled && !full && (
        <label className="btn btn-outline btn-sm" style={{ cursor: "pointer" }}>
          เลือกรูปภาพ
          <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={onSelect} />
        </label>
      )}
      {!disabled && full && (
        <div className="text-xs text-muted">ครบ {MAX_PHOTOS} รูปแล้ว — กด ✕ ที่รูปเพื่อลบและเปลี่ยนรูปใหม่</div>
      )}
      {files.length > 0 && (
        <div className="thumb-row">
          {files.map((item, i) => (
            <div className="thumb upload-thumb" key={i} title={item.uploadedBy ? `ถ่ายโดย ${item.uploadedBy}` : ""}>
              <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {!disabled && (
                <button type="button" className="thumb-remove" aria-label="ลบรูป" title="ลบรูป" onClick={() => onRemove(i)}>
                  <IconX size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ContractorUploadPage() {
  const [jobList, setJobList] = useJobs();
  const { session } = useAuth();
  const { addAuditLog, addNotification } = useStore();
  const [selectedJobId, setSelectedJobId] = useState(null);

  const myJobs = personJobs(session?.personId, jobList);
  // Photos/documents can only be added while a job is still in progress. Once
  // it's delivered/closed nothing can be changed or added — so the picker only
  // offers in-progress jobs, and an already-closed job renders read-only.
  const uploadableJobs = myJobs.filter((j) => j.status === "in_progress");
  const todayJob = myJobs.find((j) => j.id === selectedJobId);
  const iAmLead = isJobLead(session?.personId, todayJob);
  const locked = !!todayJob && todayJob.status !== "in_progress";

  const [upload, setUpload] = useUploads(selectedJobId);

  const [sigModalOpen, setSigModalOpen] = useState(false);
  const [hasSig, setHasSig] = useState(false);

  async function handlePhotoChange(stage, e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    // Cap each stage at MAX_PHOTOS — only add up to the remaining free slots.
    const remaining = MAX_PHOTOS - upload[stage].length;
    if (remaining <= 0) return;
    const dataUrls = await Promise.all(files.slice(0, remaining).map(fileToDataUrl));
    const items = dataUrls.map((url) => ({ url, uploadedBy: session?.name || "ช่างสาธิต" }));
    setUpload((prev) => ({ ...prev, [stage]: [...prev[stage], ...items].slice(0, MAX_PHOTOS) }));
  }

  function handleRemovePhoto(stage, index) {
    setUpload((prev) => ({ ...prev, [stage]: prev[stage].filter((_, i) => i !== index) }));
  }

  function handlePdfChange(e) {
    const file = e.target.files && e.target.files[0];
    if (file) setUpload((prev) => ({ ...prev, deliveryFileName: file.name }));
    e.target.value = "";
  }

  function handleSendToCoordinator() {
    setUpload((prev) => ({ ...prev, sentToCoordinator: true, signedOff: false }));
    addAuditLog({ actor: session?.name || "ช่างสาธิต", role: "contractor", action: "ส่งใบส่งมอบงานให้ผู้ประสานงานออกลิงก์", target: todayJob.id });
    addNotification({ audience: "coordinator", title: "ผู้รับเหมาส่งใบส่งมอบงาน", detail: `${todayJob.id} — ${todayJob.customer} รอออกลิงก์เซ็นรับงาน` });
  }

  function openSignatureModal() {
    setHasSig(false);
    setSigModalOpen(true);
  }
  function closeSignatureModal() {
    setSigModalOpen(false);
    setHasSig(false);
  }
  function handleConfirmSignature() {
    setSigModalOpen(false);
    setUpload((prev) => ({ ...prev, signedOff: true, sentToCoordinator: false }));
    setJobList((prev) => prev.map((j) => (j.id === todayJob.id ? { ...j, status: "done", closedDate: TODAY_ISO } : j)));
    addAuditLog({ actor: session?.name || "ช่างสาธิต", role: "contractor", action: "เซ็นรับงานหน้างานและปิดงานอัตโนมัติ", target: todayJob.id });
    addNotification({ audience: "coordinator", title: "ผู้รับเหมาปิดงานหน้างานเรียบร้อย", detail: `${todayJob.id} — ${todayJob.customer}` });
  }

  function selectJob(id) {
    setSelectedJobId(id);
  }

  function backToJobList() {
    setSelectedJobId(null);
  }

  if (!todayJob) {
    return (
      <div>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.15rem" }}>ส่งรูปภาพ</h2>
        <p className="text-xs text-muted" style={{ marginBottom: "1rem" }}>เลือกงานที่กำลังดำเนินการเพื่อส่งรูปภาพและเอกสาร · งานที่ส่งมอบแล้วแก้ไข/เพิ่มไม่ได้</p>

        {uploadableJobs.length === 0 ? (
          <div className="empty-state"><div>ไม่มีงานที่กำลังดำเนินการ — ส่งรูปได้เฉพาะงานที่ยังทำอยู่</div></div>
        ) : (
          uploadableJobs.map((job) => (
            <div className="job-item" key={job.id}>
              <div className="job-item-top">
                <div>
                  <div className="job-item-title">{job.customer}</div>
                  <div className="text-xs text-muted">{job.jobType}</div>
                </div>
                <span className={`badge ${jobStatusBadgeClass(job.status)}`}>{jobStatusLabel(job.status)}</span>
              </div>
              <div className="job-item-meta">
                <span><IconClock size={12} />{formatDateTH(job.scheduledDate)} · {job.startTime}-{job.endTime}</span>
                <span><IconMapPin size={12} />{formatAddress(job.siteAddress)}</span>
              </div>
              <button
                type="button"
                className="btn btn-default btn-sm btn-block"
                style={{ marginTop: "0.6rem" }}
                onClick={() => selectJob(job.id)}
              >
                เลือกงานนี้
              </button>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div>
      <button type="button" onClick={backToJobList} className="flex-row text-sm text-muted" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", marginBottom: "0.9rem" }}>
        <IconChevronLeft size={15} /> เปลี่ยนงาน
      </button>
      <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.15rem" }}>ส่งรูปภาพ</h2>
      <p className="text-xs text-muted" style={{ marginBottom: "1rem" }}>
        งานที่เลือก: {todayJob.customer} · {todayJob.jobType}
      </p>

      {locked && (
        <div className="ds-alert ds-alert-success flex-row" style={{ marginBottom: "1rem" }}>
          <IconShield size={15} />
          <div>งานนี้ส่งมอบ/ปิดเรียบร้อยแล้ว — ดูรูปที่อัปไว้ได้อย่างเดียว ไม่สามารถเปลี่ยนหรือเพิ่มได้อีก</div>
        </div>
      )}

      <UploadStage
        label="รูปก่อนทำ"
        hint="ถ่ายภาพหน้างานก่อนเริ่มปฏิบัติงาน (.png / .jpg) — สูงสุด 3 รูป"
        files={upload.before}
        onSelect={(e) => handlePhotoChange("before", e)}
        onRemove={(i) => handleRemovePhoto("before", i)}
        disabled={locked}
      />
      <UploadStage
        label="รูปขณะทำ"
        hint="บันทึกภาพระหว่างขั้นตอนการปฏิบัติงาน — สูงสุด 3 รูป"
        files={upload.during}
        onSelect={(e) => handlePhotoChange("during", e)}
        onRemove={(i) => handleRemovePhoto("during", i)}
        disabled={locked}
      />
      <UploadStage
        label="รูปหลังทำ"
        hint="ถ่ายภาพผลงานหลังปฏิบัติงานเสร็จสิ้นก่อนส่งมอบ — สูงสุด 3 รูป"
        files={upload.after}
        onSelect={(e) => handlePhotoChange("after", e)}
        onRemove={(i) => handleRemovePhoto("after", i)}
        disabled={locked}
      />

      <div className="upload-slot">
        <h5>แนบไฟล์ใบส่งมอบงาน (PDF)</h5>
        <p>รองรับไฟล์ประเภท PDF เท่านั้น</p>
        {!locked && (
          <label className="btn btn-outline btn-sm" style={{ cursor: "pointer" }}>
            เลือกไฟล์ PDF
            <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={handlePdfChange} />
          </label>
        )}
        {upload.deliveryFileName && (
          <div
            className="text-xs"
            style={{ marginTop: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}
          >
            <IconFileText size={13} />
            {upload.deliveryFileName}
          </div>
        )}
      </div>

      {upload.sentToCoordinator && (
        <div className="ds-alert ds-alert-info" style={{ marginTop: "1rem" }}>
          <div>
            <strong>ส่งข้อมูลเรียบร้อยแล้ว</strong>
            ผู้ประสานงานจะออกลิงก์ให้ลูกค้ายืนยันและเซ็นรับงานออนไลน์
          </div>
        </div>
      )}
      {upload.signedOff && (
        <div className="ds-alert ds-alert-success" style={{ marginTop: "1rem" }}>
          <div>
            <strong>บันทึกสำเร็จ</strong>
            บันทึกลายเซ็นและเปลี่ยนสถานะงานเป็นเสร็จสิ้นแล้ว
          </div>
        </div>
      )}

      {!locked && (iAmLead ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "1.25rem" }}>
          <button type="button" className="btn btn-secondary btn-md btn-block" onClick={handleSendToCoordinator}>
            ส่งให้ผู้ประสานงานออกลิงก์
          </button>
          <button type="button" className="btn btn-default btn-md btn-block" onClick={openSignatureModal}>
            เซ็นรับงานทันทีหน้างาน
          </button>
        </div>
      ) : (
        <div className="ds-alert ds-alert-info flex-row" style={{ marginTop: "1.25rem" }}>
          <IconShield size={15} />
          <div>การส่งเอกสารให้ผู้ประสานงานและเซ็นรับงานทำได้โดยหัวหน้างานของงานนี้เท่านั้น — คุณอัปโหลดรูปภาพได้ตามปกติ</div>
        </div>
      ))}

      <Modal
        open={sigModalOpen}
        onClose={closeSignatureModal}
        title="เซ็นรับงานหน้างาน"
        description={todayJob ? `ยืนยันการส่งมอบงานสำหรับ ${todayJob.customer}` : "ยืนยันการส่งมอบงาน"}
        maxWidth={400}
        footer={
          <button
            type="button"
            className="btn btn-default btn-md btn-block"
            disabled={!hasSig}
            onClick={handleConfirmSignature}
          >
            ยืนยันลายเซ็นและปิดงาน
          </button>
        }
      >
        <SignaturePad onChange={setHasSig} />
      </Modal>
    </div>
  );
}
