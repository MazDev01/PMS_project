import Link from "next/link";
import {
  IconFileText, IconCalendar, IconTruck, IconLock, IconShield, IconClock, IconArrowRight,
} from "@/app/components/icons";

const entries = [
  {
    href: "/guest/quotation",
    icon: IconFileText,
    title: "ใบเสนอราคา",
    desc: "ตรวจสอบและเซ็นอนุมัติ",
  },
  {
    href: "/guest/confirm",
    icon: IconCalendar,
    title: "คอนเฟิร์มวัน",
    desc: "ยืนยันวันนัดหมาย",
  },
  {
    href: "/guest/signoff",
    icon: IconTruck,
    title: "ใบส่งมอบงาน",
    desc: "เซ็นรับมอบงาน",
  },
  {
    href: "/guest/locked",
    icon: IconLock,
    title: "ตัวอย่างสถานะหลังทำรายการสำเร็จ (Action Lock)",
    desc: "ดูตัวอย่างหน้าจอเมื่อเอกสารถูกล็อกอัตโนมัติ",
  },
];

export default function GuestIndexPage() {
  return (
    <div>
      <div className="ds-card" style={{ marginBottom: "1.75rem" }}>
        <div className="ds-card-header">
          <span className="badge badge-default" style={{ marginBottom: "0.6rem" }}>Guest Access</span>
          <div className="ds-card-title" style={{ fontSize: "1.15rem" }}>
            ตัวอย่างลิงก์การเข้าถึงของลูกค้า (Guest Access)
          </div>
        </div>
        <div className="ds-card-content">
          <p className="text-sm text-muted" style={{ marginBottom: "0.75rem" }}>
            ในการใช้งานจริง ลูกค้าจะไม่เข้าหน้าเหล่านี้ผ่านเมนูนำทางใด ๆ ทั้งสิ้น แต่จะได้รับ{" "}
            <strong>ลิงก์เฉพาะบุคคล (tokenized link)</strong> ส่งให้ทางไลน์ (LINE) หรือ SMS เท่านั้น เช่น
          </p>
          <p
            className="text-xs font-mono"
            style={{
              background: "var(--muted)", padding: "0.6rem 0.75rem", borderRadius: "var(--radius-md)",
              marginBottom: "0.9rem", wordBreak: "break-all",
            }}
          >
            https://pms.maccalight.co.th/guest/quotation?token=8f2a91cd7e...
          </p>
          <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li className="flex-row text-sm">
              <IconShield size={15} style={{ color: "var(--primary)", flexShrink: 0 }} />
              เป็นแบบไม่ระบุตัวตน (Anonymous) — ไม่ต้องล็อกอิน ตรวจสอบสิทธิ์ด้วย Token ในลิงก์เท่านั้น
            </li>
            <li className="flex-row text-sm">
              <IconFileText size={15} style={{ color: "var(--primary)", flexShrink: 0 }} />
              ผูกกับเอกสารเพียงฉบับเดียวต่อหนึ่งลิงก์ ไม่สามารถเรียกดูเอกสารอื่นของงานได้
            </li>
            <li className="flex-row text-sm">
              <IconClock size={15} style={{ color: "var(--primary)", flexShrink: 0 }} />
              มีวันหมดอายุกำหนดไว้ล่วงหน้า และผู้ประสานงานสามารถยกเลิกการเข้าถึงได้ทุกเมื่อ
            </li>
            <li className="flex-row text-sm">
              <IconLock size={15} style={{ color: "var(--primary)", flexShrink: 0 }} />
              ล็อกลิงก์โดยอัตโนมัติทันทีหลังทำรายการสำเร็จ เพื่อป้องกันการทำรายการซ้ำ
            </li>
          </ul>
        </div>
      </div>

      <div className="section-block">
        <h3>ทางเข้าตัวอย่างสำหรับรีวิว (Demo Entry Points)</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {entries.map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              className="ds-card"
              style={{
                display: "flex", alignItems: "center", gap: "1rem",
                padding: "1rem 1.25rem", textDecoration: "none", color: "inherit",
              }}
            >
              <div className="stat-card-icon"><entry.icon size={18} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.15rem" }}>{entry.title}</div>
                <div className="text-xs text-muted">{entry.desc}</div>
              </div>
              <IconArrowRight size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
