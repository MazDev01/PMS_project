import { Sparkline } from "./charts";
import { IconArrowRight } from "./icons";

// deltaTrend controls the little up/down arrow — only pass it when deltaText
// is an actual trend (e.g. "+14%"), not for plain status captions like
// "ทุกสถานะ" or "ควรตรวจสอบ", which just take a color via deltaTone.
const ARROW_ROTATION = { up: -45, down: 45 };

export default function StatCard({ label, subLabel, value, icon, deltaText, deltaTone = "success", deltaTrend, trend, trendColor = "var(--primary)" }) {
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
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {subLabel && <div className="stat-card-sublabel">{subLabel}</div>}
      {trend && trend.length > 1 && (
        <div className="stat-card-trend"><Sparkline data={trend} width={60} height={24} color={trendColor} /></div>
      )}
    </div>
  );
}
