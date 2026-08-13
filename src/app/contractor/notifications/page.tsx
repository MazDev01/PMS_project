import Link from "next/link";
import {
  ClipboardCheck,
  CalendarCheck,
  PenLine,
  MessageSquare,
  Bell,
} from "lucide-react";
import {
  PhoneFrame,
  BottomNav,
  WhiteCard,
  CHeader,
} from "@/components/contractor/kit";

type Noti = {
  icon: typeof Bell;
  title: string;
  detail: string;
  time: string;
  unread: boolean;
};

const TODAY: Noti[] = [
  {
    icon: ClipboardCheck,
    title: "งานเข้าใหม่",
    detail: "JOB-2569-0150 · แจ้งซ่อมแอร์ห้อง A-1204 (ในประกัน)",
    time: "08:15 น.",
    unread: true,
  },
  {
    icon: CalendarCheck,
    title: "แผนงานได้รับการยืนยัน",
    detail: "ลูกค้ายืนยันวันนัด JOB-2569-0147 · 3 ก.ค. 09:00 น.",
    time: "08:02 น.",
    unread: true,
  },
];

const EARLIER: Noti[] = [
  {
    icon: PenLine,
    title: "ลูกค้าเซ็นรับมอบงานแล้ว",
    detail: "JOB-2569-0143 · เดินระบบไฟฟ้าห้อง 502",
    time: "เมื่อวานนี้",
    unread: false,
  },
  {
    icon: MessageSquare,
    title: "ข้อความจากผู้ประสานงาน",
    detail: "รบกวนถ่ายรูปตู้ควบคุมเพิ่มก่อนส่งมอบด้วยนะครับ",
    time: "เมื่อวานนี้",
    unread: false,
  },
  {
    icon: CalendarCheck,
    title: "ล็อคคิวงานเรียบร้อย",
    detail: "JOB-2569-0148 · ติดตั้งแอร์ 4 เครื่อง · 11 ก.ค.",
    time: "2 วันก่อน",
    unread: false,
  },
];

function Item({ n }: { n: Noti }) {
  const Icon = n.icon;
  return (
    <WhiteCard className="flex gap-3 p-4">
      <div className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-[color:var(--ct-purple-soft)] text-[color:var(--ct-purple)]">
        <Icon className="size-5" />
        {n.unread && (
          <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-white bg-[color:var(--ct-purple)]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-neutral-800">
            {n.title}
          </span>
          <span className="shrink-0 text-[0.7rem] text-neutral-400">
            {n.time}
          </span>
        </div>
        <p className="mt-0.5 text-[0.8rem] leading-snug text-neutral-500">
          {n.detail}
        </p>
      </div>
    </WhiteCard>
  );
}

export default function ContractorNotifications() {
  return (
    <PhoneFrame withNav>
      <CHeader
        title="การแจ้งเตือน"
        subtitle="งานใหม่ · การยืนยัน · ข้อความ"
        back="/contractor/profile"
      />

      <div className="px-5 pb-2 pt-3">
        <h2 className="text-[0.8rem] font-semibold uppercase tracking-wide text-white/70">
          วันนี้
        </h2>
      </div>
      <div className="space-y-3 px-5">
        {TODAY.map((n, i) => (
          <Item key={i} n={n} />
        ))}
      </div>

      <div className="px-5 pb-2 pt-6">
        <h2 className="text-[0.8rem] font-semibold uppercase tracking-wide text-white/70">
          ก่อนหน้านี้
        </h2>
      </div>
      <div className="space-y-3 px-5">
        {EARLIER.map((n, i) => (
          <Item key={i} n={n} />
        ))}
      </div>

      <Link
        href="/contractor"
        className="block py-6 text-center text-[0.85rem] font-medium text-white/85"
      >
        ← กลับหน้าหลัก
      </Link>

      <BottomNav />
    </PhoneFrame>
  );
}
