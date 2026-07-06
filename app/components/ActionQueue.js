"use client";

import Link from "next/link";
import {
  IconFileText, IconClock, IconDollar, IconShield,
  IconAlertTriangle, IconArrowRight,
} from "./icons";

const TODAY_ISO = "2026-07-03";

// Whole days between today and an ISO date. Positive = the date is in the past
// (i.e. "waited N days"); negative = still in the future ("N days remaining").
function daysWaited(iso) {
  if (!iso) return 0;
  const [ty, tm, td] = TODAY_ISO.split("-").map(Number);
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(y, m - 1, d)) / 86400000);
}

// Single-bucket classification — each job lands in exactly the ONE stage that
// says what the coordinator must do next (priority top→bottom). "closed" =
// done + paid, needs no action, so it never shows in the queue.
function stageOf(j) {
  if (j.status === "repair") return "repair";
  if (!j.quotationSigned) return "quote";
  if (j.status === "done") return j.paymentStatus !== "ชำระแล้ว" ? "billing" : "closed";
  // in_progress
  return j.scheduledDate < TODAY_ISO ? "overdue" : "active";
}

// Tone for a "waited N days" badge — the longer it sits, the hotter.
function waitedTone(d) {
  if (d >= 8) return "badge-destructive";
  if (d >= 3) return "badge-warning";
  return "badge-success";
}
// Tone for an upcoming appointment countdown — the closer, the hotter.
function countdownTone(r) {
  if (r <= 2) return "badge-destructive";
  if (r <= 5) return "badge-warning";
  return "badge-secondary";
}

const STAGE_DEFS = [
  { key: "quote", title: "รอเสนอราคา / อนุมัติ", Icon: IconFileText, color: "#d97706", dateField: "createdDate", metric: "waited" },
  { key: "active", title: "พร้อม / กำลังดำเนินการ", Icon: IconClock, color: "#2563eb", dateField: "scheduledDate", metric: "countdown" },
  { key: "billing", title: "รอเก็บเงิน / ส่งบัญชี", Icon: IconDollar, color: "#16a34a", dateField: "closedDate", metric: "waited" },
  { key: "repair", title: "แจ้งซ่อม / ประกัน", Icon: IconShield, color: "#7c3aed", dateField: "createdDate", metric: "waited" },
];

function StageCard({ def, jobs }) {
  const { Icon, title, color, dateField, metric } = def;
  const sorted = [...jobs].sort((a, b) =>
    metric === "countdown"
      ? -daysWaited(a[dateField]) - -daysWaited(b[dateField]) // soonest first
      : daysWaited(b[dateField]) - daysWaited(a[dateField])   // longest-waiting first
  );
  const shown = sorted.slice(0, 4);
  const rest = sorted.length - shown.length;

  return (
    <div className="aq-stage">
      <div className="aq-stage-head">
        <span className="aq-stage-icon" style={{ background: `${color}1a`, color }}>
          <Icon size={15} />
        </span>
        <span className="aq-stage-title">{title}</span>
        <span className="aq-stage-count" style={{ background: `${color}1a`, color }}>{jobs.length}</span>
      </div>

      {shown.length === 0 ? (
        <div className="aq-empty">ไม่มีงานค้างในขั้นตอนนี้</div>
      ) : (
        <div className="aq-list">
          {shown.map((j) => {
            let badgeClass;
            let badgeText;
            if (metric === "countdown") {
              const r = -daysWaited(j[dateField]);
              badgeClass = countdownTone(r);
              badgeText = r <= 0 ? "วันนี้" : `อีก ${r} วัน`;
            } else {
              const d = daysWaited(j[dateField]);
              badgeClass = waitedTone(d);
              badgeText = d <= 0 ? "วันนี้" : `ค้าง ${d} วัน`;
            }
            return (
              <Link key={j.id} href={`/coordinator/jobs/${j.id}`} className="aq-row">
                <div className="aq-row-main">
                  <div className="aq-row-title">{j.customer}</div>
                  <div className="aq-row-sub">{j.id}</div>
                </div>
                <span className={`badge ${badgeClass}`} style={{ flexShrink: 0 }}>{badgeText}</span>
              </Link>
            );
          })}
        </div>
      )}

      {rest > 0 && (
        <Link href="/coordinator/jobs" className="aq-more">
          +{rest} งานเพิ่มเติม <IconArrowRight size={12} />
        </Link>
      )}
    </div>
  );
}

export default function ActionQueue({ jobs = [] }) {
  const grouped = { quote: [], active: [], billing: [], repair: [], overdue: [], closed: [] };
  jobs.forEach((j) => grouped[stageOf(j)].push(j));

  const overdue = [...grouped.overdue].sort((a, b) => daysWaited(b.scheduledDate) - daysWaited(a.scheduledDate));
  const inHand = jobs.length - grouped.closed.length; // everything still needing action

  return (
    <div className="ds-card section-block">
      <div className="ds-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", flexWrap: "wrap" }}>
        <div>
          <div className="ds-card-title">คิวงานที่รอฉันดำเนินการ</div>
          <div className="ds-card-desc">งานในความรับผิดชอบที่ยังต้องทำต่อ · จัดกลุ่มตามขั้นตอน เรียงตามความเร่งด่วน</div>
        </div>
        <span className="badge badge-secondary">ค้างในมือ {inHand} งาน</span>
      </div>

      <div className="ds-card-content" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Overdue ribbon — the most urgent thing, surfaced above everything */}
        {overdue.length > 0 && (
          <div className="aq-overdue">
            <div className="aq-overdue-head">
              <IconAlertTriangle size={15} />
              <span>งานเลยกำหนดนัดหมาย {overdue.length} งาน — ควรติดตามด่วน</span>
            </div>
            <div className="aq-overdue-chips">
              {overdue.slice(0, 5).map((j) => (
                <Link key={j.id} href={`/coordinator/jobs/${j.id}`} className="aq-chip">
                  {j.customer} · เลย {daysWaited(j.scheduledDate)} วัน
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Stage board */}
        <div className="aq-grid">
          {STAGE_DEFS.map((def) => (
            <StageCard key={def.key} def={def} jobs={grouped[def.key]} />
          ))}
        </div>
      </div>
    </div>
  );
}
