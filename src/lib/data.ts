import type {
  Customer,
  Contractor,
  Job,
  ScheduleEntry,
  GuestLink,
  JobStatus,
  TimelineEvent,
} from "./types";
import { JOB_LIFECYCLE } from "./status";

// ── Customers ───────────────────────────────────────────────────────────
export const customers: Customer[] = [
  {
    id: "c1",
    name: "บจก. เดอะ ริเวอร์ เรสซิเดนซ์",
    contactName: "คุณพงษ์ศักดิ์",
    phone: "081-234-5678",
    address: "เลขที่ 199 ถ.เจริญนคร แขวงคลองต้นไทร เขตคลองสาน กรุงเทพฯ",
    room: "ห้อง A-1204",
  },
  {
    id: "c2",
    name: "โรงแรม แกรนด์ เมโทร",
    contactName: "คุณสุนิสา",
    phone: "089-876-5432",
    address: "เลขที่ 88 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ",
    room: "ชั้น 8 ห้องประชุม",
  },
  {
    id: "c3",
    name: "บจก. ไลท์เฮาส์ พร็อพเพอร์ตี้",
    contactName: "คุณธนกร",
    phone: "092-111-2233",
    address: "เลขที่ 45/9 ถ.รัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพฯ",
    room: "ห้อง 502",
  },
  {
    id: "c4",
    name: "คุณวราภรณ์ (ลูกค้าบ้านพักอาศัย)",
    contactName: "คุณวราภรณ์",
    phone: "086-555-0099",
    address: "เลขที่ 7 ซ.ลาดพร้าว 71 แขวงลาดพร้าว เขตลาดพร้าว กรุงเทพฯ",
  },
];

// ── Contractors / Service teams ─────────────────────────────────────────
export const contractors: Contractor[] = [
  {
    id: "t1",
    name: "ทีมช่างเอก (แอร์)",
    phone: "081-000-1111",
    skill: "ติดตั้ง/ล้างแอร์",
    avatarColor: "var(--chart-1)",
  },
  {
    id: "t2",
    name: "ทีมช่างบี (ไฟฟ้า)",
    phone: "081-000-2222",
    skill: "งานระบบไฟฟ้า",
    avatarColor: "var(--chart-3)",
  },
  {
    id: "t3",
    name: "ทีมช่างซี (ประปา)",
    phone: "081-000-3333",
    skill: "งานประปา/สุขาภิบาล",
    avatarColor: "var(--chart-4)",
  },
  {
    id: "t4",
    name: "ผู้รับเหมา ดี.เค. เซอร์วิส",
    phone: "081-000-4444",
    skill: "งานทั่วไป",
    avatarColor: "var(--chart-5)",
  },
];

function buildTimeline(status: JobStatus, base: string): TimelineEvent[] {
  const idx = JOB_LIFECYCLE.indexOf(status);
  const day = 24 * 60 * 60 * 1000;
  const start = new Date(base).getTime();
  return JOB_LIFECYCLE.map((s, i) => ({
    status: s,
    at: new Date(start + i * day).toISOString(),
    done: i <= idx,
  }));
}

