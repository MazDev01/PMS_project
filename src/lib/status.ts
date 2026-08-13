import type { JobStatus, JobCategory, SyncState } from "./types";

export type BadgeTone =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "info"
  | "destructive"
  | "ghost";

interface StatusMeta {
  label: string;
  tone: BadgeTone;
  category: Exclude<JobCategory, "all">;
}

/** Canonical lifecycle order — drives the job timeline stepper. */
export const JOB_LIFECYCLE: JobStatus[] = [
  "new",
  "quoted",
  "awaiting_approval",
  "approved",
  "scheduling",
  "date_confirmed",
  "in_progress",
  "delivered",
  "billing",
  "paid",
  "closed",
];

export const STATUS_META: Record<JobStatus, StatusMeta> = {
  new: { label: "เปิดงานใหม่", tone: "secondary", category: "in_progress" },
  quoted: { label: "ทำใบเสนอราคา", tone: "info", category: "in_progress" },
  awaiting_approval: {
    label: "รออนุมัติ",
    tone: "warning",
    category: "in_progress",
  },
  approved: { label: "อนุมัติแล้ว", tone: "info", category: "in_progress" },
  scheduling: { label: "จัดคิว/จัดจ้าง", tone: "info", category: "in_progress" },
  date_confirmed: {
    label: "ยืนยันวันแล้ว",
    tone: "info",
    category: "in_progress",
  },
  in_progress: {
    label: "กำลังดำเนินการ",
    tone: "warning",
    category: "in_progress",
  },
  delivered: { label: "ส่งมอบแล้ว", tone: "info", category: "in_progress" },
  billing: { label: "รอเก็บเงิน", tone: "warning", category: "in_progress" },
  paid: { label: "รับเงินแล้ว", tone: "success", category: "done" },
  closed: { label: "ปิดงานแล้ว", tone: "success", category: "done" },
  repair: { label: "แจ้งซ่อม/เคลม", tone: "destructive", category: "repair" },
};

export const CATEGORY_LABEL: Record<JobCategory, string> = {
  all: "งานทั้งหมด",
  in_progress: "กำลังดำเนินการ",
  done: "เสร็จสิ้นแล้ว",
  repair: "แจ้งซ่อม",
};

export function statusCategory(status: JobStatus): Exclude<JobCategory, "all"> {
  return STATUS_META[status].category;
}

export const SYNC_META: Record<
  SyncState,
  { label: string; tone: BadgeTone; dot: string }
> = {
  idle: { label: "ยังไม่ส่ง", tone: "ghost", dot: "bg-muted-foreground/40" },
  pending: { label: "กำลังส่งข้อมูล", tone: "warning", dot: "bg-warning" },
  success: { label: "ซิงค์สำเร็จ", tone: "success", dot: "bg-success" },
  failed: { label: "ส่งไม่สำเร็จ", tone: "destructive", dot: "bg-destructive" },
};
