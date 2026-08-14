// Centralized mock/demo data for the MACCA PMS UI prototype.
// All dates are anchored around "today" = 2026-07-03 so calendars and
// dashboards read as a live, in-progress operation.
//
// Service categories are grounded in MACCA Light Engineering's real service
// lines (https://www.maccalight.co.th/categorycontent): HVAC & Ventilation,
// Sanitary & Fire Protection, and Electrical & Communication — not the
// literal "lighting" implied by the company name.

import { EMPTY_ADDRESS } from "./thaiAddress";

export const TODAY_ISO = "2026-07-03";

export const jobTypes = [
  { id: "jt1", name: "ติดตั้งระบบปรับอากาศ (HVAC)", count: 42 },
  { id: "jt2", name: "ติดตั้งระบบไฟฟ้าและสื่อสาร", count: 27 },
  { id: "jt3", name: "ติดตั้งระบบสุขาภิบาล", count: 15 },
  { id: "jt4", name: "ติดตั้งระบบป้องกันอัคคีภัย", count: 9 },
  { id: "jt5", name: "ซ่อมบำรุงระบบไฟฟ้า", count: 21 },
  { id: "jt6", name: "ซ่อมบำรุงระบบปรับอากาศ", count: 12 },
];

// Teams no longer store their own member list — membership lives in the
// central `personnel` list below (each person has one teamId), so a technician
// can belong to at most one team at a time. monthlyJobTarget is an
// illustrative per-team target used for the dashboard attainment %.
// A team stores neither its contact number nor its specialty — both are
// DERIVED from its members in the personnel list (contact = lead's phone;
// specialty coverage = the distinct specialties of its members). One source
// of truth, so a team automatically "covers" whatever its members can do.
export const teams = [
  { id: "tm1", name: "ทีมช่างสมชาย", activeJobs: 3, monthlyJobTarget: 5 },
  { id: "tm2", name: "ทีมช่างประเสริฐ", activeJobs: 2, monthlyJobTarget: 4 },
  { id: "tm3", name: "ทีมช่างวิรัตน์", activeJobs: 4, monthlyJobTarget: 5 },
  { id: "tm4", name: "ทีมช่างกิตติ", activeJobs: 1, monthlyJobTarget: 4 },
  { id: "tm5", name: "ทีมช่างณรงค์", activeJobs: 2, monthlyJobTarget: 4 },
  { id: "tm6", name: "ทีมช่างอนุชา", activeJobs: 3, monthlyJobTarget: 5 },
  { id: "tm7", name: "ทีมช่างธีระพงษ์", activeJobs: 2, monthlyJobTarget: 4 },
  { id: "tm8", name: "ทีมช่างสุรศักดิ์", activeJobs: 3, monthlyJobTarget: 5 },
  { id: "tm9", name: "ทีมช่างวัชระ", activeJobs: 2, monthlyJobTarget: 4, onLeave: true },
  { id: "tm10", name: "ทีมช่างพิชิต", activeJobs: 2, monthlyJobTarget: 4 },
];

// Distinct specialties a team covers = the specialties of its members. Pass the
// live personnel list (from the store) so it stays correct as members change.
export function teamCoverage(teamId, people) {
  return [...new Set(people.filter((p) => p.teamId === teamId).map((p) => p.specialty).filter(Boolean))];
}

// Compact labels for specialty badges/tags.
export const specialtyShort = {
  "ระบบปรับอากาศ (HVAC)": "HVAC",
  "ระบบไฟฟ้าและสื่อสาร": "ไฟฟ้า",
  "ระบบสุขาภิบาล": "สุขาภิบาล",
  "ระบบป้องกันอัคคีภัย": "อัคคีภัย",
  "ซ่อมบำรุงทั่วไป": "ซ่อมบำรุง",
};

// Central personnel list — the single source of truth for who is in which
// team. teamId = null means the technician is unassigned (available to add to
// a team); exactly one member per team has lead:true (หัวหน้าช่าง).
const _first = ["อาทิตย์", "ธนา", "วิชัย", "ประยุทธ", "สุชาติ", "มานพ", "บุญมี", "สมพงษ์", "เอกชัย", "ไพศาล", "อนันต์", "ชูเกียรติ"];
const _last = ["ใจกล้า", "มั่นคง", "พากเพียร", "แข็งแรง", "ขยัน", "ตั้งใจ", "สู้งาน", "ว่องไว", "ชำนาญ", "อดทน", "รอบคอบ", "ซื่อสัตย์"];
// [teamId, leadName, size, teamSpecialty]
const _teamSeed = [
  ["tm1", "สมชาย รุ่งเรือง", 4, "ระบบปรับอากาศ (HVAC)"], ["tm2", "ประเสริฐ ศักดิ์สิทธิ์", 3, "ระบบไฟฟ้าและสื่อสาร"], ["tm3", "วิรัตน์ ทองดี", 5, "ระบบสุขาภิบาล"],
  ["tm4", "กิตติ ซ่อมไว", 3, "ซ่อมบำรุงทั่วไป"], ["tm5", "ณรงค์ กล้าหาญ", 4, "ระบบป้องกันอัคคีภัย"], ["tm6", "อนุชา แข็งขัน", 4, "ระบบปรับอากาศ (HVAC)"],
  ["tm7", "ธีระพงษ์ ไฟแรง", 3, "ระบบไฟฟ้าและสื่อสาร"], ["tm8", "สุรศักดิ์ น้ำใส", 5, "ระบบสุขาภิบาล"], ["tm9", "วัชระ ปลอดภัย", 3, "ระบบป้องกันอัคคีภัย"], ["tm10", "พิชิต ทำได้", 4, "ซ่อมบำรุงทั่วไป"],
];
// Each technician stores enough contact detail to actually be reached (phone,
// Line) plus an emergency contact — needed if a tech is a no-show or there's an
// on-site incident. Values are generated deterministically (no Math.random) so
// SSR and client hydration match.
const _emergFirst = ["สมหญิง", "วันเพ็ญ", "ประไพ", "สมศรี", "บุญเรือน", "มาลี", "อารีย์", "ประจวบ"];
const _relations = ["คู่สมรส", "บิดา", "มารดา", "พี่ชาย", "น้องสาว", "ญาติ"];
function _tel(prefix, seed) {
  const mid = String((seed * 37) % 1000).padStart(3, "0");
  const tail = String((seed * 991) % 10000).padStart(4, "0");
  return `${prefix}${seed % 10}-${mid}-${tail}`;
}
function buildPersonnel() {
  const out = [];
  let n = 0;
  const mk = (name, teamId, lead, specialty) => {
    n += 1;
    const surname = name.split(" ")[1] || "";
    return {
      id: `p${n}`, name, teamId, lead, specialty,
      phone: _tel("08", n),
      lineId: `macca.tech${String(n).padStart(2, "0")}`,
      emergencyName: `${_emergFirst[n % _emergFirst.length]} ${surname}`.trim(),
      emergencyRelation: _relations[n % _relations.length],
      emergencyPhone: _tel("09", n * 3 + 1),
    };
  };
  _teamSeed.forEach(([teamId, lead, size, spec]) => {
    out.push(mk(lead, teamId, true, spec));
    for (let i = 1; i < size; i++) {
      // ทีมสมชาย (tm1) มีช่างไฟฟ้า 1 คนปนอยู่ → ทีมนี้จึงครอบคลุม 2 สาย
      // (HVAC + ไฟฟ้า) เป็นตัวอย่างงานที่ต้องใช้ 2 ความเชี่ยวชาญในทีมเดียว
      const memberSpec = teamId === "tm1" && i === size - 1 ? "ระบบไฟฟ้าและสื่อสาร" : spec;
      // firstIdx/lastIdx together encode (n+1) in base-_first.length, so every
      // generated member gets a distinct (first, last) pair up to 144 people
      // — the previous `(n+1)*5 % 12` formula collapsed to a period-12 cycle
      // (both indices were functions of the same `(n+1) mod 12`), producing
      // the same full name for every 12th person (e.g. 4 separate technicians
      // all named "วิชัย รอบคอบ").
      const nameIdx = n + 1;
      out.push(mk(`${_first[nameIdx % _first.length]} ${_last[Math.floor(nameIdx / _first.length) % _last.length]}`, teamId, false, memberSpec));
    }
  });
  // unassigned technicians (available to add) — spread across specialties
  [
    ["ก้องภพ สดใส", "ระบบปรับอากาศ (HVAC)"], ["ธีรเดช ทันใจ", "ระบบไฟฟ้าและสื่อสาร"], ["นพดล ตรงเวลา", "ระบบสุขาภิบาล"],
    ["ภาคิน ว่องไว", "ระบบป้องกันอัคคีภัย"], ["สิทธิชัย รอบรู้", "ซ่อมบำรุงทั่วไป"], ["ยุทธนา แข็งแกร่ง", "ระบบปรับอากาศ (HVAC)"],
  ].forEach(([name, sp]) => {
    out.push(mk(name, null, false, sp));
  });
  return out;
}
export const personnel = buildPersonnel();

// Master list of specialty options — teams pick from this dropdown instead of
// free-typing, so the values stay consistent across the whole system.
export const specialties = [
  "ระบบปรับอากาศ (HVAC)",
  "ระบบไฟฟ้าและสื่อสาร",
  "ระบบสุขาภิบาล",
  "ระบบป้องกันอัคคีภัย",
  "ซ่อมบำรุงทั่วไป",
];

