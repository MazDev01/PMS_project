"use client";

// Cascading จังหวัด → อำเภอ/เขต → ตำบล/แขวง picker + free-text detail + optional
// Google Maps link — used anywhere an address is captured (customer master
// record, job site address) so entry is consistent and never a blank
// free-text box the user has to fill in from scratch.
import { thaiProvinces, isBangkok } from "@/app/lib/thaiAddress";

export default function ThaiAddressFields({ value, onChange }) {
  const province = thaiProvinces.find((p) => p.name === value.province);
  const district = province?.districts.find((d) => d.name === value.district);
  const bkk = isBangkok(value);

  function setProvince(name) {
    onChange({ ...value, province: name, district: "", subdistrict: "", postalCode: "" });
  }
  function setDistrict(name) {
    onChange({ ...value, district: name, subdistrict: "", postalCode: "" });
  }
  function setSubdistrict(name) {
    const sub = district?.subdistricts.find((s) => s.name === name);
    onChange({ ...value, subdistrict: name, postalCode: sub?.zip || "" });
  }

  return (
    <div>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="ds-label">จังหวัด</label>
          <select className="ds-input" value={value.province || ""} onChange={(e) => setProvince(e.target.value)}>
            <option value="">เลือกจังหวัด</option>
            {thaiProvinces.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="ds-label">{bkk ? "เขต" : "อำเภอ"}</label>
          <select className="ds-input" value={value.district || ""} onChange={(e) => setDistrict(e.target.value)} disabled={!province}>
            <option value="">{province ? `เลือก${bkk ? "เขต" : "อำเภอ"}` : "เลือกจังหวัดก่อน"}</option>
            {province?.districts.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
          </select>
        </div>
      </div>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="ds-label">{bkk ? "แขวง" : "ตำบล"}</label>
          <select className="ds-input" value={value.subdistrict || ""} onChange={(e) => setSubdistrict(e.target.value)} disabled={!district}>
            <option value="">{district ? `เลือก${bkk ? "แขวง" : "ตำบล"}` : `เลือก${bkk ? "เขต" : "อำเภอ"}ก่อน`}</option>
            {district?.subdistricts.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="ds-label">รหัสไปรษณีย์</label>
          <input className="ds-input" type="text" value={value.postalCode || ""} readOnly placeholder="กรอกอัตโนมัติ" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }} />
        </div>
      </div>
      <div className="form-group">
        <label className="ds-label">รายละเอียดที่อยู่ (บ้านเลขที่ / ถนน / อาคาร)</label>
        <input
          className="ds-input" type="text" value={value.detail || ""}
          onChange={(e) => onChange({ ...value, detail: e.target.value })}
          placeholder="เช่น 99 ถ.บางแก้ว หมู่ 6"
        />
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="ds-label">ลิงก์ Google Maps (ถ้ามี)</label>
        <input
          className="ds-input" type="url" value={value.mapUrl || ""}
          onChange={(e) => onChange({ ...value, mapUrl: e.target.value })}
          placeholder="https://maps.app.goo.gl/..."
        />
        <span className="text-xs text-muted">แนบไว้ให้ทีมช่างเปิดนำทางตรงไปหน้างานได้เลย ไม่ต้องพิมพ์ที่อยู่ค้นหาเอง</span>
      </div>
    </div>
  );
}
