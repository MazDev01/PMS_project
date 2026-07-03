import Link from "next/link";
import {
  MapPin,
  ChevronRight,
  CalendarClock,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from "lucide-react";
import {
  PhoneFrame,
  BottomNav,
  GlassCard,
  WhiteCard,
} from "@/components/contractor/kit";
import { getMyJobs, CURRENT_CONTRACTOR_NAME } from "@/lib/contractor";
import { formatThaiDate } from "@/lib/utils";

export default function ContractorHome() {
  const myJobs = getMyJobs();
  const today = myJobs.filter((m) => m.bucket === "today");
  const doneCount = myJobs.filter((m) => m.bucket === "done").length;
  const progressCount = myJobs.filter((m) => m.tone === "progress").length;
  const next = today[0];

  return (
    <PhoneFrame withNav>
      {/* Greeting */}
      <header className="px-5 pb-2 pt-7 text-white">
        <p className="text-sm text-white/80">
          {formatThaiDate("2026-07-03", { weekday: "long" })} · วันนี้
        </p>
        <div className="mt-1 flex items-center justify-between">
          <h1 className="text-2xl font-bold">สวัสดี, {CURRENT_CONTRACTOR_NAME}</h1>
          <div className="grid size-11 place-items-center rounded-full bg-white/90 text-lg font-bold text-[color:var(--ct-purple)]">
            ช
          </div>
        </div>
      </header>

      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-3 px-5 pt-3">
        <GlassCard className="p-3">
          <CalendarClock className="size-5 text-white/90" />
          <div className="mt-2 text-2xl font-bold leading-none">
            {today.length}
          </div>
          <div className="mt-1 text-[0.7rem] text-white/80">งานวันนี้</div>
        </GlassCard>
        <GlassCard className="p-3">
          <Loader2 className="size-5 text-white/90" />
          <div className="mt-2 text-2xl font-bold leading-none">
            {progressCount}
          </div>
          <div className="mt-1 text-[0.7rem] text-white/80">กำลังทำ</div>
        </GlassCard>
        <GlassCard className="p-3">
          <CheckCircle2 className="size-5 text-white/90" />
          <div className="mt-2 text-2xl font-bold leading-none">
            {doneCount}
          </div>
          <div className="mt-1 text-[0.7rem] text-white/80">เสร็จแล้ว</div>
        </GlassCard>
      </div>

      {/* Next job CTA */}
      {next && (
        <div className="px-5 pt-4">
          <Link href={`/contractor/jobs/${next.job.id}`}>
            <GlassCard className="ct-glass-strong flex items-center gap-3 p-4">
              <div className="grid size-11 place-items-center rounded-xl bg-white/25">
                <CalendarClock className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[0.72rem] text-white/80">คิวถัดไป</div>
                <div className="truncate text-sm font-semibold">
                  {next.entry.start} · {next.job.jobType}
                </div>
              </div>
              <ArrowRight className="size-5" />
            </GlassCard>
          </Link>
        </div>
      )}

      {/* Today's jobs */}
      <div className="flex items-center justify-between px-5 pb-2 pt-6 text-white">
        <h2 className="text-lg font-bold">งานวันนี้</h2>
        <Link href="/contractor/jobs" className="text-[0.8rem] text-white/85">
          ดูทั้งหมด
        </Link>
      </div>

      <div className="space-y-3 px-5">
        {today.length === 0 && (
          <WhiteCard className="p-6 text-center text-sm text-neutral-500">
            วันนี้ไม่มีงานที่ต้องเข้าทำ 🎉
          </WhiteCard>
        )}
        {today.map((m) => (
          <Link key={m.entry.id} href={`/contractor/jobs/${m.job.id}`}>
            <WhiteCard className="flex gap-3 p-4">
              <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-[color:var(--ct-purple-soft)] py-2 text-[color:var(--ct-purple)]">
                <span className="text-sm font-bold leading-none">
                  {m.entry.start}
                </span>
                <span className="mt-1 text-[0.65rem] text-neutral-500">
                  {m.entry.end}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="line-clamp-2 text-sm font-semibold text-neutral-800">
                    {m.job.title}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[0.75rem] text-neutral-500">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">{m.customer?.room ?? "หน้างาน"}</span>
                </div>
                <span
                  className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold ${
                    m.tone === "progress"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-[color:var(--ct-purple-soft)] text-[color:var(--ct-purple)]"
                  }`}
                >
                  {m.label}
                </span>
              </div>
              <ChevronRight className="size-5 shrink-0 self-center text-neutral-300" />
            </WhiteCard>
          </Link>
        ))}
      </div>

      <BottomNav />
    </PhoneFrame>
  );
}
