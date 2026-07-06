// Lightweight, dependency-free SVG charts — hand-rolled in the same
// visual language as the Recharts examples in design-system.html,
// but parametrized with real props instead of being static demo art.

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

export function SimpleBarChart({ data = [], color = "var(--primary)", width = 320, height = 170, valueFormatter }) {
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
        return (
          <g key={d.label + i}>
            <rect x={x} y={y} width={barW} height={Math.max(barH, 1)} rx="4" fill={d.color || color} className="chart-bar" style={{ animationDelay: `${i * 0.06}s` }} />
            <text x={x + barW / 2} y={height - 6} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function DonutChart({ segments = [], size = 150, thickness = 26, centerLabel, centerSub }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  let angleAcc = 0;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} style={{ flexShrink: 0 }}>
        {segments.map((seg, i) => {
          const len = (seg.value / total) * circumference;
          const startAngle = (angleAcc / total) * 360;
          angleAcc += seg.value;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${circumference}`}
              transform={`rotate(${-90 + startAngle} ${cx} ${cy})`}
              className="chart-donut-seg"
              style={{ "--seg-len": len, animationDelay: `${i * 0.12}s` }}
            />
          );
        })}
        {(centerLabel || centerSub) && (
          <g className="chart-center">
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
          </g>
        )}
      </svg>
      <div className="chart-legend" style={{ flexDirection: "column", gap: "0.5rem" }}>
        {segments.map((seg, i) => (
          <div className="lg-item" key={i}>
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

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%">
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
