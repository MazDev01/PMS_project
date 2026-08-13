import Link from "next/link";
import {
  Phone,
  Wrench,
  History,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Star,
} from "lucide-react";
import {
  PhoneFrame,
  BottomNav,
  WhiteCard,
  GlassCard,
} from "@/components/contractor/kit";
import { getContractor } from "@/lib/data";
import { getMyJobs, CURRENT_CONTRACTOR_ID } from "@/lib/contractor";

const MENU: { icon: typeof History; label: string; href?: string }[] = [
  { icon: History, label: "ประวัติงานที่ทำ", href: "/contractor/jobs" },
  { icon: Bell, label: "การแจ้งเตือน", href: "/contractor/notifications" },
  { icon: Settings, label: "ตั้งค่าบัญชี" },
  { icon: HelpCircle, label: "ช่วยเหลือ / ติดต่อผู้ประสาน" },
];

export default function ContractorProfile() {
  const me = getContractor(CURRENT_CONTRACTOR_ID)!;
  const my = getMyJobs();
  const done = my.filter((m) => m.bucket === "done").length;
  const total = my.length;

  return (
    <PhoneFrame withNav>
      {/* Profile head */}
      <div className="px-5 pb-2 pt-8 text-center text-white">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-white text-2xl font-bold text-[color:var(--ct-purple)] shadow-lg">
          ช
        </div>
        <h1 className="mt-3 text-xl font-bold">{me.name}</h1>
        <p className="mt-0.5 flex items-center justify-center gap-1.5 text-sm text-white/80">
          <Wrench className="size-3.5" />
          {me.skill}
        </p>
        <p className="mt-0.5 flex items-center justify-center gap-1.5 text-[0.8rem] text-white/70">
          <Phone className="size-3.5" />
          {me.phone}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-5 pt-4">
        <GlassCard className="p-3 text-center">
          <div className="text-2xl font-bold leading-none">{total}</div>
          <div className="mt-1 text-[0.7rem] text-white/80">งานทั้งหมด</div>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <div className="text-2xl font-bold leading-none">{done}</div>
          <div className="mt-1 text-[0.7rem] text-white/80">เสร็จแล้ว</div>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <div className="flex items-center justify-center gap-0.5 text-2xl font-bold leading-none">
            4.9
            <Star className="size-4 fill-amber-300 text-amber-300" />
          </div>
          <div className="mt-1 text-[0.7rem] text-white/80">คะแนน</div>
        </GlassCard>
      </div>

      {/* Menu */}
      <div className="px-5 pt-5">
        <WhiteCard className="divide-y divide-neutral-100 overflow-hidden">
          {MENU.map((m) => {
            const Icon = m.icon;
            const inner = (
              <>
                <span className="grid size-9 place-items-center rounded-xl bg-[color:var(--ct-purple-soft)] text-[color:var(--ct-purple)]">
                  <Icon className="size-4.5" />
                </span>
                <span className="flex-1 text-[0.9rem] font-medium text-neutral-700">
                  {m.label}
                </span>
                <ChevronRight className="size-5 text-neutral-300" />
              </>
            );
            const cls =
              "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-neutral-50";
            return m.href ? (
              <Link key={m.label} href={m.href} className={cls}>
                {inner}
              </Link>
            ) : (
              <button key={m.label} className={cls}>
                {inner}
              </button>
            );
          })}
        </WhiteCard>
      </div>

      {/* Logout */}
      <div className="px-5 pt-4">
        <Link
          href="/contractor/login"
          className="flex items-center justify-center gap-2 rounded-2xl bg-white/15 py-3 text-[0.9rem] font-semibold text-white ct-glass"
        >
          <LogOut className="size-4.5" />
          ออกจากระบบ
        </Link>
      </div>

      <p className="px-5 pt-4 text-center text-[0.72rem] text-white/60">
        MACCA Service · เวอร์ชัน 2.1.0
      </p>

      <BottomNav />
    </PhoneFrame>
  );
}