// Maps a job type to the team specialties it genuinely requires — a job can
// need more than one by nature, not just because a coordinator happens to
// assign extra teams. e.g. fire-protection work always involves electrical
// (alarm/suppression control panels & wiring are an electrical job), so it
// requires BOTH specialties, not just "ระบบป้องกันอัคคีภัย" alone.
// Index 0 is the "primary" specialty (used wherever only one is needed, e.g.
// picking the default team). Maintenance ("ซ่อมบำรุง…") jobs go to the
// general-maintenance crews.
export function jobTypeToSpecialties(name = "") {
  if (name.startsWith("ซ่อมบำรุง")) return ["ซ่อมบำรุงทั่วไป"];
  if (name.includes("อัคคีภัย")) return ["ระบบป้องกันอัคคีภัย", "ระบบไฟฟ้าและสื่อสาร"];
  if (name.includes("ปรับอากาศ") || name.includes("HVAC")) return ["ระบบปรับอากาศ (HVAC)"];
  if (name.includes("ไฟฟ้า")) return ["ระบบไฟฟ้าและสื่อสาร"];
  if (name.includes("สุขาภิบาล")) return ["ระบบสุขาภิบาล"];
  return ["ซ่อมบำรุงทั่วไป"];
}

// Backward-compatible single-specialty accessor (primary specialty only).
export function jobTypeToSpecialty(name = "") {
  return jobTypeToSpecialties(name)[0];
}

// `address` is a structured object (จังหวัด/อำเภอ/ตำบล/รหัสไปรษณีย์ + free-text
// detail + optional Google Maps link) rather than one free-text field — see
// app/lib/thaiAddress.js. Use formatAddress() wherever a single display line
// is needed instead of reading customer.address directly.
export const customers = [
  { id: "c1", name: "เทศบาลตำบลบางแก้ว", phone: "02-511-2201", address: { province: "สมุทรปราการ", district: "บางพลี", subdistrict: "บางแก้ว", postalCode: "10540", detail: "99 ถ.บางแก้ว", mapUrl: "" } },
  { id: "c2", name: "บจก. ไทยพัฒนาอุตสาหกรรม", phone: "02-755-9012", address: { province: "สมุทรปราการ", district: "เมืองสมุทรปราการ", subdistrict: "บางปูใหม่", postalCode: "10280", detail: "188 นิคมอุตสาหกรรมบางปู", mapUrl: "" } },
  { id: "c3", name: "อบต. คลองสาม", phone: "02-909-3344", address: { province: "ปทุมธานี", district: "คลองหลวง", subdistrict: "คลองสาม", postalCode: "12120", detail: "45 หมู่ 6", mapUrl: "" } },
  { id: "c4", name: "บจก. สยามอินดัสเตรียล ปาร์ค", phone: "02-234-8871", address: { province: "สมุทรปราการ", district: "เมืองสมุทรปราการ", subdistrict: "เทพารักษ์", postalCode: "10270", detail: "12/5 ถ.เทพารักษ์", mapUrl: "" } },
  { id: "c5", name: "มหาวิทยาลัยราชภัฏพระนคร", phone: "02-544-8000", address: { province: "กรุงเทพมหานคร", district: "บางเขน", subdistrict: "อนุสาวรีย์", postalCode: "10220", detail: "9 ถ.แจ้งวัฒนะ", mapUrl: "" } },
  { id: "c6", name: "บจก. เกรทวอลล์ โลจิสติกส์", phone: "02-771-2200", address: { province: "สมุทรปราการ", district: "บางเสาธง", subdistrict: "ศีรษะจรเข้ใหญ่", postalCode: "10570", detail: "77 ถ.บางนา-ตราด กม.15", mapUrl: "" } },
  { id: "c7", name: "สนามกีฬาเทศบาลนครรังสิต", phone: "02-567-9012", address: { province: "ปทุมธานี", district: "ธัญบุรี", subdistrict: "ประชาธิปัตย์", postalCode: "12130", detail: "1 ถ.รังสิต-นครนายก", mapUrl: "" } },
  { id: "c8", name: "บจก. เอเชีย แพ็คเกจจิ้ง", phone: "02-312-4590", address: { province: "พระนครศรีอยุธยา", district: "บางปะอิน", subdistrict: "คลองจิก", postalCode: "13160", detail: "56 นิคมอุตสาหกรรมบางปะอิน", mapUrl: "" } },
];

// ── Jobs ─────────────────────────────────────────────────────────
const originalJobs = [
  { id: "J-2607-041", customerId: "c1", customer: "เทศบาลตำบลบางแก้ว", jobType: "ติดตั้งระบบปรับอากาศ (HVAC)", status: "in_progress", team: "ทีมช่างสมชาย", createdDate: "2026-06-28", scheduledDate: "2026-07-04", amount: 486000, paymentStatus: "รอชำระ", quotationSigned: true },
  { id: "J-2607-040", customerId: "c2", customer: "บจก. ไทยพัฒนาอุตสาหกรรม", jobType: "ติดตั้งระบบไฟฟ้าและสื่อสาร", status: "in_progress", team: "ทีมช่างประเสริฐ", createdDate: "2026-06-15", scheduledDate: "2026-07-05", amount: 912000, paymentStatus: "รอชำระ", quotationSigned: true },
  { id: "J-2607-039", customerId: "c3", customer: "อบต. คลองสาม", jobType: "ติดตั้งระบบปรับอากาศ (HVAC)", status: "done", team: "ทีมช่างสมชาย", createdDate: "2026-06-27", scheduledDate: "2026-06-29", closedDate: "2026-07-01", amount: 325000, paymentStatus: "ชำระแล้ว", quotationSigned: true },
  { id: "J-2607-038", customerId: "c4", customer: "บจก. สยามอินดัสเตรียล ปาร์ค", jobType: "ติดตั้งระบบสุขาภิบาล", status: "in_progress", team: "ทีมช่างวิรัตน์", teams: ["ทีมช่างวิรัตน์", "ทีมช่างสมชาย"], createdDate: "2026-06-30", scheduledDate: "2026-07-08", amount: 1250000, paymentStatus: "รอชำระ", quotationSigned: true },
  { id: "J-2607-037", customerId: "c5", customer: "มหาวิทยาลัยราชภัฏพระนคร", jobType: "ติดตั้งระบบป้องกันอัคคีภัย", status: "repair", team: "ทีมช่างณรงค์", teams: ["ทีมช่างณรงค์", "ทีมช่างประเสริฐ"], createdDate: "2026-05-10", scheduledDate: "2026-05-25", closedDate: "2026-06-01", amount: 678000, paymentStatus: "ชำระแล้ว", quotationSigned: true },
  { id: "J-2607-036", customerId: "c6", customer: "บจก. เกรทวอลล์ โลจิสติกส์", jobType: "ซ่อมบำรุงระบบไฟฟ้า", status: "done", team: "ทีมช่างกิตติ", createdDate: "2026-05-28", scheduledDate: "2026-06-10", closedDate: "2026-06-15", amount: 540000, paymentStatus: "ชำระแล้ว", quotationSigned: true },
  { id: "J-2607-035", customerId: "c7", customer: "สนามกีฬาเทศบาลนครรังสิต", jobType: "ติดตั้งระบบป้องกันอัคคีภัย", status: "in_progress", team: "ทีมช่างณรงค์", teams: ["ทีมช่างณรงค์", "ทีมช่างประเสริฐ"], createdDate: "2026-06-22", scheduledDate: "2026-07-10", amount: 2140000, paymentStatus: "รอชำระ", quotationSigned: false },
  { id: "J-2607-034", customerId: "c8", customer: "บจก. เอเชีย แพ็คเกจจิ้ง", jobType: "ซ่อมบำรุงระบบปรับอากาศ", status: "in_progress", team: "ทีมช่างกิตติ", createdDate: "2026-07-01", scheduledDate: "2026-07-06", amount: 145000, paymentStatus: "ชำระแล้ว", quotationSigned: true },
  { id: "J-2607-033", customerId: "c1", customer: "เทศบาลตำบลบางแก้ว", jobType: "ซ่อมบำรุงระบบไฟฟ้า", status: "done", team: "ทีมช่างกิตติ", createdDate: "2026-05-20", scheduledDate: "2026-06-01", closedDate: "2026-06-03", amount: 98000, paymentStatus: "ชำระแล้ว", quotationSigned: true },
  { id: "J-2607-032", customerId: "c4", customer: "บจก. สยามอินดัสเตรียล ปาร์ค", jobType: "ติดตั้งระบบสุขาภิบาล", status: "repair", team: "ทีมช่างวิรัตน์", createdDate: "2026-05-02", scheduledDate: "2026-05-18", closedDate: "2026-05-25", amount: 890000, paymentStatus: "ชำระแล้ว", quotationSigned: true },
  // These 4 are referenced by scheduleEvents/warranties/repairTickets below
  // (by jobId) but predate the 032-041 hand-authored range — added so those
  // references resolve to a real job instead of a dangling id.
  { id: "J-2607-030", customerId: "c3", customer: "อบต. คลองสาม", jobType: "ติดตั้งระบบปรับอากาศ (HVAC)", status: "done", team: "ทีมช่างสมชาย", createdDate: "2026-06-15", scheduledDate: "2026-07-01", closedDate: "2026-07-01", amount: 310000, paymentStatus: "ชำระแล้ว", quotationSigned: true },
  { id: "J-2607-031", customerId: "c8", customer: "บจก. เอเชีย แพ็คเกจจิ้ง", jobType: "ซ่อมบำรุงระบบปรับอากาศ", status: "done", team: "ทีมช่างกิตติ", createdDate: "2026-06-20", scheduledDate: "2026-07-02", closedDate: "2026-07-02", amount: 128000, paymentStatus: "ชำระแล้ว", quotationSigned: true },
  { id: "J-2606-901", customerId: "c2", customer: "บจก. ไทยพัฒนาอุตสาหกรรม", jobType: "ติดตั้งระบบไฟฟ้าและสื่อสาร", status: "done", team: "ทีมช่างประเสริฐ", createdDate: "2025-07-20", scheduledDate: "2025-08-05", closedDate: "2025-08-10", amount: 265000, paymentStatus: "ชำระแล้ว", quotationSigned: true },
  { id: "J-2605-771", customerId: "c3", customer: "อบต. คลองสาม", jobType: "ติดตั้งระบบปรับอากาศ (HVAC)", status: "done", team: "ทีมช่างสมชาย", createdDate: "2025-05-15", scheduledDate: "2025-05-28", closedDate: "2025-06-01", amount: 280000, paymentStatus: "ชำระแล้ว", quotationSigned: true },
];

