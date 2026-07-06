import { IconLock } from "@/app/components/icons";

// Shown on Coordinator operational pages when they're being viewed by an
// admin/executive — they can read the data but not create/edit/act on it.
export default function ViewOnlyBanner() {
  return (
    <div className="ds-alert ds-alert-info" style={{ marginBottom: "1.25rem" }}>
      <div className="ds-alert-icon"><IconLock size={16} /></div>
      <div>
        <strong>โหมดดูอย่างเดียว (ผู้บริหาร / แอดมิน)</strong> เข้าดูข้อมูลได้
        แต่ไม่สามารถแก้ไขหรือดำเนินการใด ๆ ในหน้านี้ — เฉพาะผู้ประสานงานเจ้าของงานเท่านั้นที่ทำรายการได้
      </div>
    </div>
  );
}
