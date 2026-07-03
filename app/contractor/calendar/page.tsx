"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import {
  PhoneFrame,
  BottomNav,
  WhiteCard,
  GlassCard,
  CHeader,
} from "@/components/contractor/kit";
import { getMyJobs, TODAY } from "@/lib/contractor";
import { formatThaiDate, cn } from "@/lib/utils";

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const YEAR = 2026;
const MONTH = 6; // July (0-indexed)
const TODAY_DAY = Number(TODAY.slice(8, 10));

const DOT: Record<string, string> = {
  today: "bg-white",
  progress: "bg-amber-300",
  wait: "bg-white/50",
  done: "bg-emerald-300",
};

export default function ContractorCalendar() {
  const my = getMyJobs();
  // map day-of-month → tone (July only)
  const byDay = new Map<number, string>();
  for (const m of my) {
    const [y, mo, d] = m.entry.date.split("-").map(Number);
    if (y === YEAR && mo - 1 === MONTH) byDay.set(d, m.tone);
  }

  const firstWeekday = new Date(YEAR, MONTH, 1).getDay();
  const daysInMonth = new Date(YEAR, MONTH + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const agenda = my
    .filter((m) => m.bucket !== "done")
    .sort((a, b) => a.entry.date.localeCompare(b.entry.date));

  return (
    <PhoneFrame withNav>
      <CHeader title="ปฏิทินงาน" subtitle="กรกฎาคม 2569" />

      {/* Month grid */}
      <div className="px-5 pt-2">
        <GlassCard className="p-4">
          <div className="grid grid-cols-7 gap-1 text-center text-[0.7rem] text-white/70">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1 font-medium">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />;
              const tone = byDay.get(day);
              const isToday = day === TODAY_DAY;
              return (
                <div
                  key={i}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm",
                    isToday
                      ? "bg-white font-bold text-[color:var(--ct-purple)]"
                      : "text-white/90",
                  )}
                >
                  {day}
                  {tone && (
                    <span
                      className={cn(
                        "absolute bottom-1 size-1.5 rounded-full",
                        isToday ? "bg-[color:var(--ct-purple)]" : DOT[tone],
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/20 pt-3 text-[0.7rem] text-white/80">
            <Legend className="bg-white" label="วันนี้" />
            <Legend className="bg-amber-300" label="กำลังทำ" />
            <Legend className="bg-emerald-300" label="เสร็จแล้ว" />
          </div>
        </GlassCard>
      </div>

      {/* Agenda */}
      <div className="px-5 pb-2 pt-6">
        <h2 className="text-lg font-bold text-white">งานที่กำลังจะถึง</h2>
      </div>
      <div className="space-y-3 px-5">
        {agenda.map((m) => (
          <Link key={m.entry.id} href={`/contractor/jobs/${m.job.id}`}>
            <WhiteCard className="flex items-center gap-3 p-4">
              <div className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-[color:var(--ct-purple-soft)] py-1.5 text-[color:var(--ct-purple)]">
                <span className="text-[0.65rem]">
                  {formatThaiDate(m.entry.date, { month: "short" })}
                </span>
                <span className="text-lg font-bold leading-none">
                  {Number(m.entry.date.slice(8, 10))}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-neutral-800">
                  {m.job.title}
                </p>
                <div className="mt-0.5 flex items-center gap-1 text-[0.75rem] text-neutral-500">
                  <MapPin className="size-3.5" />
                  {m.customer?.contactName} · {m.entry.start} น.
                </div>
              </div>
              <ChevronRight className="size-5 shrink-0 text-neutral-300" />
            </WhiteCard>
          </Link>
        ))}
      </div>

      <BottomNav />
    </PhoneFrame>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", className)} />
      {label}
    </span>
  );
}
