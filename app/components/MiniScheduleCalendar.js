"use client";

import Link from "next/link";
import { THAI_DOW } from "@/app/lib/format";
import { IconCalendar, IconChevronRight } from "@/app/components/icons";

// Compact month view for the dashboard — marks days that have scheduled work
// and links straight through to the full Scheduling (จัดแผนงาน) page.
const YEAR = 2026;
const MONTH = 6; // July (0-indexed)
const TODAY_DAY = 3;

export default function MiniScheduleCalendar({ jobs = [] }) {
  const jobDays = new Set(
    jobs
      .filter((j) => (j.scheduledDate || "").slice(0, 7) === "2026-07")
      .map((j) => Number(j.scheduledDate.slice(8, 10))),
  );

  const firstDow = new Date(YEAR, MONTH, 1).getDay();
  const daysInMonth = new Date(YEAR, MONTH + 1, 0).getDate();
  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <Link
      href="/coordinator/schedule"
      className="ds-card mini-cal-link"
      style={{ display: "block", textDecoration: "none", color: "inherit" }}
    >
      <div className="ds-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="ds-card-title flex-row"><IconCalendar size={15} /> ปฏิทินงาน · กรกฎาคม 2569</div>
        <span className="text-xs flex-row" style={{ color: "var(--primary)", fontWeight: 600, gap: "0.1rem" }}>
          จัดแผนงาน <IconChevronRight size={13} />
        </span>
      </div>
      <div className="ds-card-content">
        <div className="mini-cal-grid">
          {THAI_DOW.map((d) => (
            <div className="mini-cal-dow" key={d}>{d}</div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const hasJob = jobDays.has(day);
            const isToday = day === TODAY_DAY;
            return (
              <div key={i} className={`mini-cal-cell${isToday ? " today" : ""}${hasJob ? " hasjob" : ""}`}>
                {day}
              </div>
            );
          })}
        </div>
        <div className="mini-cal-legend">
          <span><span className="mini-dot today" />วันนี้</span>
          <span><span className="mini-dot job" />มีงาน ({jobDays.size} วัน)</span>
        </div>
      </div>
    </Link>
  );
}
