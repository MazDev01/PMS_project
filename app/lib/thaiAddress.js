// Structured Thai address reference data — จังหวัด → อำเภอ/เขต → ตำบล/แขวง (+
// รหัสไปรษณีย์). Scoped to the provinces MACCA actually operates in (matching
// the seeded customer/job sites) plus a couple of common neighbors, rather
// than all 77 provinces / ~7,000 subdistricts — a full national dataset would
// need a real geo-data source, not something to hand-author for a prototype.
// Adding a province/district here is how the coverage grows later.
export const thaiProvinces = [
  {
    name: "กรุงเทพมหานคร",
    districts: [
      { name: "บางเขน", subdistricts: [{ name: "อนุสาวรีย์", zip: "10220" }, { name: "ท่าแร้ง", zip: "10220" }] },
      { name: "จตุจักร", subdistricts: [{ name: "จตุจักร", zip: "10900" }, { name: "ลาดยาว", zip: "10900" }] },
    ],
  },
  {
    name: "สมุทรปราการ",
    districts: [
      { name: "เมืองสมุทรปราการ", subdistricts: [{ name: "เทพารักษ์", zip: "10270" }, { name: "บางปูใหม่", zip: "10280" }] },
      { name: "บางพลี", subdistricts: [{ name: "บางแก้ว", zip: "10540" }, { name: "ราชาเทวะ", zip: "10540" }] },
      { name: "บางเสาธง", subdistricts: [{ name: "ศีรษะจรเข้ใหญ่", zip: "10570" }, { name: "บางเสาธง", zip: "10570" }] },
    ],
  },
  {
    name: "ปทุมธานี",
    districts: [
      { name: "คลองหลวง", subdistricts: [{ name: "คลองสาม", zip: "12120" }, { name: "คลองหนึ่ง", zip: "12120" }] },
      { name: "ธัญบุรี", subdistricts: [{ name: "ประชาธิปัตย์", zip: "12130" }, { name: "รังสิต", zip: "12110" }] },
    ],
  },
  {
    name: "พระนครศรีอยุธยา",
    districts: [
      { name: "บางปะอิน", subdistricts: [{ name: "คลองจิก", zip: "13160" }, { name: "บ้านเลน", zip: "13160" }] },
    ],
  },
  {
    name: "นนทบุรี",
    districts: [
      { name: "เมืองนนทบุรี", subdistricts: [{ name: "สวนใหญ่", zip: "11000" }, { name: "ตลาดขวัญ", zip: "11000" }] },
      { name: "ปากเกร็ด", subdistricts: [{ name: "ปากเกร็ด", zip: "11120" }, { name: "บางพูด", zip: "11120" }] },
    ],
  },
  {
    name: "ชลบุรี",
    districts: [
      { name: "เมืองชลบุรี", subdistricts: [{ name: "บางปลาสร้อย", zip: "20000" }, { name: "มะขามหย่ง", zip: "20000" }] },
      { name: "ศรีราชา", subdistricts: [{ name: "ศรีราชา", zip: "20110" }, { name: "สุรศักดิ์", zip: "20110" }] },
    ],
  },
];

export const EMPTY_ADDRESS = { province: "", district: "", subdistrict: "", postalCode: "", detail: "", mapUrl: "" };

// Bangkok uses แขวง/เขต instead of ตำบล/อำเภอ — a real distinction in Thai
// addressing, not just a label swap for decoration.
export function isBangkok(address) {
  return address?.province === "กรุงเทพมหานคร";
}

// One formatted line for display, e.g. "99 ถ.บางแก้ว ต.บางแก้ว อ.บางพลี สมุทรปราการ 10540"
export function formatAddress(a) {
  if (!a || (!a.detail && !a.province)) return "-";
  const bkk = isBangkok(a);
  const parts = [
    a.detail,
    a.subdistrict && `${bkk ? "แขวง" : "ต."}${a.subdistrict}`,
    a.district && `${bkk ? "เขต" : "อ."}${a.district}`,
    a.province,
    a.postalCode,
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : "-";
}
