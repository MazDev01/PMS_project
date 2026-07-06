"use client";

import { useState } from "react";
import Link from "next/link";
import Modal from "@/app/components/Modal";
import DataTable from "@/app/components/DataTable";
import MonthCalendar from "@/app/components/MonthCalendar";
import ViewOnlyBanner from "@/app/components/ViewOnlyBanner";
import { IconPlus, IconLock, IconCheck, IconUsers, IconClock } from "@/app/components/icons";
import { useTableRows, TableToolbar } from "@/app/components/TableControls";
import { TODAY_ISO } from "@/app/lib/mockData";
import { useJobs, useTeams, useScheduleEvents, useStore } from "@/app/lib/store";
import { useAuth } from "@/app/lib/auth";
import { formatDateTH } from "@/app/lib/format";

function scheduleStatusLabel(status) {
  return { pending: "รอการยืนยัน", confirmed: "ยืนยันแล้ว", done: "เสร็จสิ้น" }[status] || status;
}
function scheduleStatusBadgeClass(status) {
  return { pending: "badge-warning", confirmed: "badge-info", done: "badge-success" }[status] || "badge-secondary";
}

export default function CoordinatorSchedulePage() {
  const [jobs] = useJobs();
  const [teams] = useTeams();
  const [events, setEvents] = useScheduleEvents();
  const { addAuditLog, addNotification } = useStore();
  const { session } = useAuth();
  const actor = session?.name || "นภัสสร ใจดี";
  const actorRole = session?.role || "coordinator";
  const viewOnly = session?.role !== "coordinator";
  const [teamFilter, setTeamFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [materialsReady, setMaterialsReady] = useState(false);
  const [allDay, setAllDay] = useState(false);
  const [planStart, setPlanStart] = useState("08:30");
  const [planEnd, setPlanEnd] = useState("16:00");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dayModal, setDayModal] = useState(null);

  const rows = events.map((e, i) => ({ ...e, _viewId: `${e.date}_${e.jobId}_${i}` }));
  // Team filter drives both the calendar and the table below it — previously
  // the table ignored this filter entirely and always showed every team.
  const filteredEvents = teamFilter === "all" ? rows : rows.filter((e) => e.team === teamFilter);
  const { search, setSearch, sortBy, setSortBy, rows: tableRows, resultCount, isFiltered } = useTableRows(filteredEvents, {
    searchFields: (e) => [e.title, e.team, e.jobId],
    sortOptions: [
      { key: "date", label: "เรียงตามวันที่", compare: (a, b) => a.date.localeCompare(b.date) },
      { key: "team", label: "เรียงตามทีมช่าง", compare: (a, b) => a.team.localeCompare(b.team, "th") },
      { key: "status", label: "เรียงตามสถานะ", compare: (a, b) => a.status.localeCompare(b.status) },
    ],
  });

  function closeModal() {
    setModalOpen(false);
    setMaterialsReady(false);
    setAllDay(false);
    setPlanStart("08:30");
    setPlanEnd("16:00");
  }

  function toggleLock(jobId, date) {
    setEvents((prev) => prev.map((e) => (e.jobId === jobId && e.date === date ? { ...e, locked: !e.locked } : e)));
  }

  function handleCreatePlan(e) {
    e.preventDefault();
    const form = e.target;
    const job = jobs.find((j) => j.id === form.job.value);
    const team = teams.find((t) => t.id === form.team.value);
    const date = form.date.value || TODAY_ISO;
    const time = allDay ? "ทั้งวัน" : `${planStart} - ${planEnd}`;
    const jobLabel = job ? `${job.jobType.split(" (")[0]} - ${job.customer}` : "งานใหม่";

    const newEvent = {
      date,
      jobId: job?.id || form.job.value,
      title: time ? `${jobLabel} (${time})` : jobLabel,
      team: team?.name || teams[0].name,
      status: materialsReady ? "confirmed" : "pending",
    };
    setEvents((prev) => [newEvent, ...prev]);
    addAuditLog({ actor, role: actorRole, action: "วางแผนงานใหม่", target: newEvent.jobId });
    addNotification({ audience: "contractor", title: "แผนงานใหม่ถูกจัดคิว", detail: `${newEvent.jobId} — ${formatDateTH(date)}${time ? ` · ${time}` : ""}` });
    closeModal();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>จัดทำแผนงาน</h2>
          <p>เช็คคิวทีมช่างและวางแผนงานผ่านปฏิทินรายเดือน</p>
        </div>
        <div className="page-actions">
          <select
            className="ds-select"
            style={{ maxWidth: 220 }}
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            <option value="all">ทั้งหมด</option>
            {teams.map((t) => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
          {!viewOnly && (
            <button type="button" className="btn btn-md btn-default" onClick={() => setModalOpen(true)}>
              <IconPlus size={16} />
              วางแผนงานใหม่
            </button>
          )}
        </div>
      </div>

      {viewOnly && <ViewOnlyBanner />}

      <div className="section-block">
        <h3>ปฏิทินงานของทีมช่าง</h3>
        <div className="ds-card">
          <div className="ds-card-content">
            <MonthCalendar
              year={2026}
              month={6}
              events={filteredEvents}
              onEventClick={setSelectedEvent}
              onDayClick={(date, events) => setDayModal({ date, events })}
            />
          </div>
        </div>
      </div>

      <div className="section-block">
        <h3>ตารางงานที่รอการยืนยัน / ยืนยันแล้ว</h3>
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="ค้นหา งาน / ทีมช่าง / เลขที่งาน"
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOptions={[
            { key: "date", label: "เรียงตามวันที่" },
            { key: "team", label: "เรียงตามทีมช่าง" },
            { key: "status", label: "เรียงตามสถานะ" },
          ]}
        />
        {isFiltered && <p className="text-xs text-muted" style={{ marginTop: "-0.4rem", marginBottom: "0.75rem" }}>แสดง {resultCount} รายการ</p>}
        <DataTable
          columns={[
            { key: "date", label: "วันที่", render: (r) => formatDateTH(r.date) },
            { key: "title", label: "งาน" },
            { key: "team", label: "ทีมช่าง" },
            {
              key: "status",
              label: "สถานะ",
              render: (r) => <span className={`badge ${scheduleStatusBadgeClass(r.status)}`}>{scheduleStatusLabel(r.status)}</span>,
            },
            {
              key: "lock",
              label: "",
              render: (r) => (
                <button
                  type="button"
                  className={`btn btn-icon ${r.locked ? "btn-default" : "btn-ghost"}`}
                  title={viewOnly ? "ดูอย่างเดียว" : "ล็อคคิวงานของทีมรับเหมา"}
                  disabled={viewOnly}
                  onClick={() => toggleLock(r.jobId, r.date)}
                >
                  <IconLock size={15} />
                </button>
              ),
            },
          ]}
          rows={tableRows}
          keyField="_viewId"
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="วางแผนงานใหม่"
        description="เลือกงาน ทีมช่าง และวันเวลาที่ต้องการวางคิว"
        footer={
          <>
            <button type="button" className="btn btn-md btn-secondary" onClick={closeModal}>ยกเลิก</button>
            <button type="submit" form="plan-form" className="btn btn-md btn-default">บันทึกแผนงาน</button>
          </>
        }
      >
        <form id="plan-form" onSubmit={handleCreatePlan}>
          <div className="form-group">
            <label className="ds-label">เลือกงาน</label>
            <select className="ds-select" name="job" defaultValue={jobs[0].id}>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.id} — {j.customer}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="ds-label">ทีมช่าง</label>
            <select className="ds-select" name="team" defaultValue={teams[0].id}>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="ds-label">วันที่</label>
            <input className="ds-input" type="date" name="date" defaultValue={TODAY_ISO} />
          </div>
          <div className="form-group">
            <div className="flex-between">
              <label className="ds-label">เวลา</label>
              <button
                type="button"
                className={`btn btn-sm ${allDay ? "btn-default" : "btn-outline"} flex-row`}
                onClick={() => setAllDay((v) => !v)}
              >
                {allDay && <IconCheck size={13} />}
                ทั้งวัน
              </button>
            </div>
            {allDay ? (
              <div className="ds-input flex-row text-muted" style={{ gap: "0.4rem", alignItems: "center", background: "var(--muted)" }}>
                <IconClock size={14} /> ทำงานทั้งวัน (ไม่ระบุช่วงเวลา)
              </div>
            ) : (
              <div className="flex-row" style={{ gap: "0.4rem" }}>
                <input className="ds-input" type="time" value={planStart} onChange={(e) => setPlanStart(e.target.value)} />
                <span className="text-muted">–</span>
                <input className="ds-input" type="time" value={planEnd} onChange={(e) => setPlanEnd(e.target.value)} />
              </div>
            )}
          </div>
          <div className="ds-checkbox-wrap" onClick={() => setMaterialsReady((v) => !v)}>
            <div className={`ds-checkbox ${materialsReady ? "checked" : ""}`}>
              {materialsReady && <IconCheck size={10} />}
            </div>
            <span>ตรวจสอบว่าวัสดุพร้อมสำหรับงานนี้แล้ว</span>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title}
        description={selectedEvent ? formatDateTH(selectedEvent.date) : ""}
        maxWidth={420}
        footer={
          <>
            <button type="button" className="btn btn-md btn-secondary" onClick={() => setSelectedEvent(null)}>ปิด</button>
            {selectedEvent?.jobId && (
              <Link href={`/coordinator/jobs/${selectedEvent.jobId}`} className="btn btn-md btn-default">
                ดูรายละเอียดงานเต็ม
              </Link>
            )}
          </>
        }
      >
        {selectedEvent && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
            <div className="doc-row">
              <span className="lbl">เลขที่งาน</span>
              <span>{selectedEvent.jobId}</span>
            </div>
            <div className="doc-row">
              <span className="lbl">ทีมช่างที่รับผิดชอบ</span>
              <span className="flex-row"><IconUsers size={14} />{selectedEvent.team}</span>
            </div>
            <div className="doc-row">
              <span className="lbl">สถานะ</span>
              <span className={`badge ${scheduleStatusBadgeClass(selectedEvent.status)}`}>{scheduleStatusLabel(selectedEvent.status)}</span>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!dayModal}
        onClose={() => setDayModal(null)}
        title={dayModal ? formatDateTH(dayModal.date) : ""}
        description="งานในวันนี้"
        maxWidth={440}
        footer={<button type="button" className="btn btn-md btn-secondary" onClick={() => setDayModal(null)}>ปิด</button>}
      >
        {dayModal && (
          dayModal.events.length === 0 ? (
            <p className="text-sm text-muted">ไม่มีงานในวันนี้</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
              {dayModal.events.map((ev, i) => {
                const inner = (
                  <>
                    <span style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      <span className="text-sm" style={{ fontWeight: 600 }}>{ev.title}</span>
                      <span className="text-xs text-muted flex-row"><IconUsers size={13} />{ev.team}</span>
                    </span>
                    <span className={`badge ${scheduleStatusBadgeClass(ev.status)}`}>{scheduleStatusLabel(ev.status)}</span>
                  </>
                );
                return ev.jobId ? (
                  <Link
                    key={i}
                    href={`/coordinator/jobs/${ev.jobId}`}
                    className="list-row"
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}
                    onClick={() => setDayModal(null)}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div
                    key={i}
                    className="list-row"
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}
                  >
                    {inner}
                  </div>
                );
              })}
            </div>
          )
        )}
      </Modal>
    </div>
  );
}
