"use client";

import { useState } from "react";
import Link from "next/link";
import StatCard from "@/app/components/StatCard";
import DataTable from "@/app/components/DataTable";
import { DonutChart, SimpleBarChart, DualLineChart } from "@/app/components/charts";
import Reveal from "@/app/components/Reveal";
import MiniScheduleCalendar from "@/app/components/MiniScheduleCalendar";
import {
  IconBriefcase, IconClock, IconCheckCircle, IconAlertTriangle, IconShield,
  IconPlus, IconCalendar, IconLink, IconActivity, IconDollar,
} from "@/app/components/icons";
import {
  jobStatusLabel, jobStatusBadgeClass, chartBlueShades, scopeJobsToSession,
} from "@/app/lib/mockData";
import { useJobs, useJobTypes, useTeams, useSyncStatus, useWarranties, useAuditLogs } from "@/app/lib/store";
import { useAuth } from "@/app/lib/auth";
import { formatDateTH, formatTHB, formatDateTimeTH } from "@/app/lib/format";

const TODAY_ISO = "2026-07-03";

// Whole days from today until an ISO date (e.g. a warranty end date).
function daysUntil(iso) {
  if (!iso) return 0;
  const [ty, tm, td] = TODAY_ISO.split("-").map(Number);
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(ty, tm - 1, td)) / 86400000);
}

const TH_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function isoDaysAgo(iso) {
  if (!iso) return null;
  return -daysUntil(iso); // whole days from the ISO date up to today
}

// Ordered buckets ending at "today", plus a function mapping an ISO date to its
// bucket index. Granularity ∈ "week" | "month" | "year".
function buildBuckets(granularity) {
  const [ty, tm] = TODAY_ISO.split("-").map(Number);
  if (granularity === "week") {
    const COUNT = 8; // last 8 weeks
    const labels = [];
    for (let idx = COUNT - 1; idx >= 0; idx--) {
      const startAgo = idx * 7 + 6; // start day of the week bucket (idx weeks back)
      const [ry, rm, rd] = TODAY_ISO.split("-").map(Number);
      const start = new Date(Date.UTC(ry, rm - 1, rd - startAgo));
      labels.push(`${start.getUTCDate()} ${TH_MONTHS_SHORT[start.getUTCMonth()]}`);
    }
    return {
      labels,
      indexOf: (iso) => {
        const ago = isoDaysAgo(iso);
        if (ago == null || ago < 0) return -1;
        const idx = Math.floor(ago / 7);
        return idx < COUNT ? COUNT - 1 - idx : -1;
      },
    };
  }
  if (granularity === "year") {
    const COUNT = 3; // last 3 years
    const labels = [];
    for (let idx = COUNT - 1; idx >= 0; idx--) labels.push(String(ty - idx + 543));
    return {
      labels,
      indexOf: (iso) => {
        if (!iso) return -1;
        const y = Number(iso.slice(0, 4));
        const idx = ty - y;
        return idx >= 0 && idx < COUNT ? COUNT - 1 - idx : -1;
      },
    };
  }
  // month — last 12 calendar months
  const COUNT = 12;
  const labels = [];
  for (let idx = COUNT - 1; idx >= 0; idx--) {
    const m0 = tm - 1 - idx; // may go negative → wraps to prior year
    const month = ((m0 % 12) + 12) % 12;
    labels.push(TH_MONTHS_SHORT[month]);
  }
  return {
    labels,
    indexOf: (iso) => {
      if (!iso) return -1;
      const y = Number(iso.slice(0, 4));
      const m = Number(iso.slice(5, 7));
      const idx = (ty * 12 + tm) - (y * 12 + m);
      return idx >= 0 && idx < COUNT ? COUNT - 1 - idx : -1;
    },
  };
}

const TREND_RANGES = [
  { key: "week", label: "รายสัปดาห์" },
  { key: "month", label: "รายเดือน" },
  { key: "year", label: "รายปี" },
];

