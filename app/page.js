import Link from "next/link";
import {
  IconBriefcase, IconTruck, IconFileText, IconShield, IconArrowRight, IconCheckCircle,
} from "./components/icons";

// ผู้บริหารและแอดมินเป็นสิทธิ์เดียวกัน (full access เท่ากัน) — รวมเป็นการ์ดเดียว
// ที่หน้ารวมสิทธิ์นี้ ผู้ใช้เข้าผ่าน /admin/login แล้วเห็นทั้งเมนูจัดการระบบและ
// มุมมองผู้บริหารสำหรับประเมินประสิทธิภาพทีม
const portals = [
  {
    key: "admin",
    title: "Executive & Admin",
    subtitle: "ผู้บริหาร / แอดมิน",
    desc: "จัดการทุกส่วนของระบบ (ผู้ใช้ · Master Data · Audit · Mango) พร้อมมุมมองผู้บริหารสำหรับประเมินประสิทธิภาพทีมและตรวจจับคอขวดเชิงธุรกิจ",
    href: "/admin/login",
    icon: <IconShield size={22} />,
    points: ["จัดการผู้ใช้ · Master Data · Mango Sync", "มุมมองประเมินประสิทธิภาพผู้ประสานงาน/ทีมช่าง", "เข้าถึงทุกโมดูลของทุกฝ่าย"],
  },
  {
    key: "coordinator",
    title: "Coordinator",
    subtitle: "ผู้ประสานงาน",
    desc: "เปิดงาน จัดตารางทีมช่าง สร้างลิงก์เอกสาร ปิดงาน และติดตามบริการหลังการขาย — Web App สำหรับหน้าจอ Desktop",
    href: "/coordinator/login",
    icon: <IconBriefcase size={22} />,
    points: ["จัดการงาน & ซิงค์ข้อมูลกับ Mango", "จัดทำแผนงาน/คิวช่าง", "สร้างลิงก์เอกสาร & ปิดงาน"],
  },
  {
    key: "contractor",
    title: "Contractor",
    subtitle: "ทีมช่าง / ผู้รับเหมา",
    desc: "เช็คตารางงาน อัปโหลดรูปหน้างาน และรับลายเซ็นลูกค้า — ออกแบบ Mobile-First สำหรับทำงานหน้างานจริง",
    href: "/contractor/login",
    icon: <IconTruck size={22} />,
    points: ["ปฏิทินงานส่วนตัว", "อัปโหลดรูปก่อน/ขณะ/หลังทำ", "รับลายเซ็นลูกค้าหน้างาน"],
  },
  {
    key: "guest",
    title: "Guest Access & E-Signature",
    subtitle: "หน้าเซ็นเอกสารลูกค้า (ไม่ต้องล็อกอิน)",
    desc: "เข้าถึงเอกสารผ่านลิงก์ปลอดภัยเฉพาะบุคคล ตรวจสอบ อนุมัติ และเซ็นเอกสารออนไลน์ได้ทันที",
    href: "/guest",
    icon: <IconFileText size={22} />,
    points: ["ใบเสนอราคา + เซ็นอนุมัติ", "คอนเฟิร์มวันนัดหมาย", "ใบส่งมอบงาน + ล็อกลิงก์อัตโนมัติ"],
  },
];

export default function HomePage() {
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "3rem 1.5rem 4rem" }}>
      <div style={{ marginBottom: "2.5rem", paddingBottom: "2rem", borderBottom: "1px solid var(--border)" }}>
        <div className="flex-row" style={{ marginBottom: "0.75rem" }}>
          <span className="badge badge-default">v1.0.0 Prototype</span>
          <span className="badge badge-ghost">Next.js 16 · MACCA Design System Tokens</span>
        </div>
        <h1 style={{ fontSize: "2.6rem", fontWeight: 800, marginBottom: "0.6rem", lineHeight: 1.15, letterSpacing: "-0.01em" }}>
          <span className="gradient-text">MACCA PMS</span>
          <br />Project Management System
        </h1>
        <p className="text-muted" style={{ fontSize: "1rem", maxWidth: 640 }}>
          ระบบบริหารจัดการงานติดตั้งและบริการหลังการขายสำหรับ MACCA Light Engineering — ครอบคลุมทุกโมดูลตั้งแต่การเปิดงาน
          จัดตารางทีมช่าง เซ็นเอกสารออนไลน์ ไปจนถึงการซิงค์ข้อมูลอัตโนมัติกับ Mango เลือกบทบาทด้านล่างเพื่อเข้าชม UI ของแต่ละส่วน
        </p>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {portals.map((p) => (
          <div className="ds-card" key={p.key}>
            <div className="ds-card-content" style={{ padding: "1.5rem" }}>
              <div className="stat-card-icon" style={{ marginBottom: "1rem" }}>{p.icon}</div>
              <div className="ds-card-title" style={{ fontSize: "1.1rem" }}>{p.title}</div>
              <div className="text-xs" style={{ color: "var(--primary)", fontWeight: 600, marginBottom: "0.6rem" }}>{p.subtitle}</div>
              <p className="text-sm text-muted" style={{ marginBottom: "0.9rem" }}>{p.desc}</p>
              <ul style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1.1rem" }}>
                {p.points.map((pt) => (
                  <li key={pt} className="flex-row text-xs" style={{ color: "var(--foreground)" }}>
                    <IconCheckCircle size={13} style={{ color: "var(--success)", flexShrink: 0 }} />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
            <div className="ds-card-footer">
              <Link href={p.href} className="btn btn-default btn-sm btn-block">
                เข้าสู่ระบบ {p.title} <IconArrowRight size={14} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="ds-alert ds-alert-info" style={{ marginTop: "2.5rem" }}>
        <div>
          <strong>เกี่ยวกับต้นแบบนี้ (UI Prototype)</strong>
          หน้าจอทั้งหมดใช้ข้อมูลตัวอย่าง (mock data) เพื่อสาธิตการทำงานของทุกโมดูลตาม Proposal — ยังไม่เชื่อมต่อฐานข้อมูลหรือ Mango
          Web Service จริง สไตล์และ component อ้างอิงจากไฟล์ design-system.html ทั้งหมด
        </div>
      </div>
    </div>
  );
}
