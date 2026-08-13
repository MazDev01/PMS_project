"use client";

import * as React from "react";

// ── Bar chart (pastel gradient + grow-in + hover tooltip) ───────────────
interface BarDatum {
  label: string;
  value: number;
  highlight?: boolean;
}

export function BarChart({
  data,
  height = 170,
  unit = "",
}: {
  data: BarDatum[];
  height?: number;
  unit?: string;
}) {
  const [active, setActive] = React.useState<number | null>(null);
  const w = 320;
  const padL = 34;
  const padB = 22;
  const padT = 16;
  const max = Math.max(...data.map((d) => d.value), 1);
  const step = Math.ceil(max / 3);
  const niceMax = step * 3;
  const chartH = height - padB - padT;
  const bandW = (w - padL) / data.length;
  const barW = Math.min(26, bandW * 0.55);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  const y = (v: number) => padT + chartH - (v / niceMax) * chartH;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" className="overflow-visible">
      <defs>
        <linearGradient id="bar-lo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe0e6" />
          <stop offset="100%" stopColor="#ffb8c6" />
        </linearGradient>
        <linearGradient id="bar-hi" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffb0c0" />
          <stop offset="100%" stopColor="#ff7a95" />
        </linearGradient>
      </defs>

      {[0, 1, 2, 3].map((i) => {
        const val = niceMax - step * i;
        const yy = padT + (chartH / 3) * i;
        return (
          <g key={i}>
            <line
              x1={padL}
              y1={yy}
              x2={w}
              y2={yy}
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray={i === 3 ? undefined : "3 3"}
            />
            <text
              x={padL - 6}
              y={yy + 3}
              textAnchor="end"
              fontSize={9}
              fill="var(--muted-foreground)"
            >
              {val}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const bx = padL + bandW * i + (bandW - barW) / 2;
        const top = y(d.value);
        const isActive = active === i;
        return (
          <g key={d.label}>
            <rect
              x={bx}
              y={top}
              width={barW}
              height={padT + chartH - top}
              rx={4}
              fill={
                isActive || d.highlight ? "url(#bar-hi)" : "url(#bar-lo)"
              }
              opacity={active !== null && !isActive ? 0.55 : 1}
              className="animate-bar transition-opacity"
              style={{ animationDelay: `${i * 0.07}s` }}
            />
            <text
              x={bx + barW / 2}
              y={height - 6}
              textAnchor="middle"
              fontSize={9}
              fontWeight={isActive ? 600 : 400}
              fill={isActive ? "var(--foreground)" : "var(--muted-foreground)"}
            >
              {d.label}
            </text>
            {/* hit area over the whole band */}
            <rect
              x={padL + bandW * i}
              y={padT}
              width={bandW}
              height={chartH}
              fill="transparent"
              className="cursor-pointer"
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
            />
          </g>
        );
      })}

      {/* tooltip */}
      {active !== null &&
        (() => {
          const d = data[active];
          const bx =
            padL + bandW * active + (bandW - barW) / 2 + barW / 2;
          const tw = 70;
          const th = 34;
          const tx = Math.min(w - tw - 2, Math.max(2, bx - tw / 2));
          let ty = y(d.value) - th - 8;
          if (ty < 0) ty = y(d.value) + 8;
          const pct = Math.round((d.value / total) * 100);
          return (
            <g className="pointer-events-none">
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
                fontSize={12}
                fontWeight={700}
                fill="var(--foreground)"
              >
                {d.value}
                {unit && (
                  <tspan fontSize={9} fontWeight={400} fill="var(--muted-foreground)">
                    {" "}
                    {unit}
                  </tspan>
                )}
              </text>
              <text
                x={tx + tw / 2}
                y={ty + 27}
                textAnchor="middle"
                fontSize={9}
                fill="var(--muted-foreground)"
              >
                {pct}% ของทั้งหมด
              </text>
            </g>
          );
        })()}
    </svg>
  );
}

