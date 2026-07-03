"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, CalendarDays, User } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Phone frame: full-bleed gradient, content constrained to a phone width ─
export function PhoneFrame({
  children,
  withNav = false,
  className,
}: {
  children: React.ReactNode;
  withNav?: boolean;
  className?: string;
}) {
  return (
    <div className="ct-bg min-h-screen w-full">
      <div
        className={cn(
          "mx-auto flex min-h-screen w-full max-w-[440px] flex-col",
          withNav && "pb-24",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

// ── Hexagon brand mark ────────────────────────────────────────────────────
export function Hexagon({
  size = 56,
  letter = "M",
}: {
  size?: number;
  letter?: string;
}) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <polygon
          points="50,3 93,27 93,73 50,97 7,73 7,27"
          fill="white"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-extrabold text-[color:var(--ct-purple)]"
        style={{ fontSize: size * 0.42 }}
      >
        {letter}
      </span>
    </div>
  );
}

// ── Buttons ───────────────────────────────────────────────────────────────
export function CButton({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "glass" | "white";
}) {
  return (
    <button
      className={cn(
        "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-base font-semibold transition-colors cursor-pointer disabled:opacity-60 disabled:pointer-events-none [&_svg]:size-5",
        variant === "primary" &&
          "bg-[color:var(--ct-purple)] text-white shadow-lg shadow-purple-900/20 hover:bg-[color:var(--ct-purple-hover)]",
        variant === "glass" &&
          "ct-glass-strong text-white hover:bg-white/30",
        variant === "white" &&
          "bg-white text-[color:var(--ct-purple)] shadow-lg hover:bg-white/90",
        className,
      )}
      {...props}
    />
  );
}

// ── Input (white rounded field, optional leading icon) ────────────────────
export function CInput({
  icon,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
          {icon}
        </span>
      )}
      <input
        className={cn(
          "h-14 w-full rounded-2xl bg-white px-5 text-base text-neutral-800 shadow-sm outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-white/70",
          icon && "pl-12",
          className,
        )}
        {...props}
      />
    </div>
  );
}

// ── Cards ─────────────────────────────────────────────────────────────────
export function GlassCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("ct-glass rounded-2xl text-white", className)}
      {...props}
    />
  );
}

export function WhiteCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white text-neutral-800 shadow-lg shadow-black/5",
        className,
      )}
      {...props}
    />
  );
}

// ── Bottom tab bar ────────────────────────────────────────────────────────
const NAV = [
  { href: "/contractor", label: "หน้าหลัก", icon: Home, exact: true },
  { href: "/contractor/jobs", label: "งาน", icon: ClipboardList },
  { href: "/contractor/calendar", label: "ปฏิทิน", icon: CalendarDays },
  { href: "/contractor/profile", label: "โปรไฟล์", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-center pb-3">
      <div className="ct-glass-strong mx-4 flex w-full max-w-[408px] items-center justify-around rounded-2xl px-2 py-2">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[0.68rem] font-medium transition-colors",
                active ? "text-white" : "text-white/60",
              )}
            >
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-xl transition-colors",
                  active && "bg-white/25",
                )}
              >
                <Icon className="size-5" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ── Small header used across app screens ──────────────────────────────────
export function CHeader({
  title,
  subtitle,
  right,
  back,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  back?: string;
}) {
  return (
    <header className="flex items-center gap-3 px-5 pt-6 pb-2 text-white">
      {back && (
        <Link
          href={back}
          className="grid size-9 place-items-center rounded-xl ct-glass text-white"
          aria-label="ย้อนกลับ"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-bold">{title}</h1>
        {subtitle && <p className="text-[0.8rem] text-white/75">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}
