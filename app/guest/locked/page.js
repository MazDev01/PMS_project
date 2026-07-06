import GuestLockedActions from "@/app/components/GuestLockedActions";
import { IconCheckCircle } from "@/app/components/icons";

export default function GuestLockedPage() {
  return (
    <div className="locked-wrap">
      <div className="ds-card locked-card">
        <div className="locked-icon"><IconCheckCircle size={32} /></div>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>เอกสารนี้ดำเนินการเรียบร้อยแล้ว</h2>
        <p className="text-sm text-muted" style={{ marginBottom: "1rem" }}>
          ลิงก์นี้ถูกล็อกโดยอัตโนมัติเพื่อป้องกันการทำรายการซ้ำ ระบบได้ตรวจสอบ Token และวันหมดอายุของลิงก์เรียบร้อยแล้ว
          หากต้องการดำเนินการเพิ่มเติม กรุณาติดต่อผู้ประสานงานเพื่อขอลิงก์ใหม่
        </p>
        <p className="text-xs text-muted font-mono">บันทึกเมื่อ 3 ก.ค. 2569 14:32 น. · IP: 203.150.42.18</p>
        <GuestLockedActions />
      </div>
    </div>
  );
}
