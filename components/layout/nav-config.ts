import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  Link2,
  Wallet,
  ShieldCheck,
  Users,
  Database,
  ScrollText,
  RefreshCw,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "จัดการงาน", icon: ClipboardList },
  { href: "/schedule", label: "จัดทำแผนงาน", icon: CalendarDays },
  { href: "/links", label: "สร้างลิงก์", icon: Link2 },
  { href: "/closing", label: "ปิดงาน", icon: Wallet },
  { href: "/warranty", label: "เช็คประกัน / แจ้งซ่อม", icon: ShieldCheck },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "จัดการผู้ใช้", icon: Users },
  { href: "/admin/master-data", label: "Master Data", icon: Database },
  { href: "/admin/logs", label: "ประวัติการใช้งาน", icon: ScrollText },
  { href: "/admin/mango", label: "ซิงค์ข้อมูล Mango", icon: RefreshCw },
];

/** Human-readable page title used by the topbar, keyed by path prefix. */
export const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "ภาพรวมระบบ",
  "/jobs": "จัดการงาน",
  "/schedule": "จัดทำแผนงาน",
  "/links": "สร้างลิงก์ส่งลูกค้า",
  "/closing": "ปิดงาน & การเงิน",
  "/warranty": "รับประกัน & แจ้งซ่อม",
  "/admin/users": "จัดการบัญชีผู้ใช้",
  "/admin/master-data": "ข้อมูลหลัก (Master Data)",
  "/admin/logs": "ประวัติการใช้งานระบบ",
  "/admin/mango": "เชื่อมต่อ & ซิงค์ Mango",
  "/admin": "ภาพรวมระบบ (Admin)",
};
