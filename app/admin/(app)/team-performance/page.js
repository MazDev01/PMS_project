"use client";

import { useState } from "react";
import Link from "next/link";
import Modal from "@/app/components/Modal";
import DataTable from "@/app/components/DataTable";
import StatCard from "@/app/components/StatCard";
import { SimpleBarChart } from "@/app/components/charts";
import { avgOf, outlierClass, DeviationBadge, MiniBar, DrillName } from "@/app/components/PerformanceHighlight";
import {
  IconTruck, IconClock, IconCheckCircle, IconShield, IconEye, IconBriefcase,
  IconAlertTriangle, IconImage,
} from "@/app/components/icons";
import {
  teamPerformanceDetailed, jobStatusLabel, jobStatusBadgeClass,
  chartBlueShades, teamCoverage, specialtyShort, TODAY_ISO,
} from "@/app/lib/mockData";
import { useJobs, useTeams, useWarranties, useRepairTickets, useScheduleEvents, usePersonnel } from "@/app/lib/store";
import { formatDateTH, formatTHB } from "@/app/lib/format";

const shortName = (name) => name.replace("ทีมช่าง", "");

const TEAM_STATUS_LABEL = { working: "กำลังทำงาน", available: "ว่าง", leave: "ลา" };
const TEAM_STATUS_BADGE = { working: "badge-warning", available: "badge-success", leave: "badge-secondary" };

const TICKET_PRIORITY_LABEL = { high: "สูง", medium: "กลาง", low: "ต่ำ" };
const TICKET_PRIORITY_BADGE = { high: "badge-destructive", medium: "badge-warning", low: "badge-secondary" };
const TICKET_STATUS_LABEL = { open: "เปิดเคส", in_progress: "กำลังดำเนินการ", closed: "ปิดเคสแล้ว" };
const TICKET_STATUS_BADGE = { open: "badge-warning", in_progress: "badge-info", closed: "badge-success" };
const WARRANTY_STATUS_LABEL = { active: "มีผลบังคับใช้", expired: "หมดอายุ" };
const WARRANTY_STATUS_BADGE = { active: "badge-success", expired: "badge-secondary" };

// Shared outlier class → progress-bar tone, same mapping as the coordinator
// performance page so the two dashboards read identically.
function outlierTone(cls) {
  if (cls.includes("destructive")) return "danger";
  if (cls.includes("success")) return "success";
  return "secondary";
}

