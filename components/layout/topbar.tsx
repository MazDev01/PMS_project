"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu, Search, Bell, CheckCheck } from "lucide-react";
import { PAGE_TITLES } from "./nav-config";

const NOTIFICATIONS = [
  { text: "ลูกค้าเซ็นอนุมัติใบเสนอราคา QT-0147", time: "5 นาทีที่แล้ว", unread: true },
  { text: "Mango แจ้งกลับว่าได้รับเอกสารสั่งซื้อ PO-8842", time: "1 ชม.ที่แล้ว", unread: true },
  { text: "ผู้รับเหมาอัปโหลดใบส่งมอบงาน DN-0143", time: "3 ชม.ที่แล้ว", unread: true },
  { text: "ลูกค้ายืนยันวันนัดหมาย JOB-2569-0147", time: "เมื่อวานนี้", unread: false },
  { text: "ระบบซิงค์ข้อมูลไป Mango สำเร็จ", time: "เมื่อวานนี้", unread: false },
];

function titleFor(pathname: string) {
  const key = Object.keys(PAGE_TITLES).find((k) => pathname.startsWith(k));
  return key ? PAGE_TITLES[key] : "MACCA PMS";
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const [openBell, setOpenBell] = React.useState(false);
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur md:px-6">
      <button
        onClick={onMenuClick}
        className="grid size-9 place-items-center rounded-md text-foreground hover:bg-muted md:hidden cursor-pointer"
        aria-label="เมนู"
      >
        <Menu className="size-5" />
      </button>

      <h1 className="text-lg font-bold">{titleFor(pathname)}</h1>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="ค้นหางาน / ลูกค้า…"
            className="h-8 w-52 rounded-lg border border-input bg-transparent pl-8 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:border-ring focus:ring-[3px] focus:ring-ring/20"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setOpenBell((v) => !v)}
            className="relative grid size-9 place-items-center rounded-md text-foreground hover:bg-muted cursor-pointer"
            aria-label="การแจ้งเตือน"
          >
            <Bell className="size-5" />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-primary text-[0.6rem] font-bold text-primary-foreground">
                {unread}
              </span>
            )}
          </button>

          {openBell && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setOpenBell(false)}
              />
              <div className="absolute right-0 top-11 z-40 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <span className="text-sm font-semibold">การแจ้งเตือน</span>
                  <button className="flex items-center gap-1 text-[0.72rem] text-muted-foreground hover:text-primary cursor-pointer">
                    <CheckCheck className="size-3.5" />
                    อ่านทั้งหมด
                  </button>
                </div>
                <ul className="max-h-80 overflow-y-auto">
                  {NOTIFICATIONS.map((n, i) => (
                    <li
                      key={i}
                      className="flex gap-2.5 border-b border-border px-4 py-2.5 last:border-0 hover:bg-muted"
                    >
                      <span
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${
                          n.unread ? "bg-primary" : "bg-transparent"
                        }`}
                      />
                      <div className="leading-snug">
                        <p className="text-[0.82rem]">{n.text}</p>
                        <p className="text-[0.7rem] text-muted-foreground">
                          {n.time}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
