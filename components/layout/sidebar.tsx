"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { NAV_ITEMS, ADMIN_NAV_ITEMS } from "./nav-config";
import { cn } from "@/lib/utils";

export type ShellVariant = "coordinator" | "admin";

const CONFIG = {
  coordinator: {
    items: NAV_ITEMS,
    section: "Coordinator",
    user: { name: "คุณปสิทธิ์", role: "ผู้ประสานงาน", initials: "ปส" },
  },
  admin: {
    items: ADMIN_NAV_ITEMS,
    section: "Administration",
    user: { name: "คุณแอดมิน", role: "ผู้ดูแลระบบ", initials: "AD" },
  },
} as const;

export function Sidebar({
  onNavigate,
  variant = "coordinator",
}: {
  onNavigate?: () => void;
  variant?: ShellVariant;
}) {
  const pathname = usePathname();
  const { items, section, user } = CONFIG[variant];

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-card">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
        <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground font-bold text-lg leading-none">
          M
        </div>
        <div className="leading-tight">
          <div className="font-bold text-sm">MACCA PMS</div>
          <div className="text-[0.7rem] text-muted-foreground">
            ระบบบริหารงานบริการ
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="px-2 pb-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          {section}
        </div>
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href ||
                  pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-accent text-primary font-semibold"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User / logout */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
          <div className="grid size-8 place-items-center rounded-full bg-accent text-primary text-xs font-semibold">
            {user.initials}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-medium">{user.name}</div>
            <div className="truncate text-[0.7rem] text-muted-foreground">
              {user.role}
            </div>
          </div>
          <Link
            href="/login"
            aria-label="ออกจากระบบ"
            className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
          >
            <LogOut className="size-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
