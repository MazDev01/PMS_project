import { deviationFromAverage } from "@/app/lib/mockData";
import { IconChevronRight } from "@/app/components/icons";

// Shared by the two Executive "มุมมองผู้บริหาร" performance pages
// (Coordinator Performance View, Field Team Performance View) so both
// benchmark/ranking tables auto-highlight outliers the exact same way,
// per the shared design principle: "ผู้บริหารไม่ต้องไล่ดูเอง".

// Clickable name cell that opens a drill-down. Styled as a bold foreground
// label with a subtle chevron affordance (turns brand-blue + nudges on hover)
// — NOT an underlined HTML hyperlink, which reads as out-of-place on a data
// table. The whole thing is a button so it's keyboard-accessible.
export function DrillName({ name, onClick }) {
  return (
    <button type="button" className="drill-name" onClick={onClick}>
      <span>{name}</span>
      <IconChevronRight size={13} className="drill-name-chevron" />
    </button>
  );
}

export function avgOf(rows, key) {
  return rows.length ? rows.reduce((s, r) => s + r[key], 0) / rows.length : 0;
}

// A row/cell reads as an outlier once it's ≥30% off the group average.
export function outlierClass(value, allValues, worseIsHigher = true) {
  const dev = deviationFromAverage(value, allValues);
  if (worseIsHigher ? dev >= 0.3 : dev <= -0.3) return "row-accent-destructive";
  if (worseIsHigher ? dev <= -0.3 : dev >= 0.3) return "row-accent-success";
  return "";
}

export function DeviationBadge({ value, allValues, worseIsHigher = true }) {
  const dev = deviationFromAverage(value, allValues);
  const pct = Math.round(dev * 100);
  if (Math.abs(pct) < 15) return null;
  const isBad = worseIsHigher ? pct > 0 : pct < 0;
  return (
    <span className={`badge ${isBad ? "badge-destructive" : "badge-success"}`} style={{ fontSize: "0.6rem", marginLeft: "0.35rem" }}>
      {pct > 0 ? "+" : ""}{pct}% จากค่าเฉลี่ย
    </span>
  );
}

// Small inline horizontal bar for comparing a number across a short list of
// rows within one table cell (e.g. turnaround days) — same visual language
// as the app's existing progress-track/progress-bar, just sized for a cell.
export function MiniBar({ value, max, tone = "default", unit = "วัน" }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div className="progress-track" style={{ width: 70 }}>
        <div className={`progress-bar ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs" style={{ fontWeight: 600, minWidth: 30 }}>{value} {unit}</span>
    </div>
  );
}
