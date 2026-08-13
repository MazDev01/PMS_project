import * as React from "react";
import Link from "next/link";
import { ShieldCheck, Clock, CheckCircle2, Lock } from "lucide-react";
import { formatThaiDate } from "@/lib/utils";

export function GuestShell({
  title,
  code,
  expiresAt,
  children,
}: {
  title: string;
  code: string;
  expiresAt?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/40">
      {/* Brand header */}
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-2xl items-center gap-2.5 px-5 py-4">
          <div className="grid size-8 place-items-center rounded-lg bg-primary-foreground text-primary text-base font-bold leading-none">
            M
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold">MACCA Light Engineering</div>
            <div className="text-[0.7rem] text-primary-foreground/80">
              เอกสารสำหรับลูกค้า · {code}
            </div>
          </div>
          <span className="ml-auto flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2.5 py-1 text-[0.68rem]">
            <ShieldCheck className="size-3.5" />
            ลิงก์ปลอดภัย
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold">{title}</h1>
          {expiresAt && (
            <span className="flex items-center gap-1 text-[0.75rem] text-muted-foreground">
              <Clock className="size-3.5" />
              ลิงก์หมดอายุ {formatThaiDate(expiresAt)}
            </span>
          )}
        </div>
        {children}
      </main>

      <footer className="py-6 text-center text-[0.72rem] text-muted-foreground">
        © 2569 MACCA Light Engineering Co., Ltd.
      </footer>
    </div>
  );
}

/** Post-action lock state — matches the "Action Lock" core function. */
export function ActionLock({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-success/40 bg-success/8 p-6 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-success/15 text-success-foreground">
        <CheckCircle2 className="size-8" />
      </div>
      <h2 className="mt-3 text-lg font-bold text-success-foreground">
        {message}
      </h2>
      <p className="mt-1 flex items-center justify-center gap-1.5 text-[0.8rem] text-muted-foreground">
        <Lock className="size-3.5" />
        ลิงก์นี้ถูกล็อกอัตโนมัติเพื่อป้องกันการทำรายการซ้ำ
      </p>
      <p className="mt-1 text-[0.72rem] text-muted-foreground">
        บันทึกเวลา 3 ก.ค. 2569 14:32 น. · IP 203.0.113.24
      </p>
    </div>
  );
}

export function GuestInvalid() {
  return (
    <div className="grid min-h-screen place-items-center bg-muted/40 p-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
          <Lock className="size-7" />
        </div>
        <h1 className="mt-3 text-lg font-bold">ลิงก์ไม่ถูกต้องหรือหมดอายุ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          กรุณาติดต่อผู้ประสานงานเพื่อขอลิงก์ใหม่
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          ← กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
