"use client";

import { useState } from "react";
import Modal from "@/app/components/Modal";
import { IconClock, IconMapPin, IconShield } from "@/app/components/icons";
import { personJobs, isJobLead, jobStatusLabel, jobStatusBadgeClass } from "@/app/lib/mockData";
import { formatAddress } from "@/app/lib/thaiAddress";
import { useJobs } from "@/app/lib/store";
import { useAuth } from "@/app/lib/auth";
import { formatDateTH } from "@/app/lib/format";

export default function ContractorJobsPage() {
  const [jobs] = useJobs();
  const { session } = useAuth();
  const myJobs = personJobs(session?.personId, jobs);
  const [selectedJob, setSelectedJob] = useState(null);

  function openDetail(job) {
    setSelectedJob(job);
  }
  function closeDetail() {
    setSelectedJob(null);
  }

  function openGPS(job) {
    const url = job.siteAddress?.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(job.siteAddress))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div>
      <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.9rem" }}>งานของฉัน</h2>

      {myJobs.length === 0 ? (
        <div className="empty-state">
          <div>ยังไม่มีงานที่มอบหมายให้คุณ</div>
        </div>
      ) : (
        myJobs.map((job) => {
          const lead = isJobLead(session?.personId, job);
          return (
            <div className="job-item" key={job.id}>
              <div className="job-item-top">
                <div>
                  <div className="job-item-title">{job.customer}</div>
                  <div className="text-xs text-muted">{job.jobType}</div>
                </div>
                <span className={`badge ${jobStatusBadgeClass(job.status)}`}>{jobStatusLabel(job.status)}</span>
              </div>
              {lead && <span className="badge badge-secondary flex-row" style={{ width: "fit-content", marginTop: "0.4rem", fontSize: "0.68rem" }}><IconShield size={11} />คุณเป็นหัวหน้างานของงานนี้</span>}
              <div className="job-item-meta">
                <span><IconClock size={12} />{formatDateTH(job.scheduledDate)} · {job.startTime}-{job.endTime}</span>
                <span><IconMapPin size={12} />{formatAddress(job.siteAddress)}</span>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm btn-block"
                style={{ marginTop: "0.6rem" }}
                onClick={() => openDetail(job)}
              >
                ดูรายละเอียดงานฉบับเต็ม
              </button>
            </div>
          );
        })
      )}

      <Modal
        open={!!selectedJob}
        onClose={closeDetail}
        title={selectedJob ? selectedJob.customer : ""}
        description={selectedJob ? selectedJob.jobType : ""}
        maxWidth={400}
        footer={
          <button type="button" className="btn btn-md btn-secondary" onClick={closeDetail}>
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
              <span className="lbl">วันที่ / เวลา</span>
              <span>{formatDateTH(selectedJob.scheduledDate)} · {selectedJob.startTime}-{selectedJob.endTime}</span>
            </div>
            <div className="doc-row">
              <span className="lbl">สถานะ</span>
              <span className={`badge ${jobStatusBadgeClass(selectedJob.status)}`}>{jobStatusLabel(selectedJob.status)}</span>
            </div>
            <div className="doc-row">
              <span className="lbl">บทบาทของคุณ</span>
              <span>{isJobLead(session?.personId, selectedJob) ? "หัวหน้างาน" : "สมาชิก"}</span>
            </div>

            <div style={{ marginTop: "0.9rem" }}>
              <div className="text-xs text-muted" style={{ marginBottom: "0.35rem" }}>ที่อยู่หน้างาน</div>
              <div className="text-sm" style={{ marginBottom: "0.75rem" }}>{formatAddress(selectedJob.siteAddress)}</div>
              <button type="button" className="btn btn-outline btn-sm btn-block" onClick={() => openGPS(selectedJob)}>
                <IconMapPin size={14} />
                เปิด GPS นำทาง
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