// ── Jobs ────────────────────────────────────────────────────────────────
export const jobs: Job[] = [
  {
    id: "j1",
    code: "JOB-2569-0148",
    title: "ติดตั้งแอร์ใหม่ 4 เครื่อง ห้อง A-1204",
    status: "awaiting_approval",
    customerId: "c1",
    jobType: "ติดตั้งแอร์",
    createdAt: "2026-06-28",
    total: 84500,
    warranty: "none",
    items: [
      {
        id: "i1",
        description: "เครื่องปรับอากาศ 18,000 BTU (Inverter)",
        qty: 2,
        unitPrice: 22500,
        warrantyMonths: 12,
      },
      {
        id: "i2",
        description: "เครื่องปรับอากาศ 12,000 BTU (Inverter)",
        qty: 2,
        unitPrice: 16500,
        warrantyMonths: 12,
      },
      {
        id: "i3",
        description: "ค่าติดตั้ง + เดินท่อน้ำยา",
        qty: 4,
        unitPrice: 1625,
        warrantyMonths: 2,
      },
    ],
    documents: [
      {
        id: "d1",
        type: "quotation",
        label: "ใบเสนอราคา QT-0148",
        date: "2026-06-29",
        sync: "success",
      },
    ],
    timeline: buildTimeline("awaiting_approval", "2026-06-28"),
  },
  {
    id: "j2",
    code: "JOB-2569-0147",
    title: "ล้างแอร์ประจำปี ชั้น 8 (12 จุด)",
    status: "in_progress",
    customerId: "c2",
    contractorId: "t1",
    jobType: "ล้างแอร์",
    createdAt: "2026-06-20",
    scheduledAt: "2026-07-03",
    total: 18000,
    warranty: "none",
    items: [
      {
        id: "i4",
        description: "ล้างแอร์ระบบใหญ่ (Big cleaning)",
        qty: 12,
        unitPrice: 1500,
        warrantyMonths: 2,
      },
    ],
    documents: [
      {
        id: "d2",
        type: "quotation",
        label: "ใบเสนอราคา QT-0147",
        date: "2026-06-21",
        sync: "success",
      },
      {
        id: "d3",
        type: "po",
        label: "PO-8842 (จากลูกค้า)",
        date: "2026-06-24",
        sync: "success",
      },
      {
        id: "d4",
        type: "subcontract",
        label: "ใบสั่งจ้าง SC-0031",
        date: "2026-06-30",
        sync: "pending",
      },
    ],
    timeline: buildTimeline("in_progress", "2026-06-20"),
  },
  {
    id: "j3",
    code: "JOB-2569-0143",
    title: "เดินระบบไฟฟ้าห้อง 502 + ติดตั้งเบรกเกอร์",
    status: "billing",
    customerId: "c3",
    contractorId: "t2",
    jobType: "งานระบบไฟฟ้า",
    createdAt: "2026-06-05",
    scheduledAt: "2026-06-18",
    total: 46200,
    warranty: "none",
    items: [
      {
        id: "i5",
        description: "เดินสายไฟ + ตู้ควบคุม (Consumer unit)",
        qty: 1,
        unitPrice: 32000,
        warrantyMonths: 12,
      },
      {
        id: "i6",
        description: "ค่าแรงติดตั้ง",
        qty: 1,
        unitPrice: 14200,
        warrantyMonths: 2,
      },
    ],
    documents: [
      {
        id: "d5",
        type: "quotation",
        label: "ใบเสนอราคา QT-0143",
        date: "2026-06-06",
        sync: "success",
      },
      {
        id: "d6",
        type: "delivery",
        label: "ใบส่งมอบงาน DN-0143",
        date: "2026-06-20",
        sync: "success",
      },
      {
        id: "d7",
        type: "invoice",
        label: "ใบแจ้งหนี้ INV-0143",
        date: "2026-06-22",
        sync: "failed",
      },
    ],
    timeline: buildTimeline("billing", "2026-06-05"),
  },
  {
    id: "j4",
    code: "JOB-2569-0131",
    title: "ติดตั้งปั๊มน้ำ + เดินท่อประปา บ้านพักอาศัย",
    status: "paid",
    customerId: "c4",
    contractorId: "t3",
    jobType: "งานประปา",
    createdAt: "2026-05-12",
    scheduledAt: "2026-05-20",
    total: 27800,
    paidAt: "2026-06-15",
    warranty: "active",
    warrantyEndsAt: "2027-06-15",
    items: [
      {
        id: "i7",
        description: "ปั๊มน้ำอัตโนมัติ 250W",
        qty: 1,
        unitPrice: 8900,
        warrantyMonths: 12,
      },
      {
        id: "i8",
        description: "เดินท่อ PPR + ค่าแรง",
        qty: 1,
        unitPrice: 18900,
        warrantyMonths: 2,
      },
    ],
    documents: [
      {
        id: "d8",
        type: "quotation",
        label: "ใบเสนอราคา QT-0131",
        date: "2026-05-13",
        sync: "success",
      },
      {
        id: "d9",
        type: "delivery",
        label: "ใบส่งมอบงาน DN-0131",
        date: "2026-05-22",
        sync: "success",
      },
      {
        id: "d10",
        type: "invoice",
        label: "ใบแจ้งหนี้ INV-0131",
        date: "2026-05-24",
        sync: "success",
      },
    ],
    timeline: buildTimeline("paid", "2026-05-12"),
  },
  {
    id: "j5",
    code: "JOB-2569-0098",
    title: "ปิดงาน — ติดตั้งแอร์ล็อบบี้ (เสร็จสมบูรณ์)",
    status: "closed",
    customerId: "c2",
    contractorId: "t1",
    jobType: "ติดตั้งแอร์",
    createdAt: "2026-04-02",
    scheduledAt: "2026-04-10",
    total: 132000,
    paidAt: "2026-05-01",
    warranty: "active",
    warrantyEndsAt: "2027-05-01",
    items: [
      {
        id: "i9",
        description: "เครื่องปรับอากาศ 36,000 BTU",
        qty: 3,
        unitPrice: 38000,
        warrantyMonths: 12,
      },
      {
        id: "i10",
        description: "ค่าติดตั้ง + งานท่อ",
        qty: 1,
        unitPrice: 18000,
        warrantyMonths: 2,
      },
    ],
    documents: [
      {
        id: "d11",
        type: "quotation",
        label: "ใบเสนอราคา QT-0098",
        date: "2026-04-03",
        sync: "success",
      },
      {
        id: "d12",
        type: "delivery",
        label: "ใบส่งมอบงาน DN-0098",
        date: "2026-04-12",
        sync: "success",
      },
      {
        id: "d13",
        type: "invoice",
        label: "ใบแจ้งหนี้ INV-0098",
        date: "2026-04-15",
        sync: "success",
      },
    ],
    timeline: buildTimeline("closed", "2026-04-02"),
  },
  {
    id: "j6",
    code: "JOB-2569-0150",
    title: "แจ้งซ่อม — แอร์ห้อง A-1204 ไม่เย็น (ในประกัน)",
    status: "repair",
    customerId: "c1",
    contractorId: "t1",
    jobType: "เคลมงานซ่อม",
    createdAt: "2026-07-01",
    total: 0,
    warranty: "active",
    warrantyEndsAt: "2027-01-10",
    items: [],
    documents: [],
    timeline: [
      { status: "new", at: "2026-07-01", done: true, note: "ลูกค้าแจ้งอาการ" },
      {
        status: "scheduling",
        at: "2026-07-02",
        done: true,
        note: "ตรวจประกัน: ยังอยู่ในระยะ ✓",
      },
      { status: "in_progress", at: "2026-07-03", done: false },
    ],
  },
  {
    id: "j7",
    code: "JOB-2569-0151",
    title: "เปลี่ยนหลอดไฟ LED โถงทางเดิน (24 จุด)",
    status: "new",
    customerId: "c3",
    jobType: "งานระบบไฟฟ้า",
    createdAt: "2026-07-02",
    total: 0,
    warranty: "none",
    items: [],
    documents: [],
    timeline: buildTimeline("new", "2026-07-02"),
  },
];

