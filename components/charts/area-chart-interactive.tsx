"use client";

import * as React from "react";

interface Datum {
  label: string;
  value: number;
}

/**
 * Area/line chart with an interactive hover tooltip.
 * Move the cursor over the plot → a guide line, marker, and value bubble
 * snap to the nearest month.
 */
export function InteractiveAreaChart({
  data,
  height = 190,
  valueFormatter = (n) => n.toLocaleString("th-TH"),
}: {
  data: Datum[];
  height?: number;
  valueFormatter?: (n: number) => string;
}) {
  const W = 320;
  const padL = 36;
  const padB = 24;
  const padT = 14;
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [active, setActive] = React.useState<number | null>(null);

  const max = Math.max(...data.map((d) => d.value), 1);
  const step = Math.ceil(max / 4 / 1000) * 1000 || 1;
  const niceMax = step * 4;
  const chartH = height - padB - padT;

  const x = (i: number) => padL + (i / (data.length - 1)) * (W - padL - 8);
  const y = (v: number) => padT + chartH - (v / niceMax) * chartH;

  const line = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.value)}`)
    .join(" ");
  const area = `${line} L${x(data.length - 1)},${padT + chartH} L${x(0)},${
    padT + chartH
  } Z`;

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const vbX = ((e.clientX - rect.left) / rect.width) * W;
    const rel = (vbX - padL) / (W - padL - 8);
    const idx = Math.min(
      data.length - 1,
      Math.max(0, Math.round(rel * (data.length - 1))),
    );
    setActive(idx);
  }

  // tooltip geometry
  const tw = 78;
  const th = 36;
  let tx = 0;
  let ty = 0;
  if (active !== null) {
    tx = Math.min(W - tw - 2, Math.max(2, x(active) - tw / 2));
    ty = y(data[active].value) - th - 10;
    if (ty < 2) ty = y(data[active].value) + 12;
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${height}`}
      width="100%"
      className="touch-none select-none"
      onPointerMove={handleMove}
      onPointerDown={handleMove}
      onPointerLeave={() => setActive(null)}
    >
      <defs>
        <linearGradient id="iAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
          <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* grid */}
      {[0, 1, 2, 3, 4].map((i) => {
        const yy = padT + (chartH / 4) * i;
        return (
          <g key={i}>
            <line
              x1={padL}
              y1={yy}
              x2={W}
              y2={yy}
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray={i === 4 ? undefined : "3 3"}
            />
            <text
              x={padL - 6}
              y={yy + 3}
              textAnchor="end"
              fontSize={9}
              fill="var(--muted-foreground)"
            >
              {Math.round((niceMax - step * i) / 1000)}k
            </text>
          </g>
        );
      })}

      {/* area + line */}
      <path d={area} fill="url(#iAreaGrad)" />
      <path
        d={line}
        fill="none"
        stroke="var(--chart-1)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* base dots */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={x(i)}
          cy={y(d.value)}
          r={2.5}
          fill="var(--chart-1)"
          opacity={active === i ? 0 : 0.45}
        />
      ))}

      {/* x labels */}
      {data.map((d, i) => (
        <text
          key={d.label}
          x={x(i)}
          y={height - 6}
          textAnchor="middle"
          fontSize={9}
          fill={active === i ? "var(--foreground)" : "var(--muted-foreground)"}
          fontWeight={active === i ? 600 : 400}
        >
          {d.label}
        </text>
      ))}

      {/* hover elements */}
      {active !== null && (
        <g>
          <line
            x1={x(active)}
            y1={padT}
            x2={x(active)}
            y2={padT + chartH}
            stroke="var(--chart-1)"
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.6}
          />
          <circle
            cx={x(active)}
            cy={y(data[active].value)}
            r={5}
            fill="var(--chart-1)"
            stroke="var(--card)"
            strokeWidth={2}
          />
          {/* tooltip */}
          <rect
            x={tx}
            y={ty}
            width={tw}
            height={th}
            rx={7}
            fill="var(--card)"
            stroke="var(--border)"
          />
          <text
            x={tx + tw / 2}
            y={ty + 15}
            textAnchor="middle"
            fontSize={11}
            fontWeight={700}
            fill="var(--foreground)"
          >
            {valueFormatter(data[active].value)}
          </text>
          <text
            x={tx + tw / 2}
            y={ty + 28}
            textAnchor="middle"
            fontSize={9}
            fill="var(--muted-foreground)"
          >
            {data[active].label} 2569
          </text>
        </g>
      )}

      {/* full-plot capture layer keeps hover responsive between points */}
      <rect
        x={padL}
        y={padT}
        width={W - padL}
        height={chartH}
        fill="transparent"
      />
    </svg>
  );
}
