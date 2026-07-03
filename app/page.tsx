import Link from "next/link";
import {
  ClipboardList,
  CalendarDays,
  Link2,
  ShieldCheck,
  RefreshCw,
  PenLine,
  ArrowRight,
  FileSignature,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MODULES = [
  {
    icon: ClipboardList,
    title: "Coordinator",
    desc: "เปิดงาน รวมศูนย์ข้อมูล ทำใบเสนอราคา และซิงค์กับ Mango",
  },
  {
    icon: CalendarDays,
    title: "Job Scheduling",
    desc: "เช็คคิวช่าง/ผู้รับเหมา วางแผนงาน และยืนยันวันกับลูกค้า",
  },
  {
    icon: Link2,
    title: "Guest & E-Signature",
    desc: "สร้างลิงก์ชั่วคราวให้ลูกค้าตรวจเอกสารและเซ็นออนไลน์",
  },
  {
    icon: RefreshCw,
    title: "Mango Integration",
    desc: "ซิงค์ข้อมูล 2 ทิศทางผ่าน REST API + Webhook สถานะการเงิน",
  },
  {
    icon: ShieldCheck,
    title: "Warranty & Maintenance",
    desc: "คำนวณระยะประกันอัตโนมัติ และเปิดเคสแจ้งซ่อมหลังจบงาน",
  },
  {
    icon: PenLine,
    title: "Job Closing",
    desc: "รวมเอกสารปิดงาน บันทึกยอดชำระ และปิดงานเข้า Mango",
  },
];

const GUEST_DEMOS = [
  {
    href: "/g/quotation/qt0148",
    label: "อนุมัติใบเสนอราคา",
    icon: FileSignature,
  },
  {
    href: "/g/confirm/pl0147",
    label: "ยืนยันวันนัดหมาย",
    icon: CalendarCheck,
  },
  { href: "/g/signoff/dn0143", label: "เซ็นรับมอบงาน", icon: PenLine },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground text-lg font-bold leading-none">
            M
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold">MACCA PMS</div>
            <div className="text-[0.7rem] text-muted-foreground">
              MACCA Light Engineering
            </div>
          </div>
        </div>
        <Button asChild size="lg">
          <Link href="/login">เข้าสู่ระบบ</Link>
        </Button>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-8 pt-10">
        <Badge tone="ghost" className="mb-4">
          Project Management System · v2.1
        </Badge>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl">
          ระบบบริหารงานบริการ
          <br />
          <span className="text-primary">แบบครบวงจร</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          ติดตามงานหนึ่งงานตั้งแต่ลูกค้าแจ้งความต้องการ จนปิดงานและหมดระยะรับประกัน
          ให้ทุกฝ่าย — รับงาน / จัดคิว / หน้างาน / บัญชี — เห็นข้อมูลร่วมกัน
          และเชื่อมเข้าสู่ Mango ERP โดยอัตโนมัติ
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/dashboard">
              Dashboard ผู้ประสานงาน
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/admin">Admin Console</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/contractor/login">แอปทีมช่าง (มือถือ)</Link>
          </Button>
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="grid size-10 place-items-center rounded-lg bg-accent text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-3 font-semibold">{m.title}</h3>
                <p className="mt-1 text-[0.85rem] text-muted-foreground">
                  {m.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Guest demo */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-xl border border-dashed border-primary/40 bg-brand-50/60 p-6">
          <h2 className="text-lg font-bold">
            ทดลองมุมมองลูกค้า (Guest Access)
          </h2>
          <p className="mt-1 text-[0.85rem] text-muted-foreground">
            ลิงก์ชั่วคราวที่ลูกค้าเปิดผ่านมือถือได้ทันทีโดยไม่ต้องล็อกอิน
            — ตรวจเอกสารและเซ็นชื่อดิจิทัลเพื่ออนุมัติ
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {GUEST_DEMOS.map((g) => {
              const Icon = g.icon;
              return (
                <Link
                  key={g.href}
                  href={g.href}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:border-primary hover:bg-accent"
                >
                  <Icon className="size-4 text-primary" />
                  {g.label}
                  <ArrowRight className="ml-auto size-4 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-[0.8rem] text-muted-foreground">
        © 2569 MACCA Light Engineering Co., Ltd. — Prototype
      </footer>
    </div>
  );
}
