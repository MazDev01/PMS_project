"use client";

// Lightweight, dependency-free SVG charts — hand-rolled in the same
// visual language as the Recharts examples in design-system.html,
// but parametrized with real props instead of being static demo art.
import { useState } from "react";

export function Sparkline({ data = [], color = "var(--primary)", width = 80, height = 36 }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1 || 1);
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return `${x},${y}`;
  });
  const path = "M" + points.join(" L");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength="1" className="chart-line" />
    </svg>
  );
}

// Full-width area sparkline that sits flush along the bottom edge of a KPI
// card (like the reference dashboards). No axes/labels — pure trend shape.
export function CardSparkline({ data = [], color = "var(--primary)", height = 46, id = "spark" }) {
  if (data.length < 2) return null;
  const width = 240; // viewBox width; the svg stretches to the card via width=100%
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => ({
    x: i * stepX,
    y: height - 5 - ((v - min) / range) * (height - 12),
  }));
  const line = smoothPath(pts);
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${height} L${pts[0].x.toFixed(1)},${height} Z`;
  const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, "") || "spark";
  const gradId = `cardspark-${safeId}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.24" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} className="chart-area" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" pathLength="1" className="chart-line" />
    </svg>
  );
}

export function SimpleBarChart({ data = [], color = "var(--primary)", width = 320, height = 170, valueFormatter, unit }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const padLeft = 34;
  const padBottom = 22;
  const padTop = 14;
  const chartW = width - padLeft - 10;
  const chartH = height - padBottom - padTop;
  const barGap = 10;
  const barW = Math.max(10, chartW / data.length - barGap);
  const gridLines = [0.25, 0.5, 0.75, 1];
  const unitSuffix = unit ? ` ${unit}` : "";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%">
      {gridLines.map((g) => {
        const y = padTop + chartH * (1 - g);
        return (
          <g key={g}>
            <line x1={padLeft} y1={y} x2={width - 6} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
            <text x={padLeft - 6} y={y + 3} textAnchor="end" fontSize="9" fill="var(--muted-foreground)">
              {valueFormatter ? valueFormatter(Math.round(max * g)) : Math.round(max * g)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const barH = (d.value / max) * chartH;
        const x = padLeft + i * (barW + barGap) + barGap / 2;
        const y = padTop + chartH - barH;
        const cx = x + barW / 2;
        // Hover tooltip: value (+ optional unit), floating above the bar. If the
        // bar is tall enough that the tip would clip the top, drop it just inside.
        const valText = `${valueFormatter ? valueFormatter(d.value) : d.value}${unitSuffix}`;
        const tipW = Math.max(26, valText.length * 6.4 + 14);
        const tipH = 20;
        const tipY = y - tipH - 8 < 0 ? y + 6 : y - tipH - 8;
        return (
          <g key={d.label + i} className="bar-hit">
            {/* invisible full-column hover target so the whole column reacts */}
            <rect x={x - barGap / 2} y={padTop} width={barW + barGap} height={chartH} fill="transparent" />
            <rect x={x} y={y} width={barW} height={Math.max(barH, 1)} rx="4" fill={d.color || color} className="chart-bar" style={{ animationDelay: `${i * 0.06}s` }} />
            <text x={cx} y={height - 6} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
              {d.label}
            </text>
            <g className="bar-tip" transform={`translate(${cx}, ${tipY})`}>
              <rect x={-tipW / 2} y={0} width={tipW} height={tipH} rx="6" className="bar-tip-bg" />
              <text x={0} y={tipH / 2 + 3.4} textAnchor="middle" fontSize="10.5" fontWeight="700" className="bar-tip-text">{valText}</text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

export function DonutChart({ segments = [], size = 150, thickness = 26, centerLabel, centerSub }) {
  // Hovering a slice (on the ring OR in the legend) pops it out, dims the rest,
  // and shows that slice's own share (%) in the middle.
  const [active, setActive] = useState(null);
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  let angleAcc = 0;
  const cx = size / 2;
  const cy = size / 2;
  const activeSeg = active != null ? segments[active] : null;
  const activePct = activeSeg ? Math.round((activeSeg.value / total) * 100) : null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} style={{ flexShrink: 0, overflow: "visible" }}>
        {segments.map((seg, i) => {
          const len = (seg.value / total) * circumference;
          const startAngle = (angleAcc / total) * 360;
          angleAcc += seg.value;
          const isActive = active === i;
          const dim = active != null && !isActive;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={isActive ? thickness + 7 : thickness}
              strokeDasharray={`${len} ${circumference}`}
              transform={`rotate(${-90 + startAngle} ${cx} ${cy})`}
              className="chart-donut-seg"
              style={{
                "--seg-len": len,
                animationDelay: `${i * 0.12}s`,
                opacity: dim ? 0.35 : 1,
                cursor: "pointer",
                transition: "stroke-width 0.16s ease, opacity 0.16s ease",
              }}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            />
          );
        })}
        {(centerLabel || centerSub || activeSeg) && (
          <g className="chart-center">
            {activeSeg ? (
              <>
                <text x={cx} y={cy - 2} textAnchor="middle" fontSize="21" fontWeight="800" fill="var(--foreground)">
                  {activePct}%
                </text>
                <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
                  {activeSeg.label}
                </text>
              </>
            ) : (
              <>
                {centerLabel && (
                  <text x={cx} y={cy - 3} textAnchor="middle" fontSize="19" fontWeight="700" fill="var(--foreground)">
                    {centerLabel}
                  </text>
                )}
                {centerSub && (
                  <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9.5" fill="var(--muted-foreground)">
                    {centerSub}
                  </text>
                )}
              </>
            )}
          </g>
        )}
      </svg>
      <div className="chart-legend" style={{ flexDirection: "column", gap: "0.5rem" }}>
        {segments.map((seg, i) => (
          <div
            className="lg-item"
            key={i}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            style={{
              cursor: "pointer",
              opacity: active != null && active !== i ? 0.45 : 1,
              fontWeight: active === i ? 700 : undefined,
              transition: "opacity 0.16s ease",
            }}
          >
            <span className="sw" style={{ background: seg.color }} />
            <span>
              {seg.label} · {Math.round((seg.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Smooth Catmull-Rom → cubic-bezier path so the trend line reads as a clean
// curve instead of angular straight segments (matching the reference chart).
function smoothPath(pts) {
  if (pts.length < 2) return pts.length ? `M${pts[0].x},${pts[0].y}` : "";
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

// Round an axis max up to a clean 1/2/2.5/5/10 × 10ⁿ value so the y-axis
// reads 0/150k/300k… instead of odd fractions of the raw data max.
function niceCeil(v) {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return nice * pow;
}

// Two (or more) trend lines on shared axes — e.g. jobs opened vs. jobs
// completed over time. `series` is [{key, label, color}]; each data row holds a
// numeric value under every series key plus a `label` for the x-axis.
export function DualLineChart({ data = [], series = [], width = 640, height = 190, id = "dual", maxLabels }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  if (!data.length || !series.length) return null;
  const showLabel = (i) => {
    if (!maxLabels || maxLabels >= data.length) return true;
    for (let k = 0; k < maxLabels; k++) {
      if (i === Math.round((k * (data.length - 1)) / (maxLabels - 1))) return true;
    }
    return false;
  };
  const max = niceCeil(Math.max(...data.flatMap((d) => series.map((s) => d[s.key] || 0)), 1));
  const padLeft = 34;
  const padBottom = 22;
  const padTop = 12;
  const chartW = width - padLeft - 12;
  const chartH = height - padBottom - padTop;
  const stepX = chartW / (data.length - 1 || 1);
  const bottom = padTop + chartH;
  const xAt = (i) => padLeft + i * stepX;
  const yAt = (v) => padTop + chartH - (v / max) * chartH;
  const hi = hoverIdx != null && hoverIdx >= 0 && hoverIdx < data.length ? hoverIdx : null;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" onMouseLeave={() => setHoverIdx(null)}>
        {/* Horizontal gridlines + integer y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <g key={`h${g}`}>
            <line x1={padLeft} y1={padTop + chartH * (1 - g)} x2={width - 8} y2={padTop + chartH * (1 - g)} stroke="var(--border)" strokeDasharray="3 3" />
            <text x={padLeft - 6} y={padTop + chartH * (1 - g) + 3} textAnchor="end" fontSize="9" fill="var(--muted-foreground)">
              {Math.round(max * g)}
            </text>
          </g>
        ))}
        {/* Vertical gridlines at shown label positions */}
        {data.map((d, i) => (showLabel(i) ? (
          <line key={`v${i}`} x1={xAt(i)} y1={padTop} x2={xAt(i)} y2={bottom} stroke="var(--border)" strokeDasharray="3 3" />
        ) : null))}
        {series.map((s, si) => {
          const pts = data.map((d, i) => ({ x: xAt(i), y: yAt(d[s.key] || 0) }));
          return (
            <g key={s.key}>
              <path d={smoothPath(pts)} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" pathLength="1" className="chart-line" style={{ animationDelay: `${si * 0.25}s` }} />
              {pts.map((p, i) => (showLabel(i) ? (
                <circle key={i} cx={p.x} cy={p.y} r="2.6" fill="var(--card)" stroke={s.color} strokeWidth="1.8" />
              ) : null))}
            </g>
          );
        })}
        {/* X-axis labels */}
        {data.map((d, i) => (showLabel(i) ? (
          <text key={`x${i}`} x={xAt(i)} y={height - 5} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
            {d.label}
          </text>
        ) : null))}
        {/* Hover: vertical guide, active dots on every series, and a value box */}
        {hi != null && (() => {
          const gx = xAt(hi);
          const rows = series.map((s) => ({ label: s.label, color: s.color, value: data[hi][s.key] || 0 }));
          const headerH = 19;
          const rowH = 15;
          const tipH = headerH + rows.length * rowH + 7;
          const measure = (str, dot) => str.length * 5.8 + (dot ? 15 : 0) + 18;
          const tipW = Math.max(measure(String(data[hi].label), false), ...rows.map((r) => measure(`${r.label}  ${r.value}`, true)));
          let tx = gx + 12;
          if (tx + tipW > width) tx = gx - 12 - tipW;
          if (tx < 2) tx = 2;
          const ty = padTop + 2;
          return (
            <g style={{ pointerEvents: "none" }}>
              <line x1={gx} y1={padTop} x2={gx} y2={bottom} stroke="var(--muted-foreground)" strokeDasharray="3 3" opacity="0.55" />
              {rows.map((r, ri) => (
                <circle key={ri} cx={gx} cy={yAt(r.value)} r="4" fill="var(--card)" stroke={r.color} strokeWidth="2.4" />
              ))}
              <g transform={`translate(${tx}, ${ty})`}>
                <rect x={0} y={0} width={tipW} height={tipH} rx="7" className="bar-tip-bg" />
                <text x={10} y={14} fontSize="10.5" fontWeight="700" fill="var(--card)">{data[hi].label}</text>
                {rows.map((r, ri) => (
                  <g key={ri} transform={`translate(10, ${headerH + ri * rowH + 8})`}>
                    <circle cx={3} cy={-3} r="3.2" fill={r.color} />
                    <text x={13} y={0} fontSize="10" fill="var(--card)">{r.label} · {r.value}</text>
                  </g>
                ))}
              </g>
            </g>
          );
        })()}
        {/* Invisible per-index hover targets covering the full plot height */}
        {data.map((d, i) => {
          const cx = xAt(i);
          const left = i === 0 ? padLeft : cx - stepX / 2;
          const right = i === data.length - 1 ? padLeft + chartW : cx + stepX / 2;
          return (
            <rect key={`hit${i}`} x={left} y={padTop} width={Math.max(1, right - left)} height={chartH} fill="transparent" onMouseEnter={() => setHoverIdx(i)} />
          );
        })}
      </svg>
      <div className="chart-legend" style={{ justifyContent: "center", gap: "1.25rem", marginTop: "0.4rem" }}>
        {series.map((s) => (
          <div className="lg-item" key={s.key}>
            <span className="sw" style={{ background: s.color }} />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AreaLineChart({ data = [], width = 320, height = 150, color = "#2563eb", id = "chart", valueFormatter, maxLabels }) {
  if (!data.length) return null;
  // Thin the x-axis labels to at most `maxLabels` evenly-spaced points
  // (always keeping the first and last) so a 12-month series can show just a
  // few month names instead of a cramped row of every label.
  const showLabel = (i) => {
    if (!maxLabels || maxLabels >= data.length) return true;
    for (let k = 0; k < maxLabels; k++) {
      if (i === Math.round((k * (data.length - 1)) / (maxLabels - 1))) return true;
    }
    return false;
  };
  const max = niceCeil(Math.max(...data.map((d) => d.value), 1));
  const padLeft = 40;
  const padBottom = 22;
  const padTop = 10;
  const chartW = width - padLeft - 12;
  const chartH = height - padBottom - padTop;
  const stepX = chartW / (data.length - 1 || 1);
  const points = data.map((d, i) => ({
    x: padLeft + i * stepX,
    y: padTop + chartH - (d.value / max) * chartH,
  }));
  const bottom = padTop + chartH;
  const linePath = smoothPath(points);
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${bottom} L${points[0].x.toFixed(1)},${bottom} Z`;
  const gradId = `areaGrad-${id}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity="0.26" />
          <stop offset="95%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Horizontal gridlines + y-axis labels (including the 0 baseline) */}
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <g key={`h${g}`}>
          <line x1={padLeft} y1={padTop + chartH * (1 - g)} x2={width - 8} y2={padTop + chartH * (1 - g)} stroke="var(--border)" strokeDasharray="3 3" />
          <text x={padLeft - 6} y={padTop + chartH * (1 - g) + 3} textAnchor="end" fontSize="9" fill="var(--muted-foreground)">
            {valueFormatter ? valueFormatter(Math.round(max * g)) : Math.round(max * g)}
          </text>
        </g>
      ))}
      {/* Vertical gridlines at the shown label positions */}
      {points.map((p, i) => (showLabel(i) ? (
        <line key={`v${i}`} x1={p.x} y1={padTop} x2={p.x} y2={bottom} stroke="var(--border)" strokeDasharray="3 3" />
      ) : null))}
      <path d={areaPath} fill={`url(#${gradId})`} className="chart-area" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" pathLength="1" className="chart-line" />
      {points.map((p, i) => (showLabel(i) ? (
        <text key={i} x={p.x} y={height - 5} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
          {data[i].label}
        </text>
      ) : null))}
    </svg>
  );
}
