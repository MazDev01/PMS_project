import type { SyncState } from "./types";

// ── Users ───────────────────────────────────────────────────────────────
export type UserRole = "admin" | "coordinator" | "contractor";

export interface SystemUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  active: boolean;
  lastActive: string;
  avatarColor: string;
}

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "ผู้ดูแลระบบ",
  coordinator: "ผู้ประสานงาน",
  contractor: "ทีมช่าง / ผู้รับเหมา",
};

export const users: SystemUser[] = [
  {
    id: "u1",
    name: "คุณแอดมิน",
    username: "admin",
    email: "admin@macca.co.th",
    role: "admin",
    active: true,
    lastActive: "2026-07-03T14:20:00",
    avatarColor: "var(--chart-5)",
  },
  {
    id: "u2",
    name: "คุณปสิทธิ์",
    username: "coordinator",
    email: "pusit@macca.co.th",
    role: "coordinator",
    active: true,
    lastActive: "2026-07-03T14:02:00",
    avatarColor: "var(--chart-1)",
  },
  {
    id: "u3",
    name: "คุณมนัส",
    username: "coordinator2",
    email: "manas@macca.co.th",
    role: "coordinator",
    active: true,
    lastActive: "2026-07-02T17:40:00",
    avatarColor: "var(--chart-3)",
  },
  {
    id: "u4",
    name: "ทีมช่างเอก",
    username: "team_ake",
    email: "ake@macca.co.th",
    role: "contractor",
    active: true,
    lastActive: "2026-07-03T09:04:00",
    avatarColor: "var(--chart-1)",
  },
  {
    id: "u5",
    name: "ทีมช่างบี",
    username: "team_b",
    email: "b@macca.co.th",
    role: "contractor",
    active: true,
    lastActive: "2026-07-01T15:22:00",
    avatarColor: "var(--chart-3)",
  },
  {
    id: "u6",
    name: "ทีมช่างซี",
    username: "team_c",
    email: "c@macca.co.th",
    role: "contractor",
    active: false,
    lastActive: "2026-06-18T11:10:00",
    avatarColor: "var(--chart-4)",
  },
  {
    id: "u7",
    name: "ผู้รับเหมา ดี.เค.",
    username: "dk_service",
    email: "dk@macca.co.th",
    role: "contractor",
    active: true,
    lastActive: "2026-06-30T08:50:00",
    avatarColor: "var(--chart-5)",
  },
];

// ── Audit logs ──────────────────────────────────────────────────────────
export interface LogEntry {
  id: string;
  at: string;
  actor: string;
  role: UserRole;
  action: string;
  auto: boolean;
}

export const logs: LogEntry[] = [
  {
    id: "l1",
    at: "2026-07-03T14:20:11",
    actor: "คุณแอดมิน",
    role: "admin",
    action: "เข้าสู่ระบบ",
    auto: false,
  },
  {
    id: "l2",
    at: "2026-07-03T14:05:02",
    actor: "ระบบ",
    role: "coordinator",
    action: "อัปเดตสถานะงาน JOB-2569-0147 → กำลังดำเนินการ",
    auto: true,
  },
  {
    id: "l3",
    at: "2026-07-03T13:58:40",
    actor: "คุณปสิทธิ์",
    role: "coordinator",
    action: "สร้างลิงก์ใบเสนอราคา JOB-2569-0148",
    auto: false,
  },
  {
    id: "l4",
    at: "2026-07-03T11:32:19",
    actor: "ระบบ",
    role: "coordinator",
    action: "ยืนยันวันนัดหมาย JOB-2569-0147 (ลูกค้ากดยืนยัน)",
    auto: true,
  },
  {
    id: "l5",
    at: "2026-07-03T09:04:55",
    actor: "ทีมช่างเอก",
    role: "contractor",
    action: "เช็คอินหน้างาน JOB-2569-0147",
    auto: false,
  },
  {
    id: "l6",
    at: "2026-07-02T17:41:03",
    actor: "คุณมนัส",
    role: "coordinator",
    action: "เปิดงานใหม่ JOB-2569-0151",
    auto: false,
  },
  {
    id: "l7",
    at: "2026-07-02T16:20:44",
    actor: "ระบบ",
    role: "admin",
    action: "ซิงค์ข้อมูลไป Mango สำเร็จ (INV-0143)",
    auto: true,
  },
  {
    id: "l8",
    at: "2026-07-01T15:22:10",
    actor: "ทีมช่างบี",
    role: "contractor",
    action: "อัปโหลดใบส่งมอบงาน JOB-2569-0143",
    auto: false,
  },
];

// ── Mango sync records ──────────────────────────────────────────────────
export interface SyncRecord {
  id: string;
  doc: string;
  type: string;
  at: string;
  state: SyncState;
}

export const syncRecords: SyncRecord[] = [
  {
    id: "sr1",
    doc: "QT-0148",
    type: "ข้อมูลแจ้งทำราคา",
    at: "2026-07-03T09:12:00",
    state: "success",
  },
  {
    id: "sr2",
    doc: "PO-8842",
    type: "เอกสาร PO / ใบสั่งจ้าง",
    at: "2026-07-03T10:01:00",
    state: "success",
  },
  {
    id: "sr3",
    doc: "SC-0031",
    type: "ใบสั่งจ้างผู้รับเหมา",
    at: "2026-07-03T10:45:00",
    state: "pending",
  },
  {
    id: "sr4",
    doc: "INV-0143",
    type: "รายการใบส่งมอบงาน",
    at: "2026-07-02T16:20:00",
    state: "failed",
  },
  {
    id: "sr5",
    doc: "DN-0131",
    type: "รายการใบส่งมอบงาน",
    at: "2026-06-22T14:00:00",
    state: "success",
  },
];

// ── Master data ─────────────────────────────────────────────────────────
export interface JobTypeRow {
  id: string;
  name: string;
  defaultWarranty: number;
  jobs: number;
}

export const jobTypes: JobTypeRow[] = [
  { id: "jt1", name: "ติดตั้งแอร์", defaultWarranty: 12, jobs: 12 },
  { id: "jt2", name: "ล้างแอร์", defaultWarranty: 2, jobs: 34 },
  { id: "jt3", name: "งานระบบไฟฟ้า", defaultWarranty: 12, jobs: 18 },
  { id: "jt4", name: "งานประปา", defaultWarranty: 6, jobs: 9 },
  { id: "jt5", name: "งานทั่วไป", defaultWarranty: 2, jobs: 21 },
];

// ── Aggregates ──────────────────────────────────────────────────────────
export function userCounts() {
  return {
    total: users.length,
    admin: users.filter((u) => u.role === "admin").length,
    coordinator: users.filter((u) => u.role === "coordinator").length,
    contractor: users.filter((u) => u.role === "contractor").length,
    active: users.filter((u) => u.active).length,
  };
}
