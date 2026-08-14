"use client";

import { useState, useEffect, useRef } from "react";
import { CardSparkline } from "./charts";
import { IconArrowRight } from "./icons";

// deltaTrend controls the little up/down arrow — only pass it when deltaText
// is an actual trend (e.g. "+14%"), not for plain status captions like
// "ทุกสถานะ" or "ควรตรวจสอบ", which just take a color via deltaTone.
const ARROW_ROTATION = { up: -45, down: 45 };

// Count-up animation for a KPI value. Parses the numeric part out of whatever
// was passed (14 · "฿7,545,000" · "85%") so it keeps the currency prefix /
// percent suffix and thousands grouping, and animates just the number. Starts
// at 0 on both server and first client render (no hydration mismatch), then
// eases up to the target. Re-animates from the previous value when it changes.
function AnimatedNumber({ value, duration = 900 }) {
  const text = String(value);
  const match = text.match(/-?[\d,]*\d(?:\.\d+)?/);
  const target = match ? parseFloat(match[0].replace(/,/g, "")) : null;
  const prefix = match ? text.slice(0, match.index) : "";
  const suffix = match ? text.slice(match.index + match[0].length) : "";
  const decimals = match && match[0].includes(".") ? match[0].split(".")[1].length : 0;
  const grouped = match ? (match[0].includes(",") || target >= 1000) : false;

  const [current, setCurrent] = useState(0);
  const fromRef = useRef(0); // last shown value — where the next run starts from
  const rafRef = useRef(0);

  useEffect(() => {
    if (target == null) return undefined;
    const reduce = typeof window !== "undefined" && window.matchMedia
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { fromRef.current = target; setCurrent(target); return undefined; }

    // Read (don't overwrite) fromRef here so StrictMode's double-mount in dev
    // doesn't clobber the start value and collapse the animation to a jump.
    const from = fromRef.current;
    let start = null;
    function tick(ts) {
      if (start == null) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const v = from + (target - from) * eased;
      fromRef.current = v;
      setCurrent(v);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else { fromRef.current = target; setCurrent(target); }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  if (target == null) return <>{text}</>;

  const shown = decimals > 0
    ? current.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(current).toLocaleString(undefined, { useGrouping: grouped });
  return <>{prefix}{shown}{suffix}</>;
}

export default function StatCard({ label, subLabel, value, icon, deltaText, deltaTone = "success", deltaTrend, trend, trendColor = "var(--primary)", trendId, animate = false }) {
  return (
    <div className="ds-card stat-card">
      <div className="stat-card-top">
        {icon && <div className="stat-card-icon">{icon}</div>}
        {deltaText && (
          <span className={`stat-card-delta ${deltaTone}`}>
            {deltaTrend && (
              <IconArrowRight size={12} style={{ transform: `rotate(${ARROW_ROTATION[deltaTrend] ?? 0}deg)` }} />
            )}
            {deltaText}
          </span>
        )}
      </div>
      <div className="stat-card-value">{animate ? <AnimatedNumber value={value} /> : value}</div>
      <div className="stat-card-label">{label}</div>
      {subLabel && <div className="stat-card-sublabel">{subLabel}</div>}
      {trend && trend.length > 1 && (
        <div className="stat-card-trend"><CardSparkline data={trend} height={46} color={trendColor} id={trendId || label} /></div>
      )}
    </div>
  );
}