export default function CoordinatorDashboardPage() {
  const { session } = useAuth();
  const [trendRange, setTrendRange] = useState("month");
  const [allJobs] = useJobs();
  // This dashboard is the coordinator's own overview, so it's scoped to their
  // jobs (an admin/executive visiting the URL still sees everything).
  const jobs = scopeJobsToSession(allJobs, session);
  const [jobTypes] = useJobTypes();
  const [teams] = useTeams();
  const [syncStatus] = useSyncStatus();
  const [warranties] = useWarranties();
  const [auditLogs] = useAuditLogs();

  const total = jobs.length;
  const inProgress = jobs.filter((j) => j.status === "in_progress").length;
  const done = jobs.filter((j) => j.status === "done").length;
  const repair = jobs.filter((j) => j.status === "repair").length;

  // Overdue = jobs still in progress whose scheduled date has already passed.
  const overdueJobs = jobs.filter((j) => j.status === "in_progress" && j.scheduledDate < TODAY_ISO).length;
  const overduePct = inProgress ? Math.round((overdueJobs / inProgress) * 100) : 0;

  // Money still owed to us across the coordinator's own jobs.
  const outstandingList = jobs.filter((j) => j.paymentStatus !== "ชำระแล้ว");
  const outstandingValue = outstandingList.reduce((s, j) => s + j.amount, 0);

  const urgent = jobs
    .filter((j) => j.status === "in_progress")
    .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
    .slice(0, 6);

  const warrantyNearExpiry = [...warranties]
    .filter((w) => w.status === "active")
    .sort((a, b) => a.percentLeft - b.percentLeft)
    .slice(0, 4);

  const recentActivity = auditLogs.slice(0, 5);

  // Job progress trend (burn-up): cumulative jobs opened vs. cumulative jobs
  // completed across each period, so the completed line climbing toward the
  // total line shows how work is progressing. Bucketed weekly / monthly / yearly.
  const buckets = buildBuckets(trendRange);
  const perBucket = buckets.labels.map(() => ({ opened: 0, completed: 0 }));
  jobs.forEach((j) => {
    const oi = buckets.indexOf(j.createdDate);
    if (oi >= 0) perBucket[oi].opened += 1;
    if (j.closedDate) {
      const ci = buckets.indexOf(j.closedDate);
      if (ci >= 0) perBucket[ci].completed += 1;
    }
  });
  let cumOpened = 0;
  let cumCompleted = 0;
  const trendData = buckets.labels.map((label, k) => {
    cumOpened += perBucket[k].opened;
    cumCompleted += perBucket[k].completed;
    return { label, opened: cumOpened, completed: cumCompleted };
  });
  const windowOpened = cumOpened;
  const windowCompleted = cumCompleted;
  const progressPct = windowOpened ? Math.round((windowCompleted / windowOpened) * 100) : 0;
  const trendMaxLabels = trendRange === "month" ? 7 : undefined;

  // Mini KPI sparklines — recent 12-month cumulative trend per metric, so each
  // card carries a little shape like the reference dashboards.
  const sparkB = buildBuckets("month");
  const sCells = sparkB.labels.map(() => ({ opened: 0, completed: 0, overdue: 0, unpaid: 0 }));
  jobs.forEach((j) => {
    const oi = sparkB.indexOf(j.createdDate);
    if (oi >= 0) sCells[oi].opened += 1;
    if (j.closedDate) {
      const ci = sparkB.indexOf(j.closedDate);
      if (ci >= 0) sCells[ci].completed += 1;
    }
    if (j.paymentStatus !== "ชำระแล้ว") {
      const ui = sparkB.indexOf(j.createdDate);
      if (ui >= 0) sCells[ui].unpaid += j.amount || 0;
    }
    if (j.status === "in_progress" && j.scheduledDate < TODAY_ISO) {
      const vi = sparkB.indexOf(j.createdDate);
      if (vi >= 0) sCells[vi].overdue += 1;
    }
  });
  let aO = 0, aC = 0, aV = 0, aU = 0;
  const sparkTotal = [], sparkWip = [], sparkDone = [], sparkOverdue = [], sparkOutstanding = [];
  sCells.forEach((w) => {
    aO += w.opened; aC += w.completed; aV += w.overdue; aU += w.unpaid;
    sparkTotal.push(aO);
    sparkDone.push(aC);
    sparkWip.push(Math.max(0, aO - aC));
    sparkOverdue.push(aV);
    sparkOutstanding.push(Math.round(aU / 1000));
  });

  // Computed live from the actual (scoped) jobs list — not jobTypes[].count,
  // which is a static seed figure that drifts the moment a job changes.
  const jobTypeCounts = jobTypes
    .map((jt, i) => ({ label: jt.name.split(" (")[0], value: jobs.filter((j) => j.jobType === jt.name).length, color: chartBlueShades[i % chartBlueShades.length] }))
    .filter((s) => s.value > 0);

  // Computed live from the actual (scoped) jobs list — stays accurate as jobs
  // are added, reassigned, or deleted on the Job Management page.
  const teamJobCounts = teams.map((t, i) => ({
    label: t.name.replace("ทีมช่าง", "").split(" (")[0].trim(),
    value: jobs.filter((j) => (j.teams || [j.team]).includes(t.name)).length,
    color: chartBlueShades[i % chartBlueShades.length],
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>ภาพรวมของฉัน</h2>
          <p>สวัสดี {session?.name || "นภัสสร"} — สรุปสถานะงานในความรับผิดชอบของคุณ การเงิน และบริการหลังการขาย ณ วันที่ 3 กรกฎาคม 2569</p>
        </div>
        <div className="page-actions">
          <Link href="/coordinator/jobs" className="btn btn-default btn-sm">
            <IconPlus size={14} /> เปิดงานใหม่
          </Link>
          <Link href="/coordinator/schedule" className="btn btn-outline btn-sm">
            <IconCalendar size={14} /> จัดทำแผนงาน
          </Link>
          <Link href="/coordinator/links" className="btn btn-outline btn-sm">
            <IconLink size={14} /> สร้างลิงก์
          </Link>
        </div>
      </div>

      {/* Headline KPIs — all scoped to the coordinator's own jobs */}
      <div className="kpi-grid">
        <StatCard
          animate label="งานทั้งหมดของฉัน" value={total}
          icon={<IconBriefcase size={19} />}
          deltaText="+3 งานใหม่สัปดาห์นี้" deltaTone="success" deltaTrend="up"
          trend={sparkTotal} trendColor="#2563eb" trendId="k-total"
        />
        <StatCard
          animate label="กำลังดำเนินการ" value={inProgress}
          icon={<IconClock size={19} />}
          deltaText="ติดตามใกล้ชิด" deltaTone="warning"
          trend={sparkWip} trendColor="#d97706" trendId="k-wip"
        />
        <StatCard
          animate label="เสร็จสิ้นแล้ว" value={done}
          icon={<IconCheckCircle size={19} />}
          deltaText="ปิดงานเรียบร้อย" deltaTone="success"
          trend={sparkDone} trendColor="#16a34a" trendId="k-done"
        />
        <StatCard
          animate label="งานเกินกำหนด" value={overdueJobs}
          subLabel={`${overduePct}% ของงานที่กำลังทำ`}
          icon={<IconAlertTriangle size={19} />}
          deltaText={overdueJobs > 0 ? "ควรติดตามด่วน" : "ไม่มีงานค้าง"}
          deltaTone={overdueJobs > 0 ? "destructive" : "success"}
          trend={sparkOverdue} trendColor="#dc2626" trendId="k-overdue"
        />
        <StatCard
          animate label="เงินค้างรับ" value={formatTHB(outstandingValue)}
          subLabel={`${outstandingList.length} งานยังไม่เก็บเงิน`}
          icon={<IconDollar size={19} />}
          deltaText="รอเก็บ" deltaTone="warning"
          trend={sparkOutstanding} trendColor="#d97706" trendId="k-outstanding"
        />
      </div>

      {/* Job flow trend — full width, with weekly / monthly / yearly toggle */}
      <div className="ds-card chart-card-wrap section-block">
        <div className="ds-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", flexWrap: "wrap" }}>
          <div>
            <div className="ds-card-title">แนวโน้มความคืบหน้าของงาน</div>
            <div className="ds-card-desc">
              งานสะสมที่เข้าระบบเทียบกับงานที่ปิดเสร็จสะสม · ความคืบหน้ารวม {progressPct}% ({windowCompleted}/{windowOpened} งาน) ในช่วงที่เลือก
            </div>
          </div>
          <div className="seg-control" role="group" aria-label="ช่วงเวลา">
            {TREND_RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                className={`seg-btn ${trendRange === r.key ? "active" : ""}`}
                onClick={() => setTrendRange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="ds-card-content">
          <DualLineChart
            data={trendData}
            series={[
              { key: "opened", label: "งานสะสมทั้งหมด", color: "#2563eb" },
              { key: "completed", label: "งานที่เสร็จสะสม", color: "#16a34a" },
            ]}
            id="jobflow"
            width={760}
            height={200}
            maxLabels={trendMaxLabels}
          />
        </div>
      </div>

      {/* Analysis & action — two stacked columns.
          Left: team workload + urgent jobs.
          Right: job types + mini schedule calendar + warranty tracking. */}
      <div className="exec-2col section-block">
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", minWidth: 0 }}>
          <Reveal>
            <div className="ds-card">
              <div className="ds-card-header">
                <div className="ds-card-title">จำนวนงานตามทีมช่าง</div>
                <div className="ds-card-desc">การกระจายงานในความรับผิดชอบตามทีมช่าง</div>
              </div>
              <div className="ds-card-content">
                <SimpleBarChart data={teamJobCounts} unit="งาน" />
              </div>
            </div>
          </Reveal>

          <div className="ds-card">
            <div className="ds-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div className="ds-card-title flex-row"><IconClock size={15} /> งานที่ต้องทำทันที</div>
              <span className="badge badge-warning">{urgent.length} งาน</span>
            </div>
            <div className="ds-card-content" style={{ paddingTop: "0.4rem" }}>
              {urgent.length === 0 ? (
                <div className="text-sm text-muted" style={{ padding: "0.5rem 0" }}>ไม่มีงานที่กำลังดำเนินการในขณะนี้</div>
              ) : (
                urgent.map((j) => (
                  <Link key={j.id} href={`/coordinator/jobs/${j.id}`} className="list-row">
                    <div className="list-row-main">
                      <div className="list-row-title">{j.id} · {j.customer}</div>
                      <div className="list-row-sub">นัดหมาย {formatDateTH(j.scheduledDate)}</div>
                    </div>
                    <span className={`badge ${jobStatusBadgeClass(j.status)}`} style={{ flexShrink: 0 }}>{jobStatusLabel(j.status)}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", minWidth: 0 }}>
          <Reveal>
            <div className="ds-card">
              <div className="ds-card-header">
                <div className="ds-card-title">งานตามประเภท</div>
                <div className="ds-card-desc">สัดส่วนงานของคุณแยกตามประเภทบริการ · ชี้ที่วงเพื่อดูเปอร์เซ็นต์</div>
              </div>
              <div className="ds-card-content">
                <DonutChart
                  segments={jobTypeCounts}
                  centerLabel={total}
                  centerSub="งานทั้งหมด"
                />
              </div>
            </div>
          </Reveal>

          {/* Mini calendar bridging the gap — links through to Scheduling */}
          <MiniScheduleCalendar jobs={jobs} />

          <div className="ds-card">
            <div className="ds-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div className="ds-card-title flex-row"><IconShield size={15} /> ติดตามงานแจ้งซ่อม / ประกัน</div>
              <span className="badge badge-secondary">{warrantyNearExpiry.length} รายการ</span>
            </div>
            <div className="ds-card-content" style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              {warrantyNearExpiry.map((w) => {
                const daysLeft = daysUntil(w.endDate);
                return (
                  <div key={w.id}>
                    <div className="progress-label">
                      <span className="flex-row"><IconShield size={13} />{w.customer}</span>
                      <span style={{ fontWeight: 600 }}>เหลือ {daysLeft.toLocaleString("th-TH")} วัน</span>
                    </div>
                    <div className="progress-track">
                      <div className={`progress-bar ${w.percentLeft < 20 ? "danger" : w.percentLeft < 50 ? "secondary" : "success"}`} style={{ width: `${w.percentLeft}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mango sync — full width, kept below the action row */}
      <div className="section-block">
        <h3>ตารางติดตามสถานะการเงินและการส่งข้อมูล (Mango Sync)</h3>
        <DataTable
          columns={[
            { key: "docType", label: "ประเภทเอกสาร" },
            { key: "customer", label: "ลูกค้า" },
            { key: "direction", label: "ทิศทาง", render: (r) => (r.direction === "push" ? "Push → Mango" : "Pull ← Mango") },
            {
              key: "status", label: "สถานะ", render: (r) => (
                <span className="status-row">
                  <span className={`status-dot ${r.status}`} />
                  {r.status === "success" ? "สำเร็จ" : r.status === "pending" ? "กำลังส่งข้อมูล" : "ล้มเหลว"}
                </span>
              ),
            },
          ]}
          rows={syncStatus.slice(0, 5)}
        />
      </div>

      {/* Activity log */}
      <div className="section-block" style={{ marginTop: "1.25rem" }}>
        <h3 className="flex-row"><IconActivity size={15} /> กิจกรรมล่าสุด</h3>
        <div className="ds-card">
          <div className="ds-card-content" style={{ padding: "0.5rem 1.25rem" }}>
            {recentActivity.map((log, i) => (
              <div
                key={log.id}
                style={{
                  display: "flex", gap: "0.65rem", padding: "0.7rem 0",
                  borderTop: i === 0 ? "none" : "1px solid var(--border)",
                }}
              >
                <div className="avatar avatar-sm" style={{ flexShrink: 0 }}>{log.actor.slice(0, 1)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-sm" style={{ fontWeight: 500 }}>{log.action}</div>
                  <div className="text-xs text-muted">{log.actor} · {formatDateTimeTH(log.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