// ── Schedule (July 2026) ────────────────────────────────────────────────
export const schedule: ScheduleEntry[] = [
  {
    id: "s1",
    jobId: "j2",
    contractorId: "t1",
    date: "2026-07-03",
    start: "09:00",
    end: "16:00",
    confirmed: true,
  },
  {
    id: "s2",
    jobId: "j6",
    contractorId: "t1",
    date: "2026-07-03",
    start: "17:00",
    end: "18:30",
    confirmed: false,
  },
  {
    id: "s3",
    jobId: "j3",
    contractorId: "t2",
    date: "2026-07-08",
    start: "10:00",
    end: "15:00",
    confirmed: true,
  },
  {
    id: "s4",
    jobId: "j1",
    contractorId: "t4",
    date: "2026-07-11",
    start: "09:00",
    end: "17:00",
    confirmed: false,
  },
  {
    id: "s5",
    jobId: "j7",
    contractorId: "t2",
    date: "2026-07-15",
    start: "13:00",
    end: "16:00",
    confirmed: false,
  },
  {
    id: "s6",
    jobId: "j1",
    contractorId: "t1",
    date: "2026-07-11",
    start: "09:00",
    end: "17:00",
    confirmed: true,
  },
  {
    id: "s7",
    jobId: "j5",
    contractorId: "t1",
    date: "2026-06-28",
    start: "09:00",
    end: "12:00",
    confirmed: true,
  },
];

// ── Guest links ─────────────────────────────────────────────────────────
export const guestLinks: GuestLink[] = [
  {
    id: "gl1",
    jobId: "j1",
    kind: "quotation",
    token: "qt0148",
    createdAt: "2026-06-29",
    expiresAt: "2026-07-06",
    restricted: true,
    status: "active",
  },
  {
    id: "gl2",
    jobId: "j2",
    kind: "plan",
    token: "pl0147",
    createdAt: "2026-06-30",
    expiresAt: "2026-07-08",
    restricted: false,
    status: "active",
  },
  {
    id: "gl3",
    jobId: "j3",
    kind: "delivery",
    token: "dn0143",
    createdAt: "2026-06-20",
    expiresAt: "2026-07-09",
    restricted: true,
    status: "active",
  },
  {
    id: "gl4",
    jobId: "j5",
    kind: "delivery",
    token: "dn0098",
    createdAt: "2026-04-12",
    expiresAt: "2026-04-19",
    restricted: true,
    status: "used",
  },
  {
    id: "gl5",
    jobId: "j4",
    kind: "quotation",
    token: "qt0131",
    createdAt: "2026-05-13",
    expiresAt: "2026-05-20",
    restricted: false,
    status: "expired",
  },
];

// ── Accessors ───────────────────────────────────────────────────────────
export function getJobs() {
  return jobs;
}
export function getJob(id: string) {
  return jobs.find((j) => j.id === id);
}
export function getJobByToken(token: string) {
  const link = guestLinks.find((l) => l.token === token);
  return link ? { link, job: getJob(link.jobId) } : undefined;
}
export function getCustomer(id: string) {
  return customers.find((c) => c.id === id);
}
export function getContractor(id?: string) {
  return id ? contractors.find((c) => c.id === id) : undefined;
}
export function getScheduleForContractor(contractorId: string) {
  return schedule.filter((s) => s.contractorId === contractorId);
}
