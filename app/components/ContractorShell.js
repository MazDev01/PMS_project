"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBell } from "./icons";
import { useAuth } from "@/app/lib/auth";
import { useNotifications } from "@/app/lib/store";

export default function ContractorShell({ tabs, children }) {
  const pathname = usePathname();
  const { session } = useAuth();
  const { notifications } = useNotifications();
  const unreadCount = notifications.filter((n) => (n.audience === "all" || n.audience === "contractor") && n.unread).length;

  return (
    <div className="phone-page device-sim">
      <div className="phone-frame">
        <div className="phone-notch" />
        <div className="phone-topbar">
          <div>
            <h1>MACCA PMS</h1>
            <span>{session?.name || "Contractor"}</span>
          </div>
          <div className="flex-row" style={{ gap: "0.35rem" }}>
            <Link href="/contractor/notifications" className="app-icon-btn" aria-label="การแจ้งเตือน" title="การแจ้งเตือน" style={{ position: "relative" }}>
              <IconBell size={15} />
              {unreadCount > 0 && <span className="dot" />}
            </Link>
          </div>
        </div>
        <div className="phone-body">{children}</div>
        <nav className="phone-bottom-nav">
          {tabs.map((t) => {
            const active = pathname === t.href || pathname.startsWith(t.href + "/");
            return (
              <Link key={t.href} href={t.href} className={`phone-tab ${active ? "active" : ""}`}>
                {t.icon}
                <span>{t.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
