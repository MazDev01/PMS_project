"use client";

import { useState } from "react";
import Modal from "@/app/components/Modal";
import MonthCalendar from "@/app/components/MonthCalendar";
import { IconClock, IconMapPin, IconChevronLeft, IconChevronRight } from "@/app/components/icons";
import { TODAY_ISO, personJobs } from "@/app/lib/mockData";
import { formatAddress } from "@/app/lib/thaiAddress";
import { useScheduleEvents, useJobs } from "@/app/lib/store";
import { useAuth } from "@/app/lib/auth";
import { THAI_DOW, formatDateTH } from "@/app/lib/format";

// Parse a "YYYY-MM-DD" string as a local calendar date (avoids the UTC/local
// timezone shift that `new Date(isoString)` can introduce).
function toLocalDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function pad(n) {
  return String(n).padStart(2, "0");
}
function toISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
// Sunday of the week containing `iso` — matches THAI_DOW's Sun-first order.
function weekStartFor(iso) {
  const d = toLocalDate(iso);
  d.setDate(d.getDate() - d.getDay());
  return toISO(d);
}
function datesOfWeek(weekStartIso) {
  const start = toLocalDate(weekStartIso);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toISO(d);
  });
}

function statusMeta(status) {
  if (status === "done") return { cls: "badge-success", label: "เสร็จสิ้น" };
  if (status === "confirmed") return { cls: "badge-warning", label: "ยืนยันแล้ว" };
  return { cls: "badge-secondary", label: "รอยืนยัน" };
}