// ── Donut chart (pastel gradient + draw-in + hover) ─────────────────────
interface DonutDatum {
  label: string;
  value: number;
  color?: string;
}

const PASTEL = [
  { id: "d-rose", from: "#ffb0c0", to: "#ff6f91", solid: "#ff7f9c" },
  { id: "d-mint", from: "#b6f0d4", to: "#57cc99", solid: "#42c088" },
  { id: "d-peach", from: "#ffe1b8", to: "#ffb26b", solid: "#ffab5e" },
  { id: "d-lav", from: "#d8caf7", to: "#9f86e0", solid: "#9a80e0" },
  { id: "d-sky", from: "#bfe3ff", to: "#74c0fc", solid: "#66b7fb" },
];

export function DonutChart({
  data,
  centerValue,
  centerLabel,
}: {
  data: DonutDatum[];
  centerValue: string;
  centerLabel: string;
}) {
  const [active, setActive] = React.useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = 55;
  const C = 2 * Math.PI * r;
  let acc = 0;

  const activePct =
    active !== null ? Math.round((data[active].value / total) * 100) : 0;

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 160 160" width={150} className="shrink-0">
        <defs>
          {PASTEL.map((p) => (
            <linearGradient key={p.id} id={p.id} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={p.from} />
              <stop offset="100%" stopColor={p.to} />
            </linearGradient>
          ))}
        </defs>

        <circle
          cx={80}
          cy={80}
          r={r}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={26}
        />

        {data.map((d, i) => {
          const len = (d.value / total) * C;
          const startAngle = (acc / total) * 360;
          acc += d.value;
          const p = PASTEL[i % PASTEL.length];
          const isActive = active === i;
          return (
            <circle
              key={d.label}
              cx={80}
              cy={80}
              r={r}
              fill="none"
              stroke={`url(#${p.id})`}
              strokeWidth={isActive ? 31 : 26}
              strokeLinecap="butt"
              strokeDasharray={`${len} ${C}`}
              transform={`rotate(${-90 + startAngle} 80 80)`}
              opacity={active !== null && !isActive ? 0.35 : 1}
              className="animate-donut cursor-pointer transition-[stroke-width,opacity]"
              style={
                {
                  "--seg-len": len,
                  animationDelay: `${i * 0.14}s`,
                } as React.CSSProperties
              }
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
            />
          );
        })}

        <g className="animate-pop pointer-events-none" style={{ animationDelay: "0.35s" }}>
          <text
            x={80}
            y={active !== null ? 74 : 76}
            textAnchor="middle"
            fontSize={22}
            fontWeight={700}
            fill="var(--foreground)"
          >
            {active !== null ? `${activePct}%` : centerValue}
          </text>
          <text
            x={80}
            y={active !== null ? 90 : 94}
            textAnchor="middle"
            fontSize={active !== null ? 9 : 10}
            fill="var(--muted-foreground)"
          >
            {active !== null ? data[active].label : centerLabel}
          </text>
          {active !== null && (
            <text
              x={80}
              y={101}
              textAnchor="middle"
              fontSize={9}
              fontWeight={600}
              fill="var(--foreground)"
            >
              {data[active].value} งาน
            </text>
          )}
        </g>
      </svg>

      <div className="flex flex-col gap-1 text-[0.8rem]">
        {data.map((d, i) => {
          const pct = Math.round((d.value / total) * 100);
          return (
            <div
              key={d.label}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              className={`flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors cursor-pointer ${
                active === i ? "bg-muted" : ""
              }`}
            >
              <span
                className="size-2.5 rounded-[3px] shrink-0"
                style={{ background: PASTEL[i % PASTEL.length].solid }}
              />
              <span className="text-muted-foreground">{d.label}</span>
              <span className="ml-auto flex items-center gap-1.5">
                <span className="font-semibold">{d.value}</span>
                <span className="text-[0.7rem] text-muted-foreground">
                  {pct}%
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
