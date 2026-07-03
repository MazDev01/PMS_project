"use client";

import * as React from "react";
import Link from "next/link";
import { MapPin, ChevronRight, CalendarClock } from "lucide-react";
import {
  PhoneFrame,
  BottomNav,
  WhiteCard,
  CHeader,
} from "@/components/contractor/kit";
import { getMyJobs, type CtBucket } from "@/lib/contractor";
import { formatThaiDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TABS: { value: CtBucket; label: string }[] = [
  { value: "today", label: "วันนี้" },
  { value: "upcoming", label: "กำลังจะถึง" },
  { value: "done", label: "เสร็จแล้ว" },
];

const PILL: Record<string, string> = {
  today: "bg-[color:var(--ct-purple-soft)] text-[color:var(--ct-purple)]",
  progress: "bg-amber-100 text-amber-700",
  wait: "bg-neutral-100 text-neutral-500",
  done: "bg-emerald-100 text-emerald-700",
};

export default function ContractorJobsPage() {
  const [tab, setTab] = React.useState<CtBucket>("today");
  const all = getMyJobs();
  const list = all.filter((m) => m.bucket === tab);

  return (
    <PhoneFrame withNav>
      <CHeader title="งานของฉัน" subtitle="รายการงานที่ได้รับมอบหมาย" />

      {/* Segmented tabs */}
      <div className="px-5 pt-2">
        <div className="ct-glass flex rounded-2xl p-1">
          {TABS.map((t) => {
            const count = all.filter((m) => m.bucket === t.value).length;
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={cn(
                  "flex-1 rounded-xl py-2 text-[0.82rem] font-semibold transition-colors",
                  tab === t.value
                    ? "bg-white text-[color:var(--ct-purple)] shadow"
                    : "text-white/85",
                )}
              >
                {t.label}
                {count > 0 && (
                  <span
                    className={cn(
                      "ml-1.5 rounded-full px-1.5 text-[0.65rem]",
                      tab === t.value
                        ? "bg-[color:var(--ct-purple-soft)]"
                        : "bg-white/20",
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3 px-5 pt-4">
        {list.length === 0 && (
          <WhiteCard className="p-6 text-center text-sm text-neutral-500">
            ไม่มีงานในหมวดนี้
          </WhiteCard>
        )}
        {list.map((m) => (
          <Link key={m.entry.id} href={`/contractor/jobs/${m.job.id}`}>
            <WhiteCard className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[0.72rem] font-medium text-neutral-400">
                  {m.job.code}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold",
                    PILL[m.tone],
                  )}
                >
                  {m.label}
                </span>
              </div>
              <div className="mt-1 flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-neutral-800">
                  {m.job.title}
                </p>
                <ChevronRight className="mt-0.5 size-5 shrink-0 text-neutral-300" />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.75rem] text-neutral-500">
                <span className="flex items-center gap-1">
                  <CalendarClock className="size-3.5" />
                  {formatThaiDate(m.entry.date, { day: "numeric", month: "short" })}
                  {" · "}
                  {m.entry.start}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {m.customer?.contactName}
                </span>
              </div>
            </WhiteCard>
          </Link>
        ))}
      </div>

      <BottomNav />
    </PhoneFrame>
  );
}
