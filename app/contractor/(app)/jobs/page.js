"use client";

import { useState } from "react";
import Modal from "@/app/components/Modal";
import { IconClock, IconCalendar, IconMapPin, IconShield, IconChevronRight } from "@/app/components/icons";
import { TODAY_ISO, personJobs, isJobLead, jobStatusLabel, jobStatusBadgeClass } from "@/app/lib/mockData";
import { formatAddress } from "@/app/lib/thaiAddress";
import { useJobs } from "@/app/lib/store";
import { useAuth } from "@/app/lib/auth";
import { formatDateTH } from "@/app/lib/format";

function addDaysISO(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

export default function ContractorJobsPage() {
  const [jobs] = useJobs();
  const { session } = useAuth();
  const [selectedJob, setSelectedJob] = useState(null);

  // Field-team focus: the jobs you still have to GO DO, ordered by when — today
  // first, then what's coming up. Completed jobs live in ประวัติงาน instead.
  const activeJobs = personJobs(session?.personId, jobs)
    .filter((j) => j.status !== "done")
    .sort((a, b) => `${a.scheduledDate} ${a.startTime}`.localeCompare(`${b.scheduledDate} ${b.startTime}`));
  const todayJobs = activeJobs.filter((j) => j.scheduledDate === TODAY_ISO);
  // This week = strictly future jobs (never anything before today) within 7 days.
  const weekCutoffISO = addDaysISO(TODAY_ISO, 7);
  const weekJobs = activeJobs.filter((j) => j.scheduledDate > TODAY_ISO && j.scheduledDate <= weekCutoffISO);

  function gpsUrl(job) {
    return job.siteAddress?.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(job.siteAddress))}`;
  }

  function JobCard({ job }) {
    const lead = isJobLead(session?.personId, job);
    const overdue = job.scheduledDate < TODAY_ISO;
    return (
      <div className="job-item">
        <div className="job-item-top">
          <div>
            <div className="job-item-title">{job.customer}</div>
            <div className="text-xs text-muted">{job.jobType}</div>
          </div>
          <span className={`badge ${jobStatusBadgeClass(job.status)}`}>{jobStatusLabel(job.status)}</span>
        </div>

        {/* Prominent appointment time — the "กี่โมง" the field team scans for */}
        <div className="job-time">
          <IconClock size={16} />
          <span className="job-time-hh">{job.startTime} - {job.endTime}</span>
        </div>
        <div className="text-xs text-muted flex-row" style={{ gap: "0.3rem", marginTop: "0.15rem" }}>
          <IconCalendar size={12} />
          {formatDateTH(job.scheduledDate)}
          {overdue && <span className="badge badge-destructive" style={{ marginLeft: "0.3rem", fontSize: "0.62rem" }}>เลยกำหนด</span>}
        </div>

        {lead && (
          <span className="badge badge-secondary flex-row" style={{ width: "fit-content", marginTop: "0.5rem", fontSize: "0.68rem" }}>
            <IconShield size={11} />คุณเป็นหัวหน้างานของงานนี้
          </span>
        )}

        <div className="job-item-meta" style={{ marginTop: "0.5rem" }}>
          <span><IconMapPin size={12} />{formatAddress(job.siteAddress)}</span>
        </div>

        <div className="flex-row" style={{ gap: "0.5rem", marginTop: "0.6rem" }}>
          <a className="btn btn-outline btn-sm" style={{ flex: 1 }} href={gpsUrl(job)} target="_blank" rel="noopener noreferrer">
            <IconMapPin size={14} /> นำทาง
          </a>
          <button type="button" className="btn btn-default btn-sm" style={{ flex: 1 }} onClick={() => setSelectedJob(job)}>
            ดูรายละเอียด
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.1rem" }}>งานวันนี้</h2>
      <p className="text-xs text-muted" style={{ marginBottom: "0.9rem" }}>
        {formatDateTH(TODAY_ISO)} · มี {todayJobs.length} งานที่ต้องไปทำวันนี้
      </p>

      {todayJobs.length === 0 ? (
        <div className="ds-card" style={{ padding: "1.1rem", textAlign: "center", marginBottom: "1.25rem" }}>
          <div className="text-sm" style={{ fontWeight: 600 }}>ไม่มีงานนัดหมายวันนี้ 🎉</div>
          <div className="text-xs text-muted" style={{ marginTop: "0.2rem" }}>ดูงานที่กำลังจะถึงด้านล่างได้เลย</div>
        </div>
      ) : (
        todayJobs.map((job) => <JobCard key={job.id} job={job} />)
      )}

      <div style={{ marginTop: "1.1rem" }}>
        <h3 className="flex-row" style={{ gap: "0.4rem", margin: "0 0 0.7rem" }}>
          <IconChevronRight size={15} /> งานสัปดาห์นี้ ({weekJobs.length})
        </h3>
        {weekJobs.length === 0 ? (
          <div className="text-xs text-muted" style={{ padding: "0.4rem 0" }}>
            ไม่มีงานที่กำลังจะถึงในสัปดาห์นี้
          </div>
        ) : (
          weekJobs.map((job) => <JobCard key={job.id} job={job} />)
        )}
      </div>

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
              <a className="btn btn-outline btn-sm btn-block" href={gpsUrl(selectedJob)} target="_blank" rel="noopener noreferrer">
                <IconMapPin size={14} />
                เปิดแผนที่ (Google Maps)
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
