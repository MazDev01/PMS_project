"use client";

import Link from "next/link";
import StatCard from "@/app/components/StatCard";
import DataTable from "@/app/components/DataTable";
import { DonutChart, SimpleBarChart } from "@/app/components/charts";
import ActionQueue from "@/app/components/ActionQueue";
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

export default function CoordinatorDashboardPage() {
  const { session } = useAuth();
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
          label="งานทั้งหมดของฉัน" value={total}
          icon={<IconBriefcase size={19} />}
          deltaText="+3 งานใหม่สัปดาห์นี้" deltaTone="success" deltaTrend="up"
        />
        <StatCard
          label="กำลังดำเนินการ" value={inProgress}
          icon={<IconClock size={19} />}
          deltaText="ติดตามใกล้ชิด" deltaTone="warning"
        />
        <StatCard
          label="เสร็จสิ้นแล้ว" value={done}
          icon={<IconCheckCircle size={19} />}
          deltaText="ปิดงานเรียบร้อย" deltaTone="success"
        />
        <StatCard
          label="งานเกินกำหนด" value={overdueJobs}
          subLabel={`${overduePct}% ของงานที่กำลังทำ`}
          icon={<IconAlertTriangle size={19} />}
          deltaText={overdueJobs > 0 ? "ควรติดตามด่วน" : "ไม่มีงานค้าง"}
          deltaTone={overdueJobs > 0 ? "destructive" : "success"}
        />
        <StatCard
          label="เงินค้างรับ" value={formatTHB(outstandingValue)}
          subLabel={`${outstandingList.length} งานยังไม่เก็บเงิน`}
          icon={<IconDollar size={19} />}
          deltaText="รอเก็บ" deltaTone="warning"
        />
      </div>

      {/* Action Queue — the coordinator's top-level focus: what needs doing next */}
      <ActionQueue jobs={jobs} />

      {/* Analysis & action — two stacked columns.
          Left: team workload + urgent jobs.
          Right: job types + mini schedule calendar + warranty tracking. */}
      <div className="exec-2col section-block">
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", minWidth: 0 }}>
          <div className="ds-card">
            <div className="ds-card-header">
              <div className="ds-card-title">จำนวนงานตามทีมช่าง</div>
              <div className="ds-card-desc">การกระจายงานในความรับผิดชอบตามทีมช่าง</div>
            </div>
            <div className="ds-card-content">
              <SimpleBarChart data={teamJobCounts} />
            </div>
          </div>

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
          <div className="ds-card">
            <div className="ds-card-header">
              <div className="ds-card-title">งานตามประเภท</div>
              <div className="ds-card-desc">สัดส่วนงานของคุณแยกตามประเภทบริการ</div>
            </div>
            <div className="ds-card-content">
              <DonutChart
                segments={jobTypeCounts}
                centerLabel={total}
                centerSub="งานทั้งหมด"
              />
            </div>
          </div>

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
