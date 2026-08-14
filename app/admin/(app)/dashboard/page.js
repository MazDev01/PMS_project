"use client";

import { useState } from "react";
import Link from "next/link";
import StatCard from "@/app/components/StatCard";
import { AreaLineChart } from "@/app/components/charts";
import {
  IconUsers, IconShield, IconAlertTriangle, IconBriefcase, IconClock,
  IconCheckCircle, IconDollar, IconLink, IconTruck, IconArrowRight,
  IconPlus, IconTrash, IconFileText, IconCalendar, IconImage, IconRefresh, IconActivity,
} from "@/app/components/icons";
import { TODAY_ISO, revenueTarget } from "@/app/lib/mockData";
import {
  useAuditLogs, useJobs, useRepairTickets, useScheduleEvents, useTeams, useWarranties,
} from "@/app/lib/store";
import { formatDateTimeTH, formatTHB, formatDateTH, THAI_MONTHS } from "@/app/lib/format";

// UTC-safe date shift (hydration-stable) for the rolling-window / on-time math.
function isoShift(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

const DATE_RANGES = [
  { key: "7d", label: "7 วัน" },
  { key: "30d", label: "30 วัน" },
  { key: "90d", label: "90 วัน" },
  { key: "ytd", label: "ปีนี้" },
  { key: "all", label: "ทั้งหมด" },
  { key: "custom", label: "กำหนดเอง" },
];

function resolveRange(key, customFrom, customTo) {
  if (key === "custom") return { fromISO: customFrom || "2000-01-01", toISO: customTo || TODAY_ISO };
  if (key === "all") return { fromISO: "2000-01-01", toISO: "9999-12-31" };
  if (key === "ytd") return { fromISO: `${TODAY_ISO.slice(0, 4)}-01-01`, toISO: TODAY_ISO };
  const days = key === "7d" ? 7 : key === "90d" ? 90 : 30;
  return { fromISO: isoShift(TODAY_ISO, -days), toISO: TODAY_ISO };
}

function activityIcon(action) {
  if (action.includes("เปิดงาน") || action.includes("วางแผนงาน")) return <IconPlus size={14} />;
  if (action.includes("ลบ")) return <IconTrash size={14} />;
  if (action.includes("ปิดงาน")) return <IconCheckCircle size={14} />;
  if (action.includes("สร้างลิงก์") || action.includes("ยกเลิกลิงก์")) return <IconLink size={14} />;
  if (action.includes("เซ็นอนุมัติ")) return <IconFileText size={14} />;
  if (action.includes("ยืนยันวันนัดหมาย")) return <IconCalendar size={14} />;
  if (action.includes("อัปโหลด") || action.includes("รูป")) return <IconImage size={14} />;
  if (action.includes("แจ้งซ่อม")) return <IconAlertTriangle size={14} />;
  if (action.includes("ผู้ใช้งาน")) return <IconUsers size={14} />;
  if (action.includes("ส่งข้อมูลใหม่") || action.includes("ซิงค์")) return <IconRefresh size={14} />;
  return <IconActivity size={14} />;
}

function progressClass(pct) {
  if (pct >= 90) return "success";
  if (pct >= 70) return "secondary";
  return "danger";
}
function attainmentBadgeClass(pct) {
  if (pct >= 90) return "badge-success";
  if (pct >= 70) return "badge-warning";
  return "badge-destructive";
}
function priorityMeta(p) {
  return { high: { cls: "badge-destructive", label: "สูง" }, medium: { cls: "badge-warning", label: "กลาง" }, low: { cls: "badge-secondary", label: "ต่ำ" } }[p]
    || { cls: "badge-secondary", label: p };
}

function IndicatorRow({ icon, title, pct, sub, href }) {
  return (
    <Link href={href} className="indicator-row">
      <span className="indicator-icon">{icon}</span>
      <div className="indicator-main">
        <div className="indicator-top">
          <span className="indicator-label">{title}</span>
          <span className="indicator-pct">{pct}%</span>
        </div>
        <div className="progress-track">
          <div className={`progress-bar ${progressClass(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <div className="indicator-sub">{sub}</div>
      </div>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [auditLogs] = useAuditLogs();
  const [jobs] = useJobs();
  const [repairTickets] = useRepairTickets();
  const [scheduleEvents] = useScheduleEvents();
  const [teams] = useTeams();
  const [warranties] = useWarranties();

  const [rangeKey, setRangeKey] = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { fromISO, toISO } = resolveRange(rangeKey, customFrom, customTo);
  const inRange = (iso) => iso >= fromISO && iso <= toISO;

  // Date-scoped sets (drive the KPIs, indicators, team performance)
  const fjobs = jobs.filter((j) => inRange(j.createdDate));
  const fSchedule = scheduleEvents.filter((e) => inRange(e.date));
  const fTickets = repairTickets.filter((t) => inRange(t.reportedDate));

  const totalJobs = fjobs.length;
  const inProgressJobs = fjobs.filter((j) => j.status === "in_progress").length;
  const doneJobs = fjobs.filter((j) => j.status === "done").length;
  const repairJobs = fjobs.filter((j) => j.status === "repair").length;

  // Headline KPIs
  const newJobsValue = fjobs.reduce((s, j) => s + j.amount, 0);
  const revenueInRange = fjobs.filter((j) => j.status === "done").reduce((s, j) => s + j.amount, 0);
  const outstandingList = fjobs.filter((j) => j.paymentStatus === "รอชำระ");
  const outstandingValue = outstandingList.reduce((s, j) => s + j.amount, 0);
  const overdueJobs = fjobs.filter((j) => j.status === "in_progress" && j.scheduledDate < TODAY_ISO).length;
  const overduePct = inProgressJobs ? Math.round((overdueJobs / inProgressJobs) * 100) : 0;
  const completedCount = doneJobs + repairJobs;
  const claimRate = completedCount ? Math.round((repairJobs / completedCount) * 100) : 0;

  // Indicators
  const signedCount = fjobs.filter((j) => j.quotationSigned).length;
  const conversionPct = totalJobs ? Math.round((signedCount / totalJobs) * 100) : 0;
  const pendingApproval = totalJobs - signedCount;

  const confirmedEv = fSchedule.filter((e) => e.status === "confirmed").length;
  const pendingEv = fSchedule.filter((e) => e.status === "pending").length;
  const confirmPct = confirmedEv + pendingEv > 0 ? Math.round((confirmedEv / (confirmedEv + pendingEv)) * 100) : 0;

  const completedJobsList = fjobs.filter((j) => j.status === "done" || j.status === "repair");
  const docsCompleteCount = completedJobsList.filter((j) => j.docsComplete).length;
  const docPct = completedJobsList.length ? Math.round((docsCompleteCount / completedJobsList.length) * 100) : 0;
  const docRisk = completedJobsList.filter((j) => !j.docsComplete).length;

  const doneListF = fjobs.filter((j) => j.status === "done");
  const onTimeCount = doneListF.filter((j) => j.closedDate && j.closedDate <= isoShift(j.scheduledDate, 3)).length;
  const onTimePct = doneListF.length ? Math.round((onTimeCount / doneListF.length) * 100) : 0;
  const activeTeams = new Set(fjobs.filter((j) => j.status === "in_progress").map((j) => j.team)).size;

  const openRepairInRange = fTickets.filter((t) => t.status !== "closed").length;
  const paidValue = fjobs.filter((j) => j.paymentStatus === "ชำระแล้ว").reduce((s, j) => s + j.amount, 0);
  const totalValue = fjobs.reduce((s, j) => s + j.amount, 0);
  const collectedPct = totalValue ? Math.round((paidValue / totalValue) * 100) : 0;
  const noClaimPct = 100 - claimRate;

  const indicators = [
    { icon: <IconFileText size={16} />, title: "การขาย & อนุมัติ", pct: conversionPct, sub: `ลูกค้าอนุมัติแล้ว · รออนุมัติ ${pendingApproval} งาน`, href: "/coordinator/links" },
    { icon: <IconCalendar size={16} />, title: "ตารางงาน & การยืนยัน", pct: confirmPct, sub: `ยืนยันตารางแล้ว · รอยืนยัน ${pendingEv} คิว`, href: "/coordinator/schedule" },
    { icon: <IconImage size={16} />, title: "คุณภาพงานหน้างาน", pct: docPct, sub: `เอกสารครบ · เสี่ยง dispute ${docRisk} งาน`, href: "/admin/team-evidence" },
    { icon: <IconDollar size={16} />, title: "การเงิน & เก็บเงิน", pct: collectedPct, sub: `เก็บเงินแล้ว · ค้างรับ ${formatTHB(outstandingValue)}`, href: "/coordinator/closing" },
    { icon: <IconTruck size={16} />, title: "ปฏิบัติการ (Operations)", pct: onTimePct, sub: `ส่งงานตรงเวลา · ${activeTeams} ทีมกำลังทำงาน`, href: "/admin/team-dispatch" },
    { icon: <IconShield size={16} />, title: "ประกัน & เคลม", pct: noClaimPct, sub: `งานไม่มีเคลม · เปิด ${openRepairInRange} เคส`, href: "/coordinator/warranty" },
  ];

  const teamPerformance = teams.map((t) => {
    const actual = fjobs.filter((j) => (j.teams || [j.team]).includes(t.name) && (j.status === "in_progress" || j.status === "done")).length;
    const target = t.monthlyJobTarget || 1;
    const pct = Math.round((actual / target) * 100);
    return { id: t.id, name: t.name, actual, target, pct };
  });
  const totalActual = teamPerformance.reduce((s, t) => s + t.actual, 0);
  const totalTarget = teamPerformance.reduce((s, t) => s + t.target, 0);
  const totalPct = totalTarget ? Math.round((totalActual / totalTarget) * 100) : 0;
  // Show the 6 lowest-attainment teams (those needing attention) so the card
  // stays the same length as the 6-row indicators card beside it; the rest are
  // one click away on the full contractor overview.
  const teamPerformanceTop = [...teamPerformance].sort((a, b) => a.pct - b.pct).slice(0, 6);

  // Revenue trend — computed straight from real completed jobs (by close month)
  // within the selected date range, so the chart reflects actual revenue and
  // follows the page filter. No presentation shaping — the line is whatever the
  // data says, ups and downs included.
  const revByMonth = {};
  jobs
    .filter((j) => j.status === "done" && j.closedDate && inRange(j.closedDate))
    .forEach((j) => {
      const k = j.closedDate.slice(0, 7);
      revByMonth[k] = (revByMonth[k] || 0) + j.amount;
    });
  const revenueSeries = Object.keys(revByMonth).sort().map((k) => ({
    label: THAI_MONTHS[Number(k.slice(5, 7)) - 1],
    value: revByMonth[k],
  }));
  const hasTrend = revenueSeries.length >= 2;
  const lastRev = hasTrend ? revenueSeries[revenueSeries.length - 1].value : 0;
  const prevRev = hasTrend ? revenueSeries[revenueSeries.length - 2].value : 0;
  const revenueGrowthPct = hasTrend && prevRev ? Math.round(((lastRev - prevRev) / prevRev) * 100) : 0;

  // Current-state (NOT date-filtered) — action items must always show all pending
  const closableJobs = jobs.filter((j) => j.status === "in_progress" && j.paymentStatus === "ชำระแล้ว");
  const openTicketsList = repairTickets.filter((t) => t.status !== "closed");

  const recentLogs = auditLogs.slice(0, 5);
  const rangeLabel = rangeKey === "all" ? "ทั้งหมด" : `${formatDateTH(fromISO)} — ${formatDateTH(toISO)}`;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>ภาพรวมทั้งหมด</h2>
          <p>Executive Dashboard — ตัวชี้วัดสำคัญของธุรกิจในที่เดียว กดแต่ละส่วนเพื่อดูรายละเอียดเชิงลึก</p>
        </div>
      </div>

      {/* Date range filter (scopes KPIs + indicators + team performance) */}
      <div className="filter-bar" style={{ marginBottom: "1.5rem" }}>
        <div className="ds-tab-list">
          {DATE_RANGES.map((r) => (
            <button key={r.key} type="button" className={`ds-tab ${rangeKey === r.key ? "active" : ""}`} onClick={() => setRangeKey(r.key)}>
              {r.label}
            </button>
          ))}
        </div>
        {rangeKey === "custom" && (
          <div className="flex-row" style={{ gap: "0.5rem" }}>
            <input className="ds-input" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} style={{ maxWidth: 160 }} aria-label="วันเริ่มต้น" />
            <span className="text-xs text-muted">ถึง</span>
            <input className="ds-input" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} style={{ maxWidth: 160 }} aria-label="วันสิ้นสุด" />
          </div>
        )}
        <div className="text-xs text-muted flex-row" style={{ marginLeft: "auto", gap: "0.35rem" }}>
          <IconCalendar size={13} /> {rangeLabel}
        </div>
      </div>

      {/* Headline KPIs */}
      <div className="kpi-grid">
        <StatCard animate label="มูลค่างานเข้าใหม่" subLabel={`${totalJobs} งานในช่วงที่เลือก`} value={formatTHB(newJobsValue)} icon={<IconBriefcase size={18} />} deltaText="รับงานเข้า" deltaTone="secondary" />
        <StatCard animate label="มูลค่างานที่ปิดสำเร็จ" subLabel={`${doneJobs} งานปิดในช่วงนี้`} value={formatTHB(revenueInRange)} icon={<IconDollar size={18} />} deltaText="รายรับในช่วง" deltaTone="success" />
        <StatCard animate label="เงินค้างรับ" subLabel={`${outstandingList.length} งานยังไม่เก็บเงิน`} value={formatTHB(outstandingValue)} icon={<IconClock size={18} />} deltaText="รอเก็บ" deltaTone="warning" />
        <StatCard animate label="งานเกินกำหนดนัดหมาย" subLabel={`${overdueJobs} จาก ${inProgressJobs} งานที่กำลังทำ`} value={`${overduePct}%`} icon={<IconAlertTriangle size={18} />} deltaText={overdueJobs > 0 ? "ควรติดตามด่วน" : "ไม่มีงานค้าง"} deltaTone={overdueJobs > 0 ? "destructive" : "success"} />
        <StatCard animate label="อัตราแจ้งเคลม" subLabel={`${repairJobs} เคลม จาก ${completedCount} งานที่เสร็จ`} value={`${claimRate}%`} icon={<IconShield size={18} />} deltaText="หลังส่งมอบ" deltaTone={claimRate > 15 ? "warning" : "success"} />
      </div>

      {/* Revenue trend — full width, follows the page date filter */}
      <div className="ds-card chart-card-wrap section-block">
        <div className="ds-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
          <div>
            <div className="ds-card-title">แนวโน้มรายรับ</div>
            <div className="ds-card-desc">
              {hasTrend
                ? `${revenueSeries[0].label} — ${revenueSeries[revenueSeries.length - 1].label} · เป้า ${formatTHB(revenueTarget)}/เดือน`
                : "มูลค่างานที่ปิดสำเร็จรายเดือน (ตามช่วงเวลาที่เลือก)"}
            </div>
          </div>
          {hasTrend && (
            <span className={`badge ${revenueGrowthPct >= 0 ? "badge-success" : "badge-destructive"}`}>{revenueGrowthPct >= 0 ? "+" : ""}{revenueGrowthPct}% MoM</span>
          )}
        </div>
        <div className="ds-card-content">
          {hasTrend ? (
            <AreaLineChart data={revenueSeries} id="admin-revenue" color="#2563eb" width={760} height={180} maxLabels={7} valueFormatter={(v) => `${Math.round(v / 1000)}k`} />
          ) : (
            <div className="text-sm text-muted" style={{ padding: "2.5rem 0", textAlign: "center" }}>
              ช่วงเวลาที่เลือกสั้นเกินไปสำหรับแสดงแนวโน้มรายเดือน — ลองเลือกช่วงกว้างขึ้น (เช่น 90 วัน / ปีนี้ / ทั้งหมด)
            </div>
          )}
        </div>
      </div>

      {/* Analysis row — indicators · team performance */}
      <div className="exec-2col section-block">
        {/* Team performance */}
        <div className="ds-card">
          <div className="ds-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="ds-card-title">ผลงานทีมช่างเทียบเป้า</div>
              <div className="ds-card-desc">Actual vs Target · ทีมที่ต่ำกว่าเป้าก่อน</div>
            </div>
            <span className={`badge ${attainmentBadgeClass(totalPct)}`}>รวม {totalPct}%</span>
          </div>
          <div className="ds-card-content">
            <div className="teamperf-list">
              {teamPerformanceTop.map((t) => (
                <div key={t.id} className="teamperf-row">
                  <div className="progress-label">
                    <span>{t.name.replace("ทีมช่าง", "")}</span>
                    <span>{t.pct}%</span>
                  </div>
                  <div className="progress-track">
                    <div className={`progress-bar ${progressClass(t.pct)}`} style={{ width: `${Math.min(t.pct, 100)}%` }} />
                  </div>
                  <div className="text-xs text-muted" style={{ marginTop: "0.2rem" }}>{t.actual} / {t.target} งาน</div>
                </div>
              ))}
              {teamPerformance.length > teamPerformanceTop.length && (
                <Link href="/admin/team-performance" className="btn btn-sm btn-outline btn-block" style={{ marginTop: "0.35rem" }}>
                  ดูทั้งหมด {teamPerformance.length} ทีม <IconArrowRight size={13} />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Indicators */}
        <div className="ds-card">
          <div className="ds-card-header">
            <div className="ds-card-title">ตัวชี้วัดแต่ละส่วนงาน</div>
            <div className="ds-card-desc">กดแต่ละแถวเพื่อดูรายละเอียด</div>
          </div>
          <div className="ds-card-content">
            <div className="indicator-list">
              {indicators.map((ind) => <IndicatorRow key={ind.title} {...ind} />)}
            </div>
          </div>
        </div>
      </div>

      {/* Action row — closable jobs · repair tickets */}
      <div className="exec-2col section-block">
        {/* Closable jobs */}
        <div className="ds-card">
          <div className="ds-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div className="ds-card-title flex-row"><IconDollar size={15} /> งานรอ Confirm ปิดงาน</div>
            <span className="badge badge-warning">{closableJobs.length} งาน</span>
          </div>
          <div className="ds-card-content" style={{ paddingTop: "0.4rem" }}>
            {closableJobs.length === 0 ? (
              <div className="text-sm text-muted" style={{ padding: "0.5rem 0" }}>ไม่มีงานที่รอปิดในขณะนี้</div>
            ) : (
              <>
                {closableJobs.slice(0, 6).map((j) => (
                  <Link key={j.id} href={`/coordinator/jobs/${j.id}`} className="list-row">
                    <div className="list-row-main">
                      <div className="list-row-title">{j.id} · {j.customer}</div>
                      <div className="list-row-sub">{j.jobType}</div>
                    </div>
                    <div className="list-row-right" style={{ color: "var(--primary)" }}>{formatTHB(j.amount)}</div>
                  </Link>
                ))}
                <Link href="/coordinator/closing" className="btn btn-sm btn-default btn-block" style={{ marginTop: "0.75rem" }}>
                  ไปหน้าปิดงาน{closableJobs.length > 6 ? ` (อีก ${closableJobs.length - 6} งาน)` : ""} <IconArrowRight size={13} />
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Repair tickets */}
        <div className="ds-card">
          <div className="ds-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div className="ds-card-title flex-row"><IconShield size={15} /> เคสแจ้งซ่อมที่ยังไม่ปิด</div>
            <span className="badge badge-destructive">{openTicketsList.length} เคส</span>
          </div>
          <div className="ds-card-content" style={{ paddingTop: "0.4rem" }}>
            {openTicketsList.length === 0 ? (
              <div className="text-sm text-muted" style={{ padding: "0.5rem 0" }}>ไม่มีเคสแจ้งซ่อมที่เปิดอยู่</div>
            ) : (
              <>
                {openTicketsList.slice(0, 6).map((t) => {
                  const pm = priorityMeta(t.priority);
                  return (
                    <div key={t.id} className="list-row">
                      <div className="list-row-main">
                        <div className="list-row-title">{t.id} · {t.customer}</div>
                        <div className="list-row-sub">{t.issue}</div>
                      </div>
                      <span className={`badge ${pm.cls}`} style={{ flexShrink: 0 }}>{pm.label}</span>
                    </div>
                  );
                })}
                <Link href="/coordinator/warranty" className="btn btn-sm btn-outline btn-block" style={{ marginTop: "0.75rem" }}>
                  ไปหน้าบริการหลังการขาย{openTicketsList.length > 6 ? ` (อีก ${openTicketsList.length - 6} เคส)` : ""} <IconArrowRight size={13} />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Activity log */}
      <div className="section-block" style={{ marginTop: "1.25rem" }}>
        <h3 className="flex-row"><IconActivity size={15} /> ประวัติการใช้งานล่าสุด</h3>
        <div className="ds-card">
          <div className="ds-card-content" style={{ padding: "0.4rem 1.25rem" }}>
            {recentLogs.map((log) => (
              <div className="activity-row" key={log.id}>
                <div className="activity-avatar">{activityIcon(log.action)}</div>
                <div className="activity-body">
                  <div className="activity-action">{log.action}</div>
                  <div className="activity-meta">{log.actor} · {log.target}</div>
                </div>
                <div className="activity-time">{formatDateTimeTH(log.timestamp)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
