"use client";

import { useState } from "react";
import Modal from "@/app/components/Modal";
import { IconCheckCircle, IconClock, IconMapPin, IconShield } from "@/app/components/icons";
import { personJobs, isJobLead } from "@/app/lib/mockData";
import { formatAddress } from "@/app/lib/thaiAddress";
import { useJobs } from "@/app/lib/store";
import { useAuth } from "@/app/lib/auth";
import { formatDateTH } from "@/app/lib/format";

export default function ContractorHistoryPage() {
  const [jobs] = useJobs();
  const { session } = useAuth();
  // Read-only look-back: only the contractor's COMPLETED jobs, newest first.
  const doneJobs = personJobs(session?.personId, jobs)
    .filter((j) => j.status === "done")
    .sort((a, b) => (b.closedDate || b.scheduledDate).localeCompare(a.closedDate || a.scheduledDate));
  const [selectedJob, setSelectedJob] = useState(null);

  return (
    <div>
      <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.25rem" }}>ประวัติงาน</h2>
      <p className="text-xs text-muted" style={{ marginBottom: "0.9rem" }}>
        งานที่ทำเสร็จแล้วทั้งหมด {doneJobs.length} งาน · เรียงจากล่าสุด
      </p>

      {doneJobs.length === 0 ? (
        <div className="empty-state">
          <div>ยังไม่มีงานที่ทำเสร็จ</div>
        </div>
      ) : (
        doneJobs.map((job) => {
          const lead = isJobLead(session?.personId, job);
          return (
            <div className="job-item" key={job.id}>
              <div className="job-item-top">
                <div>
                  <div className="job-item-title">{job.customer}</div>
                  <div className="text-xs text-muted">{job.jobType}</div>
                </div>
                <span className="badge badge-success flex-row" style={{ gap: "0.25rem" }}>
                  <IconCheckCircle size={11} /> เสร็จสิ้น
                </span>
              </div>
              {lead && (
                <span className="badge badge-secondary flex-row" style={{ width: "fit-content", marginTop: "0.4rem", fontSize: "0.68rem" }}>
                  <IconShield size={11} />คุณเป็นหัวหน้างานของงานนี้
                </span>
              )}
              <div className="job-item-meta">
                <span><IconCheckCircle size={12} />เสร็จเมื่อ {formatDateTH(job.closedDate || job.scheduledDate)}</span>
                <span><IconMapPin size={12} />{formatAddress(job.siteAddress)}</span>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm btn-block"
                style={{ marginTop: "0.6rem" }}
                onClick={() => setSelectedJob(job)}
              >
                ดูรายละเอียดงาน
              </button>
            </div>
          );
        })
      )}

      <Modal
        open={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        title={selectedJob ? selectedJob.customer : ""}
        description={selectedJob ? selectedJob.jobType : ""}
        maxWidth={400}
        footer={
          <button type="button" className="btn btn-md btn-secondary" onClick={() => setSelectedJob(null)}>
            ปิด
          </button>
        }
      >
        {selectedJob && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
            <div className="doc-row">
              <span className="lbl">เลขที่งาน</span>
              <span>{selectedJob.id}</span>
            </div>
            <div className="doc-row">
              <span className="lbl">ประเภทงาน</span>
              <span>{selectedJob.jobType}</span>
            </div>
            <div className="doc-row">
              <span className="lbl">วันนัดหมาย</span>
              <span><IconClock size={12} /> {formatDateTH(selectedJob.scheduledDate)} · {selectedJob.startTime}-{selectedJob.endTime}</span>
            </div>
            <div className="doc-row">
              <span className="lbl">เสร็จเมื่อ</span>
              <span>{formatDateTH(selectedJob.closedDate || selectedJob.scheduledDate)}</span>
            </div>
            <div className="doc-row">
              <span className="lbl">บทบาทของคุณ</span>
              <span>{isJobLead(session?.personId, selectedJob) ? "หัวหน้างาน" : "สมาชิก"}</span>
            </div>

            <div style={{ marginTop: "0.9rem" }}>
              <div className="text-xs text-muted" style={{ marginBottom: "0.35rem" }}>ที่อยู่หน้างาน</div>
              <div className="text-sm">{formatAddress(selectedJob.siteAddress)}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
