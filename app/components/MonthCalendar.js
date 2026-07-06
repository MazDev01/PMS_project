"use client";

import { useState } from "react";
import { THAI_MONTHS_FULL, THAI_DOW } from "@/app/lib/format";
import { TODAY_ISO } from "@/app/lib/mockData";
import { IconChevronLeft, IconChevronRight } from "./icons";

function pad(n) {
  return String(n).padStart(2, "0");
}

export default function MonthCalendar({ year, month, events = [], onEventClick, onDayClick, size = "sm" }) {
  const [cursor, setCursor] = useState({ year, month });
  const maxPerCell = size === "lg" ? 4 : 2;

  const eventsByDate = {};
  events.forEach((e) => {
    (eventsByDate[e.date] = eventsByDate[e.date] || []).push(e);
  });

  const firstOfMonth = new Date(cursor.year, cursor.month, 1);
  const startDow = firstOfMonth.getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const daysInPrevMonth = new Date(cursor.year, cursor.month, 0).getDate();

  const cells = [];
  for (let i = 0; i < startDow; i++) {
    cells.push({ day: daysInPrevMonth - startDow + 1 + i, outside: true, dateStr: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, outside: false, dateStr: `${cursor.year}-${pad(cursor.month + 1)}-${pad(d)}` });
  }
  const remainder = cells.length % 7;
  const trailing = remainder === 0 ? 0 : 7 - remainder;
  for (let d = 1; d <= trailing; d++) {
    cells.push({ day: d, outside: true, dateStr: null });
  }

  function prevMonth() {
    setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }));
  }
  function nextMonth() {
    setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }));
  }

  return (
    <div>
      <div className="cal-header">
        <h3>
          {THAI_MONTHS_FULL[cursor.month]} {cursor.year + 543}
        </h3>
        <div className="flex-row">
          <button className="app-icon-btn" onClick={prevMonth} aria-label="เดือนก่อนหน้า">
            <IconChevronLeft size={15} />
          </button>
          <button className="app-icon-btn" onClick={nextMonth} aria-label="เดือนถัดไป">
            <IconChevronRight size={15} />
          </button>
        </div>
      </div>
      <div className={`cal-grid ${size === "lg" ? "lg" : ""}`}>
        {THAI_DOW.map((d) => (
          <div className="cal-dow" key={d}>
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          const dayEvents = cell.dateStr ? eventsByDate[cell.dateStr] || [] : [];
          const isToday = cell.dateStr === TODAY_ISO;
          const clickable = onDayClick && !cell.outside;
          return (
            <div
              className={`cal-cell ${cell.outside ? "outside" : ""} ${isToday ? "today" : ""}`}
              key={i}
              style={clickable ? { cursor: "pointer" } : undefined}
              onClick={clickable ? () => onDayClick(cell.dateStr, eventsByDate[cell.dateStr] || []) : undefined}
            >
              <div className="cal-daynum">{cell.day}</div>
              {dayEvents.slice(0, maxPerCell).map((ev, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`cal-event ${ev.status === "done" ? "green" : ev.status === "confirmed" ? "yellow" : "gray"}`}
                  title={ev.title}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick && onEventClick(ev);
                  }}
                >
                  {ev.title}
                </button>
              ))}
              {dayEvents.length > maxPerCell && <div className="text-xs text-muted">+{dayEvents.length - maxPerCell} งาน</div>}
            </div>
          );
        })}
      </div>
      <div className="cal-legend">
        <span>
          <span className="dot" style={{ background: "oklch(0.7 0 0)" }} />
          เทา: รอการยืนยัน
        </span>
        <span>
          <span className="dot" style={{ background: "oklch(0.65 0.16 60)" }} />
          เหลือง: ยืนยันตารางเวลาแล้ว
        </span>
        <span>
          <span className="dot" style={{ background: "oklch(0.6 0.18 145)" }} />
          เขียว: เข้าไปทำเสร็จและปิดงานเรียบร้อยแล้ว
        </span>
      </div>
    </div>
  );
}