export default function TeamPerformancePage() {
  const [jobList] = useJobs();
  const [teamList] = useTeams();
  const [warrantyList] = useWarranties();
  const [ticketList] = useRepairTickets();
  const [scheduleEvents] = useScheduleEvents();
  const [personnel] = usePersonnel();
  const [drillId, setDrillId] = useState(null);

  const base = teamPerformanceDetailed(jobList, teamList, warrantyList, ticketList);
  const onTeam = (j, name) => (j.teams || [j.team]).includes(name);

  // Augment each team row with the operational snapshot numbers that used to
  // live on the separate "ภาพรวมทีมช่าง" page (now folded in here): today's
  // jobs, done, overdue, specialty coverage, and open repair tickets.
  const rows = base.map((r) => ({
    ...r,
    specialty: teamCoverage(r.id, personnel).map((c) => specialtyShort[c] || c).join(", ") || "—",
    todayJobs: scheduleEvents.filter((e) => e.team === r.name && e.date === TODAY_ISO).length,
    doneJobs: jobList.filter((j) => onTeam(j, r.name) && j.status === "done").length,
    overdueJobs: jobList.filter((j) => onTeam(j, r.name) && j.status === "in_progress" && j.scheduledDate < TODAY_ISO).length,
    openTickets: ticketList.filter((rt) => rt.team === r.name && rt.status !== "closed").length,
  }));

  const onTimeRates = rows.map((r) => r.onTimeRate);
  const warrantyClaimRates = rows.map((r) => r.warrantyClaimRate);
  const maxRatio = Math.max(1, ...rows.map((r) => r.laborCostRatioPct));

  const totalWorkload = rows.reduce((s, r) => s + r.workload, 0);
  const workingCount = rows.filter((r) => r.status === "working").length;
  const availableCount = rows.filter((r) => r.status === "available").length;
  const leaveCount = rows.filter((r) => r.status === "leave").length;
  const avgOnTimeRate = Math.round(avgOf(rows, "onTimeRate"));
  const avgClaimRate = Math.round(avgOf(rows, "warrantyClaimRate"));
  const todayAll = scheduleEvents.filter((e) => e.date === TODAY_ISO).length;
  const overdueAll = jobList.filter((j) => j.status === "in_progress" && j.scheduledDate < TODAY_ISO).length;

  // Workload comparison — for a "fair distribution" read, high isn't bad, so
  // just ride the on-brand blue sequence (no red flagging here).
  const workloadBar = rows.map((r, i) => ({ label: shortName(r.name), value: r.workload, color: chartBlueShades[i % chartBlueShades.length] }));

  const onTimeRanked = [...rows].sort((a, b) => b.onTimeRate - a.onTimeRate);

  const drillTeam = drillId ? teamList.find((t) => t.id === drillId) : null;
  const drillJobs = drillTeam
    ? jobList.filter((j) => onTeam(j, drillTeam.name)).sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))
    : [];
  const drillJobIds = new Set(drillJobs.map((j) => j.id));
  const drillWarranties = drillTeam ? warrantyList.filter((w) => drillJobIds.has(w.jobId)) : [];
  const drillTickets = drillTeam ? ticketList.filter((rt) => rt.team === drillTeam.name) : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>ประสิทธิภาพทีมช่าง</h2>
          <p>เปรียบเทียบผลงานทีมช่างแต่ละทีมเพื่อประเมินประสิทธิภาพและตรวจจับคอขวด — มุมมองผู้บริหาร เชื่อมโยงกับความเสี่ยงด้านต้นทุนและ warranty ไม่ใช่หน้าจัดการงานประจำวัน</p>
        </div>
      </div>

      {/* KPI strip — team performance metrics + merged operational overview */}
      <div className="kpi-grid">
        <StatCard label="งานที่ทีมช่างถืออยู่ (รวม)" value={totalWorkload} icon={<IconTruck size={19} />} subLabel={`ทีมช่างทั้งหมด ${rows.length} ทีม`} />
        <StatCard label="สถานะทีมช่างตอนนี้" value={`${availableCount} ว่าง / ${workingCount} ทำงาน`} icon={<IconClock size={19} />} deltaText={leaveCount > 0 ? `${leaveCount} ทีมลา` : "ไม่มีทีมลา"} deltaTone={leaveCount > 0 ? "warning" : "success"} />
        <StatCard label="งานวันนี้ (ทุกทีม)" value={todayAll} icon={<IconBriefcase size={19} />} deltaText="ตามคิวที่วางแผนไว้" deltaTone="secondary" />
        <StatCard label="On-time rate เฉลี่ย" value={`${avgOnTimeRate}%`} icon={<IconCheckCircle size={19} />} deltaText="งานเสร็จตรงเวลานัดหมาย" deltaTone={avgOnTimeRate >= 70 ? "success" : "warning"} />
        <StatCard label="Warranty Claim Rate เฉลี่ย" value={`${avgClaimRate}%`} icon={<IconShield size={19} />} deltaText={overdueAll > 0 ? `${overdueAll} งานเลยกำหนด` : "งานตามแผน"} deltaTone={avgClaimRate > 15 ? "destructive" : "success"} />
      </div>

      {/* Workload comparison chart */}
      <div className="ds-card chart-card-wrap section-block">
        <div className="ds-card-header">
          <div className="ds-card-title">ปริมาณงานที่แต่ละทีมถืออยู่ (Workload)</div>
          <div className="ds-card-desc">ดูว่ากระจายงานเป็นธรรมไหม — ทีมที่แท่งสูงกว่าเพื่อนมากอาจรับงานหนักเกินไป</div>
        </div>
        <div className="ds-card-content">
          <SimpleBarChart data={workloadBar} width={720} height={210} valueFormatter={(v) => `${v}`} />
        </div>
      </div>

      {/* On-time ranking + warranty/quality — two-column executive row */}
      <div className="exec-2col section-block">
        {/* On-time completion ranking */}
        <div className="ds-card">
          <div className="ds-card-header">
            <div className="ds-card-title">อัตราส่งงานตรงเวลา (จัดอันดับ)</div>
            <div className="ds-card-desc">On-time completion rate ต่อทีม · คลิกชื่อทีมเพื่อดูรายละเอียด</div>
          </div>
          <div className="ds-card-content">
            <div className="teamperf-list">
              {onTimeRanked.map((r) => {
                const tone = outlierTone(outlierClass(r.onTimeRate, onTimeRates, false));
                return (
                  <div key={r.id} className="teamperf-row">
                    <div className="progress-label">
                      <DrillName name={r.name} onClick={() => setDrillId(r.id)} />
                      <span style={{ fontWeight: 700, color: "var(--foreground)" }}>
                        {r.onTimeRate}%
                        <DeviationBadge value={r.onTimeRate} allValues={onTimeRates} worseIsHigher={false} />
                      </span>
                    </div>
                    <div className="progress-track">
                      <div className={`progress-bar ${tone}`} style={{ width: `${Math.min(r.onTimeRate, 100)}%` }} />
                    </div>
                    <div className="text-xs text-muted" style={{ marginTop: "0.2rem" }}>
                      เสร็จเดือนนี้ {r.completedThisMonth} งาน · เวลาเฉลี่ย {r.avgDuration} วัน/งาน · คะแนนลูกค้า {r.avgRating != null ? `${r.avgRating.toFixed(1)}/5` : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Warranty claim rate — the flagship quality metric */}
        <div className="ds-card">
          <div className="ds-card-header">
            <div className="ds-card-title">Warranty Claim Rate &amp; คุณภาพ</div>
            <div className="ds-card-desc">สัดส่วนงานที่มีประกันแล้วต้องกลับมาแจ้งซ่อม (แท่ง) · เอกสารครบ + complain หน้างาน (คำอธิบาย)</div>
          </div>
          <div className="ds-card-content">
            <div className="indicator-list">
              {rows.map((r) => {
                const tone = outlierTone(outlierClass(r.warrantyClaimRate, warrantyClaimRates, true));
                return (
                  <div key={r.id} className="indicator-row" style={{ cursor: "default" }}>
                    <span className="indicator-icon"><IconShield size={16} /></span>
                    <div className="indicator-main">
                      <div className="indicator-top">
                        <DrillName name={r.name} onClick={() => setDrillId(r.id)} />
                        <span className="indicator-pct">
                          {r.warrantyClaimRate}%
                          <DeviationBadge value={r.warrantyClaimRate} allValues={warrantyClaimRates} worseIsHigher />
                        </span>
                      </div>
                      <div className="progress-track">
                        <div className={`progress-bar ${tone}`} style={{ width: `${Math.min(r.warrantyClaimRate, 100)}%` }} />
                      </div>
                      <div className="indicator-sub flex-row" style={{ gap: "0.9rem", flexWrap: "wrap" }}>
                        <span className="flex-row" style={{ gap: "0.3rem" }}><IconImage size={12} /> เอกสารครบ {r.docCompliancePct}%</span>
                        <span className="flex-row" style={{ gap: "0.3rem" }}><IconAlertTriangle size={12} /> complain {r.siteComplaints} ครั้ง</span>
                        <span className="text-muted">· {r.commonIssue}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Per-team operational snapshot (merged from ภาพรวมทีมช่าง) */}
      <div className="section-block">
        <h3>ภาระงานรายทีม (สแนปช็อต)</h3>
        <p className="text-xs text-muted" style={{ marginTop: "-0.5rem", marginBottom: "0.75rem" }}>
          สถานะและปริมาณงานของแต่ละทีม ณ วันที่ {formatDateTH(TODAY_ISO)} · คลิกชื่อทีมเพื่อดูประวัติงานย้อนหลัง
        </p>
        <div className="teamperf-grid">
          {rows.map((r) => (
            <div key={r.id} className="ds-card">
              <div className="ds-card-content" style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                <div className="flex-between" style={{ gap: "0.5rem" }}>
                  <DrillName name={r.name} onClick={() => setDrillId(r.id)} />
                  <span className={`badge ${TEAM_STATUS_BADGE[r.status]}`}>{TEAM_STATUS_LABEL[r.status]}</span>
                </div>
                <div className="text-xs text-muted">สาย: {r.specialty}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem 0.6rem" }}>
                  <SnapStat label="กำลังทำ" value={r.workload} />
                  <SnapStat label="งานวันนี้" value={r.todayJobs} />
                  <SnapStat label="เสร็จแล้ว" value={r.doneJobs} />
                  <SnapStat label="เลยกำหนด" value={r.overdueJobs} tone={r.overdueJobs > 0 ? "danger" : undefined} />
                  <SnapStat label="เคสซ่อมเปิด" value={r.openTickets} tone={r.openTickets > 0 ? "warn" : undefined} />
                  <SnapStat label="เดือนนี้เสร็จ" value={r.completedThisMonth} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cost per team */}
      <div className="section-block">
        <h3>ต้นทุนต่อทีม (กรณี subcontractor)</h3>
        <p className="text-xs text-muted" style={{ marginTop: "-0.5rem", marginBottom: "0.75rem" }}>
          ค่าจ้างเทียบมูลค่างาน — ตัวเลขหมวดนี้เป็นข้อมูลจำลองเพื่อการสาธิต (ยังไม่เชื่อมข้อมูลเงินเดือน/payroll จริง)
        </p>
        <div className="ds-card">
          <div className="ds-card-content" style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem" }}>
            {rows.map((r) => (
              <div key={r.id} className="list-row">
                <div className="list-row-main">
                  <div className="list-row-title">{r.name}</div>
                  <div className="list-row-sub">ค่าจ้าง/งาน {formatTHB(r.wagePerJob)} · มูลค่างานเฉลี่ย {formatTHB(r.avgJobValue)}</div>
                </div>
                <div style={{ width: 150, flexShrink: 0 }}>
                  <div className="text-xs text-muted" style={{ textAlign: "right", marginBottom: "0.2rem" }}>สัดส่วนต้นทุนแรงงาน</div>
                  <MiniBar value={r.laborCostRatioPct} max={maxRatio} tone="secondary" unit="%" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drill-down รายทีม — jobs + tickets + warranties */}
      <Modal
        open={!!drillTeam}
        onClose={() => setDrillId(null)}
        title={drillTeam?.name}
        description={drillTeam ? `ประวัติงานทั้งหมดย้อนหลัง (${drillJobs.length} งาน) — คลิกเลขที่งานเพื่อดูรายละเอียดเต็ม` : ""}
        fullscreen
        contentMaxWidth={960}
        footer={<button type="button" className="btn btn-md btn-secondary" onClick={() => setDrillId(null)}>ปิด</button>}
      >
        {drillTeam && (
          <>
            <DataTable
              columns={[
                {
                  key: "id",
                  label: "เลขที่งาน",
                  render: (r) => (
                    <Link href={`/coordinator/jobs/${r.id}`} className="flex-row" style={{ gap: "0.3rem" }}>
                      {r.id} <IconEye size={13} />
                    </Link>
                  ),
                },
                { key: "customer", label: "ลูกค้า" },
                { key: "jobType", label: "ประเภทงาน" },
                { key: "scheduledDate", label: "วันนัดหมาย", render: (r) => formatDateTH(r.scheduledDate) },
                { key: "amount", label: "มูลค่างาน", render: (r) => formatTHB(r.amount) },
                { key: "status", label: "สถานะ", render: (r) => <span className={`badge ${jobStatusBadgeClass(r.status)}`}>{jobStatusLabel(r.status)}</span> },
              ]}
              rows={drillJobs}
              emptyMessage="ยังไม่มีงานที่รับผิดชอบ"
            />

            <div style={{ fontWeight: 700, marginTop: "1.75rem", marginBottom: "0.5rem" }}>
              รายการแจ้งซ่อม (Repair Tickets) — ใช้ตรวจสอบกรณีมีปัญหา
            </div>
            <DataTable
              columns={[
                { key: "id", label: "เลขที่เคส" },
                { key: "issue", label: "ปัญหาที่แจ้ง" },
                { key: "priority", label: "ความสำคัญ", render: (r) => <span className={`badge ${TICKET_PRIORITY_BADGE[r.priority]}`}>{TICKET_PRIORITY_LABEL[r.priority]}</span> },
                { key: "status", label: "สถานะ", render: (r) => <span className={`badge ${TICKET_STATUS_BADGE[r.status]}`}>{TICKET_STATUS_LABEL[r.status]}</span> },
                { key: "reportedDate", label: "วันที่แจ้ง", render: (r) => formatDateTH(r.reportedDate) },
              ]}
              rows={drillTickets}
              emptyMessage="ไม่มีการแจ้งซ่อมจากทีมนี้"
            />

            <div style={{ fontWeight: 700, marginTop: "1.75rem", marginBottom: "0.5rem" }}>
              ประกันผลงาน (Warranty) ของงานที่ทีมนี้ดูแล
            </div>
            <DataTable
              columns={[
                { key: "id", label: "เลขที่ประกัน" },
                { key: "customer", label: "ลูกค้า" },
                { key: "months", label: "ระยะเวลาประกัน", render: (r) => `${r.months} เดือน` },
                { key: "status", label: "สถานะ", render: (r) => <span className={`badge ${WARRANTY_STATUS_BADGE[r.status]}`}>{WARRANTY_STATUS_LABEL[r.status]}</span> },
                { key: "percentLeft", label: "ระยะเวลาประกันคงเหลือ", render: (r) => <MiniBar value={r.percentLeft} max={100} unit="%" tone={r.percentLeft < 20 ? "danger" : "default"} /> },
              ]}
              rows={drillWarranties}
              emptyMessage="ไม่มีงานที่มีประกันผลงานผูกกับทีมนี้"
            />
          </>
        )}
      </Modal>
    </div>
  );
}

// Small labeled number tile used in the per-team snapshot cards.
function SnapStat({ label, value, tone }) {
  const color = tone === "danger" ? "var(--destructive)" : tone === "warn" ? "oklch(0.5 0.15 60)" : "var(--foreground)";
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div style={{ fontWeight: 700, fontSize: "0.95rem", color }}>{value}</div>
    </div>
  );
}
