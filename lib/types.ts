// ── Domain model for the MACCA Service-Job PMS ──────────────────────────

export type JobStatus =
  | "new" // แจ้งงาน / เปิดงานใหม่
  | "quoted" // ทำใบเสนอราคาแล้ว
  | "awaiting_approval" // ส่งลิงก์ให้ลูกค้า รออนุมัติ
  | "approved" // ลูกค้าอนุมัติ + ได้ PO
  | "scheduling" // จัดคิว / จัดจ้างผู้รับเหมา
  | "date_confirmed" // ลูกค้ายืนยันวันนัด
  | "in_progress" // ทีมกำลังทำงานหน้างาน
  | "delivered" // ส่งมอบ + ลูกค้าเซ็นรับ
  | "billing" // วางบิล / รอเก็บเงิน
  | "paid" // รับเงินแล้ว
  | "closed" // ปิดงาน
  | "repair"; // เคลมงานซ่อม / รับประกัน

/** High-level buckets used by the Jobs list filter chips. */
export type JobCategory = "all" | "in_progress" | "done" | "repair";

export type SyncState = "pending" | "success" | "failed" | "idle";

export type WarrantyState = "active" | "expired" | "none";

export interface Customer {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  address: string;
  room?: string;
}

export interface Contractor {
  id: string;
  name: string;
  phone: string;
  skill: string;
  avatarColor: string;
}

export interface QuotationItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  warrantyMonths: number;
}

export interface DocumentRef {
  id: string;
  type: "quotation" | "po" | "delivery" | "invoice" | "subcontract";
  label: string;
  date: string;
  sync: SyncState;
}

export interface Job {
  id: string;
  code: string; // e.g. "JOB-2569-0148"
  title: string;
  status: JobStatus;
  customerId: string;
  contractorId?: string;
  jobType: string; // ประเภทงาน
  createdAt: string;
  scheduledAt?: string;
  total: number;
  paidAt?: string;
  warranty: WarrantyState;
  warrantyEndsAt?: string;
  items: QuotationItem[];
  documents: DocumentRef[];
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  status: JobStatus;
  at: string;
  note?: string;
  done: boolean;
}

export interface ScheduleEntry {
  id: string;
  jobId: string;
  contractorId: string;
  date: string; // ISO date (day)
  start: string; // "09:00"
  end: string; // "12:00"
  confirmed: boolean;
}

export interface GuestLink {
  id: string;
  jobId: string;
  kind: "quotation" | "plan" | "delivery";
  token: string;
  createdAt: string;
  expiresAt: string;
  restricted: boolean; // จำกัดสิทธิ์คนเข้าถึง
  status: "active" | "used" | "expired";
}