// UTC-based so the same input yields the same output regardless of the
// server's vs the browser's timezone — otherwise the generated job dates
// below could differ between SSR and client render and trip a hydration
// mismatch.
function addDaysISO(iso, days) {
  const [y, m, dd] = iso.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, dd));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Deterministic (no Math.random/Date.now — must render identically on every
// server/client hydration) generator that fills out the job list to dozens
// of rows spread across every team, so dashboards/charts/tables read like a
// real, busy operation instead of only the 10 hand-authored rows above.
function generateJobs(count, startNum) {
  const statusCycle = ["in_progress", "done", "in_progress", "done", "in_progress", "repair", "done", "in_progress", "done", "in_progress", "in_progress", "done"];
  const out = [];
  for (let i = 0; i < count; i++) {
    const customer = customers[i % customers.length];
    const jobType = jobTypes[i % jobTypes.length];
    // Assign teams that actually cover every specialty this job type requires
    // (a fire-protection job needs both an อัคคีภัย team AND an ไฟฟ้า team) —
    // picking one covering team per required specialty, deduped, so the seed
    // data's assignments reflect real capability instead of a single guess.
    const requiredSpecs = jobTypeToSpecialties(jobType.name);
    const assignedTeams = [];
    requiredSpecs.forEach((spec) => {
      const covering = teams.filter((t) => personnel.some((p) => p.teamId === t.id && p.specialty === spec));
      const pick = covering.length ? covering[i % covering.length] : teams[i % teams.length];
      if (!assignedTeams.some((t) => t.id === pick.id)) assignedTeams.push(pick);
    });
    const team = assignedTeams[0];
    const status = statusCycle[i % statusCycle.length];
    const createdOffset = -(15 + ((i * 11) % 165));
    const scheduledOffset = createdOffset + 6 + (i % 12);
    const createdDate = addDaysISO(TODAY_ISO, createdOffset);
    const scheduledDate = addDaysISO(TODAY_ISO, scheduledOffset);
    // Job value grows with recency so monthly revenue (sum of closed-job amounts)
    // trends UPWARD over time — the more recent the job, the larger its value,
    // plus a little per-job texture so months aren't perfectly flat.
    const recencyDays = 180 + createdOffset; // ~1 (oldest) .. ~165 (most recent)
    const amount = 80000 + Math.round(recencyDays / 30) * 60000 + ((i * 17) % 5) * 15000;
    out.push({
      id: `J-2607-${startNum + i}`,
      customerId: customer.id,
      customer: customer.name,
      jobType: jobType.name,
      status,
      team: team.name,
      teams: assignedTeams.map((t) => t.name),
      createdDate,
      scheduledDate,
      ...(status !== "in_progress" ? { closedDate: addDaysISO(scheduledDate, 2 + (i % 5)) } : {}),
      amount,
      paymentStatus: status === "done" ? "ชำระแล้ว" : (i % 3 === 0 ? "ชำระแล้ว" : "รอชำระ"),
      quotationSigned: i % 6 !== 0,
    });
  }
  return out;
}

// docsComplete = "เอกสารหน้างานครบตามมาตรฐาน" (รูปก่อน/ระหว่าง/หลัง + เซ็นมอบ).
// A real PMS concept (Field Execution Quality) — most completed jobs have
// full docs, a minority don't (surfaced as a dispute-risk metric on the
// executive dashboard). Deterministic by index so it's hydration-stable.
function withDocs(list) {
  return list.map((j, i) => ({
    ...j,
    docsComplete:
      j.status === "done" || j.status === "repair" ? i % 7 !== 0 : i % 5 === 0,
  }));
}

// A job can be handled by more than one team (e.g. work needing two
// specialties). `teams` is the full list (first = primary team, kept in `team`
// for everywhere that shows a single team). Normalise so every job has both.
function withTeams(list) {
  return list.map((j) => {
    const teamList = j.teams && j.teams.length ? j.teams : [j.team];
    return { ...j, teams: teamList, team: teamList[0] };
  });
}

// A job's site address (where the crew actually goes) is its own structured
// address — same shape as a customer's, but can differ (e.g. install site vs.
// the customer's head-office billing address). Existing jobs default to the
// customer's address (the common case); only overridden when a coordinator
// sets a different site address on the job form.
function withSiteAddress(list) {
  return list.map((j) => {
    if (j.siteAddress) return j;
    const customer = customers.find((c) => c.id === j.customerId);
    return { ...j, siteAddress: customer ? { ...customer.address } : { ...EMPTY_ADDRESS } };
  });
}

// A job's on-site time window, used to detect whether an assigned team is
// double-booked. Deterministic 3-way cycle (full day / morning / afternoon) so
// the same team can legitimately have two jobs on one date without a real
// conflict — exercising the overlap check with realistic variety instead of
// every job silently defaulting to "all day busy".
const TIME_WINDOWS = [["08:30", "16:00"], ["08:30", "12:00"], ["13:00", "17:00"]];
function withTimes(list) {
  return list.map((j, i) => {
    if (j.startTime && j.endTime) return j;
    const [startTime, endTime] = TIME_WINDOWS[i % TIME_WINDOWS.length];
    return { ...j, startTime, endTime };
  });
}

// Ground truth for who actually does a job is a small crew of individuals —
// one lead + any number of members — not a whole team. `team`/`teams` above
// stay as convenience fields so existing team-level reports keep working;
// `crew` is derived from them here for the 55 seed jobs, and is what drives
// contractor "my jobs" and per-person availability checks going forward (new
// jobs set `crew` directly when the coordinator picks people).
//
// leadId always comes from `p.lead` — the team's designated supervisor — not
// from whoever happens to hold a required specialty. That designation is
// managed in Admin → Master Data, not picked ad hoc per job.
function withCrew(list) {
  return list.map((j) => {
    if (j.crew) return j;
    const teamNames = j.teams && j.teams.length ? j.teams : [j.team];
    const involvedTeams = teamNames.map((tn) => teams.find((t) => t.name === tn)).filter(Boolean);
    const involvedTeamIds = new Set(involvedTeams.map((t) => t.id));
    const pool = personnel.filter((p) => involvedTeamIds.has(p.teamId));

    const leadId = pool.find((p) => p.lead)?.id || null;
    const memberIds = [];
    // Walk the job's actual required specialties (not just "this team's
    // lead") so a mixed-specialty team's borrowed skill comes from whoever on
    // that team actually holds it — e.g. tm1's one electrical member, not
    // its HVAC lead — instead of silently dropping that coverage.
    jobTypeToSpecialties(j.jobType).forEach((spec) => {
      const already = [leadId, ...memberIds].some((id) => personnel.find((p) => p.id === id)?.specialty === spec);
      if (already) return;
      const candidate = pool.find((p) => p.specialty === spec && p.id !== leadId && !memberIds.includes(p.id));
      if (candidate) memberIds.push(candidate.id);
    });
    // Fill any remaining crew slots with other members of the involved teams
    // so the crew reads like a real multi-person team, not just the bare
    // minimum specialists.
    pool.forEach((p) => {
      if (p.id === leadId || memberIds.includes(p.id)) return;
      memberIds.push(p.id);
    });
    return { ...j, crew: { leadId, memberIds } };
  });
}

// Deterministic small integer from a string id (no Math.random — must render
// identically on every server/client hydration, same constraint as the rest
// of this generator). Used only to give synthetic performance-analytics
// fields (below) a stable, non-repeating-looking spread across jobs/teams.
function seedFromId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  return h;
}

const COORDINATOR_IDS = ["U-01", "U-02", "U-13"]; // the 3 active coordinator staffUsers

// Every job is owned by exactly one coordinator (who opened/manages it) —
// the hand-authored seed rows above don't set this, so it's assigned by
// index here, the same pattern as withTeams/withDocs.
function withCoordinator(list) {
  return list.map((j, i) => (j.coordinatorId ? j : { ...j, coordinatorId: COORDINATOR_IDS[i % COORDINATOR_IDS.length] }));
}

// Synthetic per-job quality signals that feed the Coordinator Performance
// View (Section 3: quotation revisions, undone follow-ups) and the Field
// Team view (customer satisfaction). Deterministic by job id.
function withPerfMetrics(list) {
  return list.map((j) => {
    const seed = seedFromId(j.id);
    return {
      ...j,
      quotationRevisions: seed % 4, // ครั้งที่ต้องแก้ใบเสนอราคาซ้ำ
      customerFollowUps: Math.floor(seed / 4) % 5, // ครั้งที่ลูกค้าต้อง follow-up เอง
      customerRating: j.status === "done" ? Math.round((3.4 + ((seed % 17) / 17) * 1.6) * 10) / 10 : null,
    };
  });
}

// poUploaded = the customer's signed PO / signed quotation is on file for the
// job. It's attached right after the customer signs the quotation (to brief
// procurement on what to buy and sync the file to Mango) — so any job whose
// quote is already signed has it on file; a freshly opened job whose quote
// isn't signed yet has none.
function withPO(list) {
  return list.map((j) => ({ ...j, poUploaded: !!j.quotationSigned }));
}

