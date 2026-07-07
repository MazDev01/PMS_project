"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Steps from "@/app/components/Steps";
import SignaturePad from "@/app/components/SignaturePad";
import GuestLockedActions from "@/app/components/GuestLockedActions";
import GuestInvalidLink from "@/app/components/GuestInvalidLink";
import { IconCheckCircle, IconImage } from "@/app/components/icons";
import { formatDateTimeTH } from "@/app/lib/format";
import { TODAY_ISO } from "@/app/lib/mockData";
import { useJobs, useGeneratedLinks, useStore, useUploads } from "@/app/lib/store";

// Only used when the page is opened with no ?token= at all — the "Demo Entry
// Points" on /guest link here directly for reviewers to preview the flow.
// A real customer link always carries a token and is resolved via
// generatedLinks below, never this constant.
const DEMO_JOB_ID = "J-2607-041";

// Real before/during/after field photos per job category (files in
// /public/work-photos). Shown when a job has no uploaded evidence yet, so the
// customer sign-off sheet reads like an actual delivery document. The trio is
// chosen to match the job's type — A/C installation is the default.
const WORK_PHOTO_SETS = {
  ac: { before: "/work-photos/ac-before.jpg", during: "/work-photos/ac-during.jpg", after: "/work-photos/ac-after.jpg" },
  elec: { before: "/work-photos/elec-before.jpg", during: "/work-photos/elec-during.jpg", after: "/work-photos/elec-after.jpg" },
  plumb: { before: "/work-photos/plumb-before.jpg", during: "/work-photos/plumb-during.jpg", after: "/work-photos/plumb-after.jpg" },
  fire: { before: "/work-photos/fire-before.jpg", during: "/work-photos/fire-during.jpg", after: "/work-photos/fire-after.jpg" },
};

function photoSetForJob(jobType = "") {
  if (jobType.includes("อัคคีภัย") || jobType.includes("ดับเพลิง")) return WORK_PHOTO_SETS.fire;
  if (jobType.includes("สุขาภิบาล") || jobType.includes("ประปา")) return WORK_PHOTO_SETS.plumb;
  if (jobType.includes("ไฟฟ้า") || jobType.includes("สื่อสาร")) return WORK_PHOTO_SETS.elec;
  return WORK_PHOTO_SETS.ac; // ปรับอากาศ / HVAC / ค่าเริ่มต้น
}

function GuestSignoffInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [jobList, setJobList] = useJobs();
  const [links] = useGeneratedLinks();
  const { addAuditLog, addNotification } = useStore();

  let job = null;
  if (token) {
    const link = links.find((l) => l.token === token && l.type === "delivery" && l.status === "active");
    job = link ? jobList.find((j) => j.id === link.jobId) : null;
  } else {
    job = jobList.find((j) => j.id === DEMO_JOB_ID) || jobList[0];
  }
  const [upload] = useUploads(job?.id);

  const uploadedPhotos = [
    ...upload.before.map((item) => ({ caption: "ก่อนทำ", url: item.url })),
    ...upload.during.map((item) => ({ caption: "ขณะทำ", url: item.url })),
    ...upload.after.map((item) => ({ caption: "หลังทำ", url: item.url })),
  ];
  const set = photoSetForJob(job?.jobType);
  const samplePhotos = [
    { caption: "ก่อนทำ", url: set.before },
    { caption: "ขณะทำ", url: set.during },
    { caption: "หลังทำ", url: set.after },
  ];
  const photos = uploadedPhotos.length > 0 ? uploadedPhotos : samplePhotos;

  const [hasSig, setHasSig] = useState(false);
  const [locked, setLocked] = useState(false);

  if (!job) {
    return <GuestInvalidLink />;
  }

  function handleSignoff() {
    setLocked(true);
    setJobList((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: "done", closedDate: TODAY_ISO } : j)));
    addAuditLog({ actor: `ลูกค้า - ${job.customer}`, role: "guest", action: "เซ็นอนุมัติรับมอบงาน", target: job.id });
    addNotification({ audience: "coordinator", title: "ลูกค้าเซ็นอนุมัติส่งมอบงาน", detail: `${job.id} — ${job.customer}` });
  }

  return (
    <div>
      <Steps steps={["ใบเสนอราคา", "คอนเฟิร์มวัน", "ใบส่งมอบงาน"]} currentIndex={2} />

      {locked ? (
        <div className="locked-wrap">
          <div className="ds-card locked-card">
            <div className="locked-icon"><IconCheckCircle size={32} /></div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              ขอบคุณที่ใช้บริการ
            </h2>
            <p className="text-sm text-muted" style={{ marginBottom: "1rem" }}>
              เอกสารส่งมอบงานได้รับการยืนยันเรียบร้อยแล้ว ระบบเริ่มนับระยะเวลารับประกันให้ทันที
            </p>
            <p className="text-xs text-muted font-mono">
              บันทึกเมื่อ {formatDateTimeTH(`${TODAY_ISO}T14:35:00`)} จาก IP: 203.150.42.18 (บันทึกอัตโนมัติเพื่อความปลอดภัย)
            </p>
            <GuestLockedActions />
          </div>
        </div>
      ) : (
        <>
          <div className="doc-preview">
            <div className="doc-preview-head">
              <h4>ใบส่งมอบงาน</h4>
              <span className="doc-no">DN-{job.id.replace("J-", "")}</span>
            </div>
            <div className="doc-row"><span className="lbl">เลขที่งาน</span><span>{job.id}</span></div>
            <div className="doc-row"><span className="lbl">ลูกค้า</span><span>{job.customer}</span></div>
            <div className="doc-row">
              <span className="lbl">รายการงานที่ดำเนินการ</span>
              <span style={{ textAlign: "right", maxWidth: 300 }}>
                {job.jobType} — ติดตั้งเครื่องปรับอากาศและเดินท่อน้ำยาครบตามแบบ
              </span>
            </div>
          </div>

          <div className="section-block">
            <h3>รูปภาพการปฏิบัติงานของทีมรับเหมา</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.7rem" }}>
              {photos.map((p, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <div className="thumb" style={{ width: "100%", aspectRatio: "4 / 3", height: "auto" }}>
                    {p.url ? (
                      <img src={p.url} alt={p.caption} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <IconImage size={22} />
                    )}
                  </div>
                  <span className="text-xs text-muted" style={{ textAlign: "center", fontWeight: 500 }}>{p.caption}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="section-block">
            <h3>เซ็นรับมอบงาน</h3>
            <SignaturePad onChange={setHasSig} />
            <button
              type="button"
              className="btn btn-md btn-default"
              style={{ marginTop: "1rem" }}
              disabled={!hasSig}
              onClick={handleSignoff}
            >
              ยืนยันการเซ็นรับมอบงาน
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function GuestSignoffPage() {
  return (
    <Suspense fallback={null}>
      <GuestSignoffInner />
    </Suspense>
  );
}
