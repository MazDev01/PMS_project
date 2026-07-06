import { IconAlertTriangle } from "./icons";

export default function GuestInvalidLink({ message }) {
  return (
    <div className="locked-wrap">
      <div className="ds-card locked-card">
        <div className="locked-icon" style={{ background: "oklch(0.577 0.245 27.325 / 0.12)", color: "var(--destructive)" }}>
          <IconAlertTriangle size={32} />
        </div>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          ลิงก์นี้ไม่ถูกต้องหรือหมดอายุแล้ว
        </h2>
        <p className="text-sm text-muted">
          {message || "ลิงก์อาจถูกยกเลิก หมดอายุ หรือไม่ตรงกับเอกสารนี้ กรุณาติดต่อผู้ประสานงานเพื่อขอลิงก์ใหม่"}
        </p>
      </div>
    </div>
  );
}