export default function ContractorCalendarPage() {
  const [scheduleEvents] = useScheduleEvents();
  const [jobs] = useJobs();
  const { session } = useAuth();
  const [view, setView] = useState("month");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dayModal, setDayModal] = useState(null);
  const [weekStart, setWeekStart] = useState(() => weekStartFor(TODAY_ISO));
  const weekDates = datesOfWeek(weekStart);

  // Only events for jobs where I'm actually part of the crew (lead or
  // member) — not whole-team scheduling, since assignment is per-person now.
  const myJobIds = new Set(personJobs(session?.personId, jobs).map((j) => j.id));
  const myEvents = scheduleEvents.filter((e) => myJobIds.has(e.jobId));

  function openGPS(job) {
    const url = job.siteAddress?.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(job.siteAddress))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const selectedJob = selectedEvent ? jobs.find((j) => j.id === selectedEvent.jobId) : null;

  function shiftWeek(days) {
    setWeekStart((prev) => {
      const d = toLocalDate(prev);
      d.setDate(d.getDate() + days);
      return toISO(d);
    });
  }

  return (
    <div>
      <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.9rem" }}>ปฏิทิน (ปฏิบัติงาน)</h2>

      <div className="ds-tab-list" style={{ marginBottom: "1.1rem" }}>
        <button type="button" className={`ds-tab ${view === "week" ? "active" : ""}`} onClick={() => setView("week")}>
          รายสัปดาห์
        </button>
        <button type="button" className={`ds-tab ${view === "month" ? "active" : ""}`} onClick={() => setView("month")}>
          รายเดือน
        </button>
      </div>

      {view === "month" ? (
        <>
          <p className="text-xs text-muted" style={{ marginBottom: "0.6rem" }}>แตะที่วันเพื่อดูรายชื่องานของวันนั้น</p>
          <MonthCalendar
            year={2026}
            month={6}
            events={myEvents}
            size="lg"
            onEventClick={setSelectedEvent}
            onDayClick={(date, events) => setDayModal({ date, events })}
          />
        </>
      ) : (
        <>
          <div className="cal-header">
            <h3>{formatDateTH(weekDates[0])} – {formatDateTH(weekDates[6])}</h3>
            <div className="flex-row">
              <button className="app-icon-btn" onClick={() => shiftWeek(-7)} aria-label="สัปดาห์ก่อนหน้า">
                <IconChevronLeft size={15} />
              </button>
              <button className="app-icon-btn" onClick={() => shiftWeek(7)} aria-label="สัปดาห์ถัดไป">
                <IconChevronRight size={15} />
              </button>
            </div>
          </div>
          <div className="cal-week-row">
          {weekDates.map((dateStr) => {
            const d = toLocalDate(dateStr);
            const isToday = dateStr === TODAY_ISO;
            const dayEvents = myEvents.filter((e) => e.date === dateStr);
            return (
              <div
                className="cal-week-item"
                key={dateStr}
                style={isToday ? { borderColor: "var(--primary)" } : undefined}
              >
                <div className="cal-week-date">
                  <div className="dow">{THAI_DOW[d.getDay()]}</div>
                  <div className="num">{d.getDate()}</div>
                </div>
                <div style={{ flex: 1 }}>
                  {dayEvents.length === 0 ? (
                    <div className="text-xs text-muted">ไม่มีงาน</div>
                  ) : (
                    dayEvents.map((ev, i) => {
                      const meta = statusMeta(ev.status);
                      return (
                        <button
                          type="button"
                          key={i}
                          onClick={() => setSelectedEvent(ev)}
                          style={{
                            display: "block", width: "100%", textAlign: "left", background: "none", border: "none",
                            padding: 0, cursor: "pointer", marginBottom: i < dayEvents.length - 1 ? "0.6rem" : 0,
                          }}
                        >
                          <div className="text-sm" style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                            {ev.title}
                          </div>
                          <span className={`badge ${meta.cls}`}>{meta.label}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </>
      )}

      <Modal
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedJob ? selectedJob.customer : selectedEvent?.title}
        description={selectedEvent ? formatDateTH(selectedEvent.date) : ""}
        maxWidth={400}
        footer={<button type="button" className="btn btn-md btn-secondary" onClick={() => setSelectedEvent(null)}>ปิด</button>}
      >
        {selectedEvent && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
            <div className="doc-row">
              <span className="lbl">เลขที่งาน</span>
              <span>{selectedEvent.jobId}</span>
            </div>
            {selectedJob && (
              <div className="doc-row">
                <span className="lbl">ประเภทงาน</span>
                <span>{selectedJob.jobType}</span>
              </div>
            )}
            <div className="doc-row">
              <span className="lbl">สถานะ</span>
              <span className={`badge ${statusMeta(selectedEvent.status).cls}`}>{statusMeta(selectedEvent.status).label}</span>
            </div>

            {selectedJob && (
              <div style={{ marginTop: "0.9rem" }}>
                <div className="text-xs text-muted" style={{ marginBottom: "0.35rem" }}>ที่อยู่หน้างาน</div>
                <div className="text-sm flex-row" style={{ marginBottom: "0.75rem" }}><IconMapPin size={13} />{formatAddress(selectedJob.siteAddress)}</div>
                <div className="text-sm flex-row" style={{ marginBottom: "0.75rem" }}><IconClock size={13} />{selectedJob.startTime}-{selectedJob.endTime}</div>
                <button type="button" className="btn btn-outline btn-sm btn-block" onClick={() => openGPS(selectedJob)}>
                  <IconMapPin size={14} />
                  เปิด GPS นำทาง
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={!!dayModal}
        onClose={() => setDayModal(null)}
        title={dayModal ? formatDateTH(dayModal.date) : ""}
        description="งานในวันนี้"
        maxWidth={400}
        footer={<button type="button" className="btn btn-md btn-secondary" onClick={() => setDayModal(null)}>ปิด</button>}
      >
        {dayModal && (
          dayModal.events.length === 0 ? (
            <p className="text-sm text-muted">ไม่มีงานในวันนี้</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {dayModal.events.map((ev, i) => {
                const meta = statusMeta(ev.status);
                return (
                  <button
                    type="button"
                    key={i}
                    className="job-item"
                    style={{ width: "100%", textAlign: "left", cursor: "pointer" }}
                    onClick={() => { setDayModal(null); setSelectedEvent(ev); }}
                  >
                    <div className="job-item-top">
                      <div className="job-item-title">{ev.title}</div>
                      <span className={`badge ${meta.cls}`}>{meta.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )
        )}
      </Modal>
    </div>
  );
}