export const jobs = withPO(withPerfMetrics(withCoordinator(withDocs(withCrew(withTeams(withSiteAddress(withTimes([...originalJobs, ...generateJobs(45, 100)]))))))));

// ── Completed-job artifacts (photos + document trail) ────────────
// A finished job in a real deployment carries a full evidence trail — before/
// during/after site photos the crew uploaded, a signed delivery note, and the
// Mango document flow. The prototype seeds all of that for every done/repair
// job so users can open a completed job and see exactly what the system keeps
// on file. Photos are self-contained inline SVG placeholders (no backend), so
// they render identically on server and client (no Math.random — hydration-safe).
function photoPlaceholder(label, jobId) {
  const hue = { "ก่อนทำ": 210, "ขณะทำ": 40, "หลังทำ": 150 }[label] ?? 210;
  const svg = [
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>`,
    `<rect width='200' height='200' fill='hsl(${hue},40%,90%)'/>`,
    `<rect x='72' y='42' width='56' height='11' rx='4' fill='hsl(${hue},35%,50%)'/>`,
    `<circle cx='100' cy='82' r='30' fill='none' stroke='hsl(${hue},35%,50%)' stroke-width='5'/>`,
    `<circle cx='100' cy='82' r='13' fill='hsl(${hue},35%,50%)'/>`,
    `<rect x='0' y='150' width='200' height='50' fill='hsl(${hue},38%,30%)'/>`,
    `<text x='100' y='176' font-family='sans-serif' font-size='20' font-weight='bold' text-anchor='middle' fill='white'>${label}</text>`,
    `<text x='100' y='193' font-family='sans-serif' font-size='11' text-anchor='middle' fill='hsl(${hue},25%,82%)'>${jobId}</text>`,
    `</svg>`,
  ].join("");
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildSeedUploads(jobList, staffList) {
  const map = {};
  jobList.forEach((j) => {
    if (j.status !== "done" && j.status !== "repair") return;
    const lead = staffList.find((p) => p.id === j.crew?.leadId);
    const member = (j.crew?.memberIds || []).map((id) => staffList.find((p) => p.id === id)).find(Boolean);
    const by = lead?.name || "ทีมช่าง";
    const by2 = member?.name || by;
    const shot = (label, uploadedBy) => ({ url: photoPlaceholder(label, j.id), uploadedBy });
    map[j.id] = {
      before: [shot("ก่อนทำ", by), shot("ก่อนทำ", by2)],
      during: [shot("ขณะทำ", by2), shot("ขณะทำ", by)],
      after: [shot("หลังทำ", by), shot("หลังทำ", by2)],
      deliveryFileName: `ใบส่งมอบงาน-${j.id}.pdf`,
      sentToCoordinator: true,
      signedOff: true,
    };
  });
  return map;
}

export const seedUploads = buildSeedUploads(jobs, personnel);

// The canonical document flow a completed job accumulates in Mango. The detail
// page merges any real (hand-authored) sync rows with the missing standard
// documents so every finished job shows a complete, in-order trail — while the
// Mango activity feed keeps only the real, recent rows.
const STANDARD_DOC_FLOW = [
  { key: "quote", docType: "ใบเสนอราคา", direction: "push", dateField: "createdDate", time: "09:00:00" },
  { key: "po", docType: "PO/ใบสั่งจ้าง", direction: "pull", dateField: "createdDate", time: "14:30:00" },
  { key: "delivery", docType: "ใบส่งมอบงาน", direction: "push", dateField: "closedDate", time: "16:00:00" },
  { key: "invoice", docType: "ใบแจ้งหนี้", direction: "push", dateField: "closedDate", time: "16:30:00" },
  { key: "payment", docType: "สถานะชำระเงิน", direction: "pull", dateField: "closedDate", time: "17:15:00" },
];

export function getJobDocumentTrail(job, syncList = syncStatus) {
  const real = syncList.filter((s) => s.jobId === job.id);
  if (job.status !== "done" && job.status !== "repair") return real;
  const have = new Set(real.map((s) => s.docType));
  const synth = STANDARD_DOC_FLOW.filter((d) => !have.has(d.docType)).map((d) => ({
    id: `${job.id}-DOC-${d.key}`,
    docType: d.docType,
    customer: job.customer,
    jobId: job.id,
    direction: d.direction,
    status: "success",
    timestamp: `${job[d.dateField] || job.closedDate || job.scheduledDate}T${d.time}`,
  }));
  return [...real, ...synth].sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
}

// Distinct specialties covered by a set of technician ids — same idea as
// teamCoverage, but for an ad-hoc job crew rather than a whole team.
export function crewCoverage(personIds, people) {
  return [...new Set(personIds.map((id) => people.find((p) => p.id === id)?.specialty).filter(Boolean))];
}

// Jobs where this technician is part of the crew (lead or member) — the
// "assigned to me" set that drives the contractor mobile app.
export function personJobs(personId, jobList) {
  if (!personId) return [];
  return jobList.filter((j) => j.crew && (j.crew.leadId === personId || j.crew.memberIds.includes(personId)));
}

// Role-based visibility for the coordinator pages: a coordinator only sees the
// jobs THEY own (job.coordinatorId === their userId); an admin/executive sees
// everything (they use these same pages to oversee all coordinators' work).
// This is the coordinator-side twin of personJobs (which scopes the
// contractor app to one technician).
export function scopeJobsToSession(jobList, session) {
  if (session?.role === "coordinator" && session?.userId) {
    return jobList.filter((j) => j.coordinatorId === session.userId);
  }
  return jobList;
}

export function isJobLead(personId, job) {
  return !!(personId && job?.crew?.leadId === personId);
}

function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
export function timesOverlap(aStart, aEnd, bStart, bEnd) {
  const as = timeToMinutes(aStart), ae = timeToMinutes(aEnd), bs = timeToMinutes(bStart), be = timeToMinutes(bEnd);
  if (as == null || ae == null || bs == null || be == null) return true;
  return as < be && bs < ae;
}

// Is this technician already committed to other active work on the same date
// with an overlapping time window? Flags genuine double-bookings instead of
// silently allowing them when assembling a job's crew.
export function personConflict(personId, date, startTime, endTime, jobList, excludeJobId) {
  if (!personId || !date) return null;
  return jobList.find((j) => {
    if (excludeJobId && j.id === excludeJobId) return false;
    // "repair" means the original visit already happened and this is a
    // later warranty/complaint entry against it (see buildJobTimeline's
    // isDone) — its scheduledDate no longer represents a slot the crew is
    // actually occupying, so it must be excluded exactly like "done".
    if (j.status === "done" || j.status === "repair") return false;
    if (j.scheduledDate !== date) return false;
    if (!j.crew || (j.crew.leadId !== personId && !j.crew.memberIds.includes(personId))) return false;
    return timesOverlap(startTime, endTime, j.startTime, j.endTime);
  }) || null;
}

export function jobStatusLabel(status) {
  return { in_progress: "กำลังดำเนินการ", done: "เสร็จสิ้นแล้ว", repair: "แจ้งซ่อม" }[status] || status;
}
export function jobStatusBadgeClass(status) {
  return { in_progress: "badge-warning", done: "badge-success", repair: "badge-destructive" }[status] || "badge-secondary";
}

export function getJobById(id) {
  return jobs.find((j) => j.id === id);
}

// ── Job detail: lifecycle timeline ──────────────────────────────
// Canonical step order for a normal (non-repair) job. Each job's progress
// through these steps is derived from its existing status/date fields
// rather than hand-authored per row, so it stays consistent with the
// simple 3-state status used for filters/badges elsewhere.
export const JOB_LIFECYCLE = [
  { key: "new", label: "เปิดงานใหม่" },
  { key: "quoted", label: "ส่งใบเสนอราคา" },
  { key: "approved", label: "ลูกค้าอนุมัติ / เซ็นใบเสนอราคา" },
  { key: "scheduling", label: "จัดทีมและนัดหมายวันเข้างาน" },
  { key: "in_progress", label: "เข้าดำเนินการหน้างาน" },
  { key: "delivered", label: "ส่งมอบงาน" },
  { key: "billing", label: "ออกใบแจ้งหนี้" },
  { key: "paid", label: "รับชำระเงิน" },
  { key: "closed", label: "ปิดงาน" },
];

export function buildJobTimeline(job) {
  const isDone = job.status === "done" || job.status === "repair";
  let completedCount;
  if (isDone) completedCount = JOB_LIFECYCLE.length;
  else if (job.status === "in_progress") completedCount = job.quotationSigned ? 5 : 2;
  else completedCount = 1;

  const steps = JOB_LIFECYCLE.map((step, i) => {
    const done = i < completedCount;
    let at = null;
    if (i === 0) at = job.createdDate;
    else if (step.key === "scheduling" || step.key === "in_progress") at = done ? job.scheduledDate : null;
    else if (["delivered", "billing", "paid", "closed"].includes(step.key)) at = done ? job.closedDate || job.scheduledDate : null;
    else if (done) at = job.createdDate;
    return { ...step, done, at, current: !isDone && i === completedCount - 1 };
  });

  if (job.status === "repair") {
    steps.push({ key: "repair", label: "แจ้งซ่อม / เคลมประกัน", done: true, at: job.closedDate, current: true });
  }
  return steps;
}

// Quotation line items are derived from the job's total amount rather than
// hand-authored per job — keeps the total on the detail page consistent
// with the amount shown everywhere else (job list, dashboards).
export function getJobLineItems(job) {
  const isRepairType = job.jobType.startsWith("ซ่อมบำรุง");
  return [
    { id: `${job.id}-item1`, description: job.jobType, qty: 1, unitPrice: job.amount, warrantyMonths: isRepairType ? 6 : 12 },
  ];
}

// Quotations (and the other accounting documents) are authored in Mango, not in
// this PMS — the PMS only pulls them in via sync. So "แก้ไขใบเสนอราคา" is a deep
// link OUT to the Mango web app for that job, where the coordinator revises the
// quote; the updated figure then syncs back. (Web app URL, distinct from the
// API endpoint shown on the Mango settings page.)
export const MANGO_WEB_URL = "https://app.mango.co.th";
export function mangoQuotationUrl(job) {
  if (!job) return MANGO_WEB_URL;
  return `${MANGO_WEB_URL}/quotations?ref=${encodeURIComponent(job.id)}&customer=${encodeURIComponent(job.customer || "")}`;
}

export function getJobDocuments(jobId, syncList = syncStatus) {
  return syncList.filter((s) => s.jobId === jobId);
}

// ── Job scheduling / calendar events ────────────────────────────
export const scheduleEvents = [
  { date: "2026-07-01", jobId: "J-2607-030", title: "ติดตั้งระบบปรับอากาศ - อบต.คลองสาม", team: "ทีมช่างสมชาย", status: "done" },
  { date: "2026-07-02", jobId: "J-2607-031", title: "ซ่อมบำรุง - เอเชียแพ็คเกจจิ้ง", team: "ทีมช่างกิตติ", status: "done" },
  { date: "2026-07-03", jobId: "J-2607-034", title: "ตรวจวัสดุ - เอเชียแพ็คเกจจิ้ง", team: "ทีมช่างกิตติ", status: "confirmed" },
  { date: "2026-07-04", jobId: "J-2607-041", title: "ติดตั้งระบบปรับอากาศ - เทศบาลบางแก้ว", team: "ทีมช่างสมชาย", status: "confirmed" },
  { date: "2026-07-05", jobId: "J-2607-040", title: "ติดตั้งระบบไฟฟ้าและสื่อสาร - ไทยพัฒนาฯ", team: "ทีมช่างประเสริฐ", status: "confirmed" },
  { date: "2026-07-06", jobId: "J-2607-034", title: "ซ่อมบำรุง - เอเชียแพ็คเกจจิ้ง", team: "ทีมช่างกิตติ", status: "confirmed" },
  { date: "2026-07-08", jobId: "J-2607-038", title: "ติดตั้งระบบสุขาภิบาล - สยามอินดัสเตรียล", team: "ทีมช่างวิรัตน์", status: "confirmed" },
  { date: "2026-07-09", jobId: "J-2607-038", title: "ติดตั้งระบบสุขาภิบาล (ต่อ)", team: "ทีมช่างวิรัตน์", status: "pending" },
  { date: "2026-07-10", jobId: "J-2607-035", title: "ติดตั้งระบบป้องกันอัคคีภัย - รังสิต", team: "ทีมช่างณรงค์", status: "confirmed" },
  { date: "2026-07-11", jobId: "J-2607-035", title: "ติดตั้งระบบป้องกันอัคคีภัย (ต่อ)", team: "ทีมช่างณรงค์", status: "pending" },
  // No jobId: this is a pre-sales site survey for a prospective customer, so
  // there is no job record yet — the UI must not link/lookup a job for it.
  { date: "2026-07-14", jobId: null, title: "สำรวจหน้างาน - ลูกค้าใหม่", team: "ทีมช่างประเสริฐ", status: "pending" },
  { date: "2026-07-03", jobId: "J-2607-105", title: "ซ่อมบำรุงระบบปรับอากาศ - เกรทวอลล์ โลจิสติกส์", team: "ทีมช่างอนุชา", status: "confirmed" },
  { date: "2026-07-03", jobId: "J-2607-108", title: "ตรวจระบบแจ้งเหตุเพลิงไหม้ - เทศบาลบางแก้ว", team: "ทีมช่างวัชระ", status: "confirmed" },
  { date: "2026-07-04", jobId: "J-2607-107", title: "ซ่อมท่อสุขาภิบาล - เอเชีย แพ็คเกจจิ้ง", team: "ทีมช่างสุรศักดิ์", status: "confirmed" },
  { date: "2026-07-04", jobId: "J-2607-109", title: "ตรวจตู้ควบคุมไฟฟ้า - ไทยพัฒนาอุตสาหกรรม", team: "ทีมช่างพิชิต", status: "pending" },
  { date: "2026-07-05", jobId: "J-2607-112", title: "ติดตั้งระบบไฟฟ้าสำรอง - สนามกีฬานครรังสิต", team: "ทีมช่างธีระพงษ์", status: "confirmed" },
  { date: "2026-07-05", jobId: "J-2607-100", title: "ติดตั้งระบบปรับอากาศ - เทศบาลบางแก้ว", team: "ทีมช่างสมชาย", status: "confirmed" },
  { date: "2026-07-06", jobId: "J-2607-103", title: "ติดตั้งระบบสุขาภิบาล - อบต.คลองสาม", team: "ทีมช่างวิรัตน์", status: "pending" },
  { date: "2026-07-07", jobId: "J-2607-111", title: "ตรวจสอบระบบสุขาภิบาล - สยามอินดัสเตรียล", team: "ทีมช่างสุรศักดิ์", status: "pending" },
];

// ── Link generator ───────────────────────────────────────────────
// `token` is the only thing the guest-facing pages (app/guest/quotation,
// confirm, signoff) actually resolve a job from — never the link `id` or a
// hardcoded job. Keep every token unique and stable so a link, once handed
// to a customer, keeps working.
export const generatedLinks = [
  { id: "LK-1042", token: "7f3a1c2d9e", type: "quotation", label: "ใบเสนอราคา", jobId: "J-2607-041", customer: "เทศบาลตำบลบางแก้ว", createdAt: "2026-07-02T10:20:00", expiresAt: "2026-07-09T23:59:00", status: "active" },
  { id: "LK-1041", token: "4b8d2f61a3", type: "plan", label: "แผนงาน", jobId: "J-2607-040", customer: "บจก. ไทยพัฒนาอุตสาหกรรม", createdAt: "2026-07-01T14:05:00", expiresAt: "2026-07-08T23:59:00", status: "active" },
  { id: "LK-1040", token: "9c1e7a4d05", type: "delivery", label: "ใบส่งมอบงาน", jobId: "J-2607-036", customer: "บจก. เกรทวอลล์ โลจิสติกส์", createdAt: "2026-06-14T09:00:00", expiresAt: "2026-06-21T23:59:00", status: "expired" },
  { id: "LK-1039", token: "2d5f9b3e18", type: "quotation", label: "ใบเสนอราคา", jobId: "J-2607-035", customer: "สนามกีฬาเทศบาลนครรังสิต", createdAt: "2026-06-23T11:30:00", expiresAt: "2026-06-30T23:59:00", status: "revoked" },
  { id: "LK-1038", token: "e61a4c8f72", type: "delivery", label: "ใบส่งมอบงาน", jobId: "J-2607-039", customer: "อบต. คลองสาม", createdAt: "2026-06-27T16:00:00", expiresAt: "2026-07-04T23:59:00", status: "active" },
  { id: "LK-1037", token: "038d6f1b9a", type: "quotation", label: "ใบเสนอราคา", jobId: "J-2607-105", customer: "บจก. เกรทวอลล์ โลจิสติกส์", createdAt: "2026-06-30T09:15:00", expiresAt: "2026-07-07T23:59:00", status: "active" },
  { id: "LK-1036", token: "af729d4e0c", type: "plan", label: "แผนงาน", jobId: "J-2607-108", customer: "เทศบาลตำบลบางแก้ว", createdAt: "2026-06-29T13:40:00", expiresAt: "2026-07-06T23:59:00", status: "active" },
];

// ── Warranty & Maintenance ───────────────────────────────────────
export const warranties = [
  { id: "W-901", customer: "อบต. คลองสาม", jobId: "J-2607-039", months: 24, startDate: "2026-06-28", endDate: "2028-06-28", status: "active", percentLeft: 96 },
  { id: "W-900", customer: "บจก. เกรทวอลล์ โลจิสติกส์", jobId: "J-2607-036", months: 12, startDate: "2026-06-15", endDate: "2027-06-15", status: "active", percentLeft: 96 },
  { id: "W-899", customer: "เทศบาลตำบลบางแก้ว", jobId: "J-2607-033", months: 12, startDate: "2026-06-03", endDate: "2027-06-03", status: "active", percentLeft: 94 },
  { id: "W-874", customer: "มหาวิทยาลัยราชภัฏพระนคร", jobId: "J-2607-037", months: 24, startDate: "2026-06-01", endDate: "2028-06-01", status: "active", percentLeft: 96 },
  { id: "W-820", customer: "บจก. สยามอินดัสเตรียล ปาร์ค", jobId: "J-2607-032", months: 24, startDate: "2025-05-25", endDate: "2027-05-25", status: "active", percentLeft: 42 },
  { id: "W-611", customer: "บจก. ไทยพัฒนาอุตสาหกรรม", jobId: "J-2606-901", months: 12, startDate: "2025-08-10", endDate: "2026-08-10", status: "active", percentLeft: 9 },
  { id: "W-455", customer: "อบต. คลองสาม", jobId: "J-2605-771", months: 12, startDate: "2025-06-01", endDate: "2026-06-01", status: "expired", percentLeft: 0 },
];

export const repairTickets = [
  { id: "RT-233", customer: "มหาวิทยาลัยราชภัฏพระนคร", jobId: "J-2607-037", issue: "ระบบแจ้งเตือนอัคคีภัยโซน B ขัดข้อง 6 จุด หลังฝนตกหนัก", priority: "high", status: "open", reportedDate: "2026-07-01", team: "ทีมช่างณรงค์" },
  { id: "RT-232", customer: "บจก. สยามอินดัสเตรียล ปาร์ค", jobId: "J-2607-032", issue: "ปั๊มน้ำระบบสุขาภิบาลแถว 3 แรงดันตก ต้องตรวจสอบมอเตอร์ปั๊ม", priority: "medium", status: "in_progress", reportedDate: "2026-06-27", team: "ทีมช่างวิรัตน์" },
  { id: "RT-231", customer: "อบต. คลองสาม", jobId: "J-2605-771", issue: "เครื่องปรับอากาศชั้น 2 ห้อง 14 น้ำยาแอร์รั่ว คาดว่าท่อทองแดงชำรุด", priority: "high", status: "closed", reportedDate: "2026-06-10", team: "ทีมช่างสมชาย" },
  { id: "RT-230", customer: "บจก. เกรทวอลล์ โลจิสติกส์", jobId: "J-2607-105", issue: "เครื่องปรับอากาศระบบ HVAC ห้องเซิร์ฟเวอร์เสียงดังผิดปกติ", priority: "medium", status: "open", reportedDate: "2026-06-29", team: "ทีมช่างอนุชา" },
  { id: "RT-229", customer: "บจก. เอเชีย แพ็คเกจจิ้ง", jobId: "J-2607-107", issue: "ท่อสุขาภิบาลรั่วซึมบริเวณห้องน้ำชั้น 3", priority: "low", status: "in_progress", reportedDate: "2026-06-25", team: "ทีมช่างสุรศักดิ์" },
  { id: "RT-228", customer: "เทศบาลตำบลบางแก้ว", jobId: "J-2607-108", issue: "ระบบสัญญาณแจ้งเหตุเพลิงไหม้ทดสอบแล้วไม่ดัง 2 จุด", priority: "high", status: "open", reportedDate: "2026-06-22", team: "ทีมช่างวัชระ" },
  { id: "RT-227", customer: "บจก. ไทยพัฒนาอุตสาหกรรม", jobId: "J-2607-109", issue: "ตู้ควบคุมไฟฟ้าหลักมีเสียงผิดปกติ ต้องตรวจสอบเบรกเกอร์", priority: "medium", status: "closed", reportedDate: "2026-06-05", team: "ทีมช่างพิชิต" },
  { id: "RT-226", customer: "สนามกีฬาเทศบาลนครรังสิต", jobId: "J-2607-112", issue: "ระบบไฟฟ้าสำรองฉุกเฉินไม่ทำงานอัตโนมัติ", priority: "high", status: "open", reportedDate: "2026-06-30", team: "ทีมช่างธีระพงษ์" },
];

// Simulated inbound customer actions from the guest links, so a coordinator
// sees real "what happens next" cases in their notification bell on day one:
// a reschedule request (carries the new date/time + reason) and a quotation
// rejection (carries the reason to revise). The live guest pages fire the same
// shape via addNotification when a real customer reschedules/rejects.
export const seedNotifications = [
  {
    id: "N-seed-reschedule",
    audience: "coordinator",
    unread: true,
    time: `${TODAY_ISO}T09:15:00`,
    title: "ลูกค้าขอเลื่อนนัดหมาย",
    detail: "J-2607-041 — เทศบาลตำบลบางแก้ว · ขอวันใหม่ 10 ก.ค. 2569 เวลา 13:00-17:00 น. · ช่วงเช้าติดประชุมสภา",
  },
  {
    id: "N-seed-reject",
    audience: "coordinator",
    unread: true,
    time: `${TODAY_ISO}T08:40:00`,
    title: "ลูกค้าปฏิเสธ / ขอแก้ไขใบเสนอราคา",
    detail: "J-2607-040 — บจก. ไทยพัฒนาอุตสาหกรรม · ราคาสูงกว่างบ ขอปรับสเปกคอมเพรสเซอร์และเสนอราคาใหม่",
  },
];

// ── Mango sync status ────────────────────────────────────────────
export const syncStatus = [
  { id: "SY-501", docType: "ใบแจ้งทำราคา", customer: "เทศบาลตำบลบางแก้ว", jobId: "J-2607-041", direction: "push", status: "success", timestamp: "2026-07-03T08:12:00" },
  { id: "SY-500", docType: "ใบเสนอราคา", customer: "บจก. ไทยพัฒนาอุตสาหกรรม", jobId: "J-2607-040", direction: "pull", status: "success", timestamp: "2026-07-03T07:50:00" },
  { id: "SY-499", docType: "PO/ใบสั่งจ้าง", customer: "บจก. สยามอินดัสเตรียล ปาร์ค", jobId: "J-2607-038", direction: "pull", status: "pending", timestamp: "2026-07-03T07:40:00" },
  { id: "SY-498", docType: "ใบส่งมอบงาน", customer: "สนามกีฬาเทศบาลนครรังสิต", jobId: "J-2607-035", direction: "push", status: "failed", timestamp: "2026-07-02T18:22:00" },
  { id: "SY-497", docType: "สถานะชำระเงิน", customer: "อบต. คลองสาม", jobId: "J-2607-039", direction: "pull", status: "success", timestamp: "2026-07-02T16:05:00" },
  { id: "SY-496", docType: "ใบเสนอราคา", customer: "บจก. เอเชีย แพ็คเกจจิ้ง", jobId: "J-2607-034", direction: "push", status: "success", timestamp: "2026-07-02T11:47:00" },
  { id: "SY-495", docType: "ใบเสนอราคา", customer: "บจก. เกรทวอลล์ โลจิสติกส์", jobId: "J-2607-105", direction: "push", status: "success", timestamp: "2026-07-02T10:30:00" },
  { id: "SY-494", docType: "สถานะชำระเงิน", customer: "เทศบาลตำบลบางแก้ว", jobId: "J-2607-108", direction: "pull", status: "success", timestamp: "2026-07-02T09:55:00" },
  { id: "SY-493", docType: "PO/ใบสั่งจ้าง", customer: "บจก. ไทยพัฒนาอุตสาหกรรม", jobId: "J-2607-109", direction: "pull", status: "success", timestamp: "2026-07-02T09:10:00" },
  { id: "SY-492", docType: "ใบส่งมอบงาน", customer: "บจก. เอเชีย แพ็คเกจจิ้ง", jobId: "J-2607-107", direction: "push", status: "failed", timestamp: "2026-07-01T17:40:00" },
  { id: "SY-491", docType: "ใบแจ้งทำราคา", customer: "สนามกีฬาเทศบาลนครรังสิต", jobId: "J-2607-112", direction: "push", status: "success", timestamp: "2026-07-01T15:20:00" },
  { id: "SY-490", docType: "ใบเสนอราคา", customer: "อบต. คลองสาม", jobId: "J-2607-103", direction: "pull", status: "success", timestamp: "2026-07-01T11:05:00" },
  { id: "SY-489", docType: "สถานะชำระเงิน", customer: "บจก. สยามอินดัสเตรียล ปาร์ค", jobId: "J-2607-111", direction: "pull", status: "pending", timestamp: "2026-07-01T08:50:00" },
  { id: "SY-488", docType: "PO/ใบสั่งจ้าง", customer: "มหาวิทยาลัยราชภัฏพระนคร", jobId: "J-2607-116", direction: "pull", status: "success", timestamp: "2026-06-30T16:15:00" },
  { id: "SY-487", docType: "ใบส่งมอบงาน", customer: "เทศบาลตำบลบางแก้ว", jobId: "J-2607-100", direction: "push", status: "success", timestamp: "2026-06-30T14:00:00" },
  { id: "SY-486", docType: "ใบแจ้งทำราคา", customer: "บจก. ไทยพัฒนาอุตสาหกรรม", jobId: "J-2607-101", direction: "push", status: "success", timestamp: "2026-06-30T10:40:00" },
];

// ── Admin: users ─────────────────────────────────────────────────
export const staffUsers = [
  { id: "U-01", name: "นภัสสร ใจดี", role: "coordinator", email: "napassorn@maccalight.co.th", phone: "081-555-0101", status: "active", lastLogin: "2026-07-03T08:05:00" },
  { id: "U-02", name: "ธนกร วงศ์สวัสดิ์", role: "coordinator", email: "thanakorn@maccalight.co.th", phone: "081-555-0102", status: "active", lastLogin: "2026-07-02T17:40:00" },
  { id: "U-03", name: "สมชาย รุ่งเรือง", role: "contractor", email: "somchai.team@maccalight.co.th", phone: "081-234-5671", status: "active", lastLogin: "2026-07-03T07:12:00" },
  { id: "U-04", name: "ประเสริฐ ศักดิ์สิทธิ์", role: "contractor", email: "prasert.team@maccalight.co.th", phone: "081-234-5672", status: "active", lastLogin: "2026-07-03T06:55:00" },
  { id: "U-05", name: "วิรัตน์ ทองดี", role: "contractor", email: "wirat.team@maccalight.co.th", phone: "081-234-5673", status: "active", lastLogin: "2026-07-02T15:20:00" },
  { id: "U-06", name: "กิตติ ซ่อมไว", role: "contractor", email: "kitti.team@maccalight.co.th", phone: "081-234-5674", status: "disabled", lastLogin: "2026-06-20T09:00:00" },
  { id: "U-07", name: "ปุสิทธิ์ นันทวงศ์", role: "admin", email: "pusitt.n@mazmaker.com", phone: "099-136-8998", status: "active", lastLogin: "2026-07-03T09:00:00" },
  { id: "U-08", name: "อนุชา แข็งขัน", role: "contractor", email: "anucha.team@maccalight.co.th", phone: "081-234-5676", status: "active", lastLogin: "2026-07-03T07:20:00" },
  { id: "U-09", name: "ธีระพงษ์ ไฟแรง", role: "contractor", email: "teerapong.team@maccalight.co.th", phone: "081-234-5677", status: "active", lastLogin: "2026-07-02T16:10:00" },
  { id: "U-10", name: "สุรศักดิ์ น้ำใส", role: "contractor", email: "surasak.team@maccalight.co.th", phone: "081-234-5678", status: "active", lastLogin: "2026-07-03T08:45:00" },
  { id: "U-11", name: "วัชระ ปลอดภัย", role: "contractor", email: "watchara.team@maccalight.co.th", phone: "081-234-5679", status: "active", lastLogin: "2026-07-02T14:05:00" },
  { id: "U-12", name: "พิชิต ทำได้", role: "contractor", email: "pichit.team@maccalight.co.th", phone: "081-234-5680", status: "active", lastLogin: "2026-07-01T11:30:00" },
  { id: "U-13", name: "ศิริพร ประสานดี", role: "coordinator", email: "siriporn@maccalight.co.th", phone: "081-555-0103", status: "active", lastLogin: "2026-07-02T09:15:00" },
  { id: "U-14", name: "ธนาธิป มหาศาล", role: "executive", email: "thanathip@maccalight.co.th", phone: "081-999-0001", status: "active", lastLogin: "2026-07-03T08:30:00" },
];

export function roleLabel(role) {
  return { coordinator: "ผู้ประสานงาน", contractor: "ผู้รับเหมา / ทีม Service", admin: "ผู้ดูแลระบบ", executive: "ผู้บริหาร", guest: "ลูกค้า (Guest)" }[role] || role;
}

// ── RBAC: permission matrix (module × role) ──────────────────────
// Modules shown as rows in the Admin → Master Data "สิทธิ์การเข้าถึง" tab.
export const permissionModules = [
  { key: "dashboard", label: "Dashboard / ภาพรวม" },
  { key: "jobs", label: "จัดการงาน (Job Management)" },
  { key: "schedule", label: "จัดทำแผนงาน (Scheduling)" },
  { key: "links", label: "สร้างลิงก์ (Link Generator)" },
  { key: "closing", label: "ปิดงาน & การเงิน (Job Closing)" },
  { key: "warranty", label: "บริการหลังการขาย (Warranty)" },
  { key: "upload", label: "อัปโหลดรูป / ส่งมอบงาน" },
  { key: "users", label: "จัดการผู้ใช้ (User Management)" },
  { key: "masterData", label: "Master Data" },
  { key: "audit", label: "ประวัติการใช้งานระบบ (Audit)" },
  { key: "mango", label: "ซิงค์ข้อมูล Mango" },
  { key: "permissions", label: "จัดการสิทธิ์ (RBAC)" },
];

// The 4 operations tracked per module.
export const permissionOps = [
  { key: "view", label: "ดู" },
  { key: "add", label: "เพิ่ม" },
  { key: "edit", label: "แก้ไข" },
  { key: "delete", label: "ลบ" },
];

// Build a full permission map: every module → { view, add, edit, delete }.
// `granted[moduleKey]` may be `true` (= all 4 ops) or a partial object like
// { view: true, edit: true }.
export function buildPermissions(granted = {}) {
  const base = {};
  permissionModules.forEach((m) => {
    base[m.key] = { view: false, add: false, edit: false, delete: false };
  });
  Object.entries(granted).forEach(([k, v]) => {
    if (!base[k]) return;
    if (v === true) base[k] = { view: true, add: true, edit: true, delete: true };
    else if (v && typeof v === "object") base[k] = { ...base[k], ...v };
  });
  return base;
}

// Roles are a managed list (add / edit / delete / suspend), not a fixed set —
// mirrors the User Management CRUD pattern. Each module now carries per-action
// rights (ดู/เพิ่ม/แก้ไข/ลบ) so a role can e.g. add+edit but not delete.
// Settings-only (mock): changes save + log to the audit trail, but by design
// do NOT themselves hide menus or block routes.
export const defaultRoles = [
  {
    id: "admin", name: "ผู้ดูแลระบบ (Owner)", system: true, owner: true, status: "active",
    permissions: buildPermissions(Object.fromEntries(permissionModules.map((m) => [m.key, true]))),
  },
  {
    // Same reach and rights as Admin — every module, full add/edit/delete —
    // just a separate login identity/persona for company leadership.
    id: "executive", name: "ผู้บริหาร", system: true, status: "active",
    permissions: buildPermissions(Object.fromEntries(permissionModules.map((m) => [m.key, true]))),
  },
  {
    id: "coordinator", name: "ผู้ประสานงาน", system: true, status: "active",
    permissions: buildPermissions({
      dashboard: { view: true },
      jobs: true, schedule: true, links: true, warranty: true,
      closing: { view: true, edit: true },
    }),
  },
  {
    id: "lead", name: "หัวหน้าช่าง", system: true, status: "active",
    permissions: buildPermissions({
      dashboard: { view: true },
      jobs: { view: true },
      schedule: { view: true, edit: true },
      warranty: { view: true },
      closing: { view: true },
      upload: { view: true, add: true, edit: true },
    }),
  },
  {
    id: "contractor", name: "ทีมช่าง", system: true, status: "active",
    permissions: buildPermissions({
      dashboard: { view: true },
      schedule: { view: true },
      upload: { view: true, add: true, edit: true },
    }),
  },
];

// ── Admin: system audit log ──────────────────────────────────────
export const auditLogs = [
  { id: "L-9001", actor: "นภัสสร ใจดี", role: "coordinator", action: "อัปเดตใบงาน", target: "J-2607-041", timestamp: "2026-07-03T08:12:00" },
  { id: "L-9000", actor: "สมชาย รุ่งเรือง", role: "contractor", action: "อัปโหลดรูปภาพหน้างาน", target: "J-2607-034", timestamp: "2026-07-03T07:58:00" },
  { id: "L-8999", actor: "ระบบ (Mango Sync)", role: "system", action: "ซิงค์สถานะชำระเงินอัตโนมัติ", target: "J-2607-039", timestamp: "2026-07-02T16:05:00" },
  { id: "L-8998", actor: "ลูกค้า - อบต. คลองสาม", role: "guest", action: "ยืนยันวันนัดหมายผ่านลิงก์", target: "LK-1038", timestamp: "2026-07-02T14:30:00" },
  { id: "L-8997", actor: "ปุสิทธิ์ นันทวงศ์", role: "admin", action: "เพิ่มผู้ใช้งานใหม่", target: "U-06 กิตติ ซ่อมไว", timestamp: "2026-06-20T09:00:00" },
  { id: "L-8996", actor: "ธนกร วงศ์สวัสดิ์", role: "coordinator", action: "สร้างลิงก์ใบเสนอราคา", target: "LK-1042", timestamp: "2026-07-02T10:20:00" },
  { id: "L-8995", actor: "ประเสริฐ ศักดิ์สิทธิ์", role: "contractor", action: "รับลายเซ็นลูกค้าหน้างาน", target: "J-2607-036", timestamp: "2026-06-15T13:44:00" },
  { id: "L-8994", actor: "อนุชา แข็งขัน", role: "contractor", action: "อัปโหลดรูปภาพหน้างาน", target: "J-2607-105", timestamp: "2026-07-02T09:30:00" },
  { id: "L-8993", actor: "ศิริพร ประสานดี", role: "coordinator", action: "วางแผนงานใหม่", target: "J-2607-108", timestamp: "2026-07-01T15:50:00" },
  { id: "L-8992", actor: "วัชระ ปลอดภัย", role: "contractor", action: "เปิดเคสแจ้งซ่อมใหม่", target: "RT-228", timestamp: "2026-06-22T08:40:00" },
  { id: "L-8991", actor: "ระบบ (Mango Sync)", role: "system", action: "ส่งข้อมูลใหม่ด้วยมือสำเร็จ", target: "SY-492", timestamp: "2026-07-01T17:45:00" },
];


// Sequential blue shades (light → dark) for category/comparison charts —
// keeps bar/donut charts on-brand instead of an unrelated multi-hue rainbow.
export const chartBlueShades = [
  "oklch(0.85 0.08 255)",
  "oklch(0.70 0.14 255)",
  "oklch(0.58 0.18 255)",
  "oklch(0.48 0.19 255)",
  "oklch(0.38 0.17 255)",
  "oklch(0.28 0.13 255)",
];

// Illustrative monthly revenue target for the Admin executive dashboard's
// actual-vs-target KPI card — proposal has no target-setting feature, so
// this is mocked (not derived from real config) same as monthlyJobTarget.
export const revenueTarget = 2500000;

// ── Coordinator dashboard: revenue trend & KPI sparklines ─────────
// 12 months so sparklines/area charts have enough points to read as a real
// trend — last-6 values match what was already shown before this expansion.
export const revenueTrend = [
  { label: "ส.ค.", value: 820000 },
  { label: "ก.ย.", value: 890000 },
  { label: "ต.ค.", value: 950000 },
  { label: "พ.ย.", value: 1010000 },
  { label: "ธ.ค.", value: 1080000 },
  { label: "ม.ค.", value: 1160000 },
  { label: "ก.พ.", value: 1250000 },
  { label: "มี.ค.", value: 1480000 },
  { label: "เม.ย.", value: 1390000 },
  { label: "พ.ค.", value: 1720000 },
  { label: "มิ.ย.", value: 1950000 },
  { label: "ก.ค.", value: 2140000 },
];

// Cumulative/point-in-time counts across the same 12 months, ending at the
// actual current totals from the (now ~55-job) jobs array above.
export const jobCountTrend = [15, 19, 23, 27, 31, 36, 40, 44, 47, 50, 53, 55];
export const inProgressTrend = [10, 12, 14, 16, 18, 20, 21, 23, 24, 25, 26, 27];
export const doneTrend = [5, 6, 8, 10, 12, 14, 15, 17, 18, 19, 20, 22];
export const repairTrend = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6];

// ── Executive: Coordinator / Field Team performance analytics ────────────
// These feed the two "มุมมองผู้บริหาร" (Executive) analysis pages — built for
// comparing people/teams against each other and spotting bottlenecks, not for
// day-to-day job management (that's the Coordinator/Contractor apps' job).

function daysBetween(isoA, isoB) {
  if (!isoA || !isoB) return null;
  const [ay, am, ad] = isoA.split("-").map(Number);
  const [by, bm, bd] = isoB.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

// Per-coordinator "signature" pace multiplier — deterministic, not random, so
// one coordinator reads as consistently faster/slower across all their jobs
// instead of noise that would average out to identical means for everyone.
const COORDINATOR_PACE = { "U-01": 1, "U-02": 1.4, "U-13": 0.8 };

// Synthetic per-stage turnaround (days) for one job. Not stored on the job
// record — the four handoff stages the spec asks for (แจ้งงาน→ใบเสนอราคา,
// อนุมัติ→สั่งซื้อ, ของ/ทีมพร้อม→คอนเฟิร์มวัน, งานเสร็จ→ส่งเอกสารบัญชี) aren't
// tracked as their own timestamps in this prototype's job model, so each
// stage's duration is derived deterministically from the job id + the
// handling coordinator's pace, giving comparable, stable numbers per person.
function stageDurationsFor(job) {
  const seed = seedFromId(job.id);
  const pace = COORDINATOR_PACE[job.coordinatorId] ?? 1;
  const round1 = (n) => Math.round(n * 10) / 10;
  return {
    toQuote: round1((1 + (seed % 3)) * pace),
    toProcure: round1((2 + (Math.floor(seed / 3) % 4)) * pace),
    toConfirm: round1((1 + (Math.floor(seed / 12) % 3)) * pace),
    toAccounting: round1((1 + (Math.floor(seed / 36) % 2)) * pace),
  };
}

// Section 1-5 metrics per active coordinator, for the benchmark/ranking table
// + auto-highlight comparisons on the Coordinator Performance View.
export function coordinatorPerformance(jobList = jobs, staffList = staffUsers) {
  const coordinators = staffList.filter((u) => u.role === "coordinator" && u.status === "active");
  return coordinators.map((u) => {
    const myJobs = jobList.filter((j) => j.coordinatorId === u.id);
    const active = myJobs.filter((j) => j.status === "in_progress");
    const overdue = active.filter((j) => j.scheduledDate < TODAY_ISO);
    const overduePct = active.length ? Math.round((overdue.length / active.length) * 100) : 0;

    const durations = myJobs.map(stageDurationsFor);
    const avgOf = (key) =>
      durations.length ? Math.round((durations.reduce((s, d) => s + d[key], 0) / durations.length) * 10) / 10 : 0;

    const revisedCount = myJobs.filter((j) => j.quotationRevisions > 0).length;
    const revisionPct = myJobs.length ? Math.round((revisedCount / myJobs.length) * 100) : 0;
    const docIncompleteCount = myJobs.filter((j) => j.docsComplete === false).length;
    const docIncompletePct = myJobs.length ? Math.round((docIncompleteCount / myJobs.length) * 100) : 0;
    const avgFollowUps = myJobs.length
      ? Math.round((myJobs.reduce((s, j) => s + (j.customerFollowUps || 0), 0) / myJobs.length) * 10) / 10
      : 0;

    // "Controllable" = still waiting on this coordinator's own action
    // (quotation not yet signed off, or paperwork not complete); everything
    // else overdue is waiting on someone/something outside their control
    // (customer, supplier, the crew's own schedule).
    const controllable = overdue.filter((j) => !j.quotationSigned || j.docsComplete === false).length;
    const uncontrollable = overdue.length - controllable;

    const doneJobs = myJobs.filter((j) => j.status === "done");
    const closedInTarget = doneJobs.filter(
      (j) => j.paymentStatus === "ชำระแล้ว" && j.closedDate && (daysBetween(j.scheduledDate, j.closedDate) ?? 99) <= 7
    ).length;
    const successRate = doneJobs.length ? Math.round((closedInTarget / doneJobs.length) * 100) : 0;

    return {
      id: u.id,
      name: u.name,
      activeCount: active.length,
      overdueCount: overdue.length,
      overduePct,
      toQuote: avgOf("toQuote"),
      toProcure: avgOf("toProcure"),
      toConfirm: avgOf("toConfirm"),
      toAccounting: avgOf("toAccounting"),
      revisionPct,
      docIncompletePct,
      avgFollowUps,
      controllable,
      uncontrollable,
      successRate,
      totalJobs: myJobs.length,
    };
  });
}

// Section 1-5 metrics per team, for the Field Team Performance View.
export function teamPerformanceDetailed(jobList = jobs, teamList = teams, warrantyList = warranties, ticketList = repairTickets) {
  return teamList.map((t) => {
    const teamJobs = jobList.filter((j) => (j.teams || [j.team]).includes(t.name));
    const activeJobs = teamJobs.filter((j) => j.status === "in_progress");
    const doneJobs = teamJobs.filter((j) => j.status === "done");
    const seed = seedFromId(t.id);

    const status = t.onLeave ? "leave" : activeJobs.length > 0 ? "working" : "available";

    const onTimeJobs = doneJobs.filter((j) => (daysBetween(j.scheduledDate, j.closedDate) ?? 99) <= 3);
    const onTimeRate = doneJobs.length ? Math.round((onTimeJobs.length / doneJobs.length) * 100) : 0;

    const ratedJobs = doneJobs.filter((j) => j.customerRating != null);
    const avgRating = ratedJobs.length
      ? Math.round((ratedJobs.reduce((s, j) => s + j.customerRating, 0) / ratedJobs.length) * 10) / 10
      : null;

    const qualityChecked = teamJobs.filter((j) => j.status === "done" || j.status === "repair");
    const docCompliancePct = qualityChecked.length
      ? Math.round((qualityChecked.filter((j) => j.docsComplete).length / qualityChecked.length) * 100)
      : 100;

    // Warranty claim rate: of this team's jobs that have a warranty record at
    // all, what % later needed an actual repair ticket filed against them.
    const teamJobIds = new Set(teamJobs.map((j) => j.id));
    const teamWarranties = warrantyList.filter((w) => teamJobIds.has(w.jobId));
    const claimedJobIds = new Set(ticketList.filter((rt) => teamJobIds.has(rt.jobId)).map((rt) => rt.jobId));
    const warrantyClaimRate = teamWarranties.length
      ? Math.round((teamWarranties.filter((w) => claimedJobIds.has(w.jobId)).length / teamWarranties.length) * 100)
      : 0;

    const teamTickets = ticketList.filter((rt) => rt.team === t.name);
    const issueCounts = {};
    teamTickets.forEach((rt) => {
      const key = rt.issue.length > 28 ? `${rt.issue.slice(0, 28)}…` : rt.issue;
      issueCounts[key] = (issueCounts[key] || 0) + 1;
    });
    const commonIssue = Object.entries(issueCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    const monthKey = TODAY_ISO.slice(0, 7);
    const completedThisMonth = doneJobs.filter((j) => j.closedDate && j.closedDate.slice(0, 7) === monthKey).length;

    const durations = doneJobs.map((j) => daysBetween(j.scheduledDate, j.closedDate)).filter((d) => d != null);
    const avgDuration = durations.length ? Math.round((durations.reduce((s, d) => s + d, 0) / durations.length) * 10) / 10 : 0;

    // Illustrative subcontractor economics (mocked — no real payroll/cost
    // feed in this prototype), same spirit as monthlyJobTarget/revenueTarget.
    // wagePerJob is a per-technician labor cost, so it's compared against job
    // value as a cost RATIO (a few %), not framed as "margin" — job.amount
    // covers materials/equipment too, so wage-vs-full-contract-value would
    // misleadingly read as ~98% margin for every team.
    const wagePerJob = 6000 + (seed % 12) * 800;
    const avgJobValue = teamJobs.length ? teamJobs.reduce((s, j) => s + j.amount, 0) / teamJobs.length : 0;
    const laborCostRatioPct = avgJobValue ? Math.round((wagePerJob / avgJobValue) * 1000) / 10 : 0;

    return {
      id: t.id,
      name: t.name,
      status,
      workload: activeJobs.length,
      completedThisMonth,
      onTimeRate,
      avgDuration,
      avgRating,
      docCompliancePct,
      siteComplaints: seed % 4,
      warrantyClaimRate,
      commonIssue,
      wagePerJob,
      avgJobValue: Math.round(avgJobValue),
      laborCostRatioPct,
      totalJobs: teamJobs.length,
    };
  });
}

// Shared "auto-highlight" rule: how far a value sits from the group average,
// expressed as a multiple — e.g. 1.8 means "80% higher than average". Lets
// both Executive views flag outliers without the user having to eyeball a
// table (per the shared design principle: auto-highlight, not manual scan).
export function deviationFromAverage(value, allValues) {
  const avg = allValues.length ? allValues.reduce((s, v) => s + v, 0) / allValues.length : 0;
  if (!avg) return 0;
  return Math.round(((value - avg) / avg) * 100) / 100;
}
