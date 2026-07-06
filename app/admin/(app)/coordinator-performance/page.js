"use client";

import { useState } from "react";
import Link from "next/link";
import Modal from "@/app/components/Modal";
import DataTable from "@/app/components/DataTable";
import StatCard from "@/app/components/StatCard";
import { avgOf, outlierClass, DeviationBadge, MiniBar, DrillName } from "@/app/components/PerformanceHighlight";
import {
  IconBriefcase, IconAlertTriangle, IconCheckCircle, IconUsers, IconEye,
  IconEdit, IconFileText, IconPhone,
} from "@/app/components/icons";
import {
  coordinatorPerformance, jobStatusLabel, jobStatusBadgeClass,
} from "@/app/lib/mockData";
import { useJobs, useStaffUsers } from "@/app/lib/store";
import { formatDateTH, formatTHB } from "@/app/lib/format";

// First-name only, so bar-chart / list labels stay short and scannable.
const shortName = (name) => name.split(" ")[0];

// Map the shared outlier class → a progress-bar tone so bars in the ranking /
// quality cards turn red for bad outliers and green for good ones at a glance.
function outlierTone(cls) {
  if (cls.includes("destructive")) return "danger";
  if (cls.includes("success")) return "success";
  return "secondary";
}

// The 4 turnaround stages, in order, each with its own progress-bar tone.
const STAGES = [
  { key: "toQuote", label: "แจ้งงาน → ส่งใบเสนอราคา", tone: "default" },
  { key: "toProcure", label: "อนุมัติ → สั่งซื้อ/สั่งจ้างเสร็จ", tone: "secondary" },
  { key: "toConfirm", label: "ของ/ทีมพร้อม → คอนเฟิร์มวันสำเร็จ", tone: "success" },
  { key: "toAccounting", label: "งานเสร็จหน้างาน → ส่งเอกสารบัญชี", tone: "danger" },
];

export default function CoordinatorPerformancePage() {
  const [jobList] = useJobs();
  const [staffList] = useStaffUsers();
  const [drillId, setDrillId] = useState(null);

  const rows = coordinatorPerformance(jobList, staffList);
  const overduePcts = rows.map((r) => r.overduePct);
  const successRates = rows.map((r) => r.successRate);
  const revisionPcts = rows.map((r) => r.revisionPct);
  const avgOverduePct = avgOf(rows, "overduePct");
  const avgSuccessRate = avgOf(rows, "successRate");
  const maxStage = Math.max(1, ...rows.flatMap((r) => [r.toQuote, r.toProcure, r.toConfirm, r.toAccounting]));

  const totalActive = rows.reduce((s, r) => s + r.activeCount, 0);
  const totalOverdue = rows.reduce((s, r) => s + r.overdueCount, 0);
  const totalFollowUps = rows.reduce((s, r) => s + r.avgFollowUps * (r.totalJobs || 0), 0);
  const maxBacklog = Math.max(1, ...rows.map((r) => r.controllable + r.uncontrollable));

  // % ค้างเกินกำหนด comparison — compact horizontal bars, worst first so the
  // person to look at is at the top. The single worst performer pops red.
  const worstOverdue = Math.max(0, ...overduePcts);
  const overdueRanked = [...rows].sort((a, b) => b.overduePct - a.overduePct);
  const overdueScale = Math.max(1, worstOverdue);

  // Success ranking — best closers first so the leader board reads top-down.
  const successRanked = [...rows].sort((a, b) => b.successRate - a.successRate);

  const drillPerson = drillId ? staffList.find((u) => u.id === drillId) : null;
  const drillJobs = drillId ? jobList.filter((j) => j.coordinatorId === drillId).sort((a, b) => b.createdDate.localeCompare(a.createdDate)) : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>ประสิทธิภาพผู้ประสานงาน</h2>
          <p>เปรียบเทียบผลงานผู้ประสานงานแต่ละคนเพื่อประเมินประสิทธิภาพและตรวจจับคอขวด — มุมมองผู้บริหาร ไม่ใช่หน้าจัดการงานประจำวัน</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpi-grid">
        <StatCard label="งาน Active ทั้งหมด" value={totalActive} icon={<IconBriefcase size={19} />} subLabel={`ผู้ประสานงาน ${rows.length} คน`} />
        <StatCard
          label="ค้างเกินกำหนดเฉลี่ย"
          value={`${Math.round(avgOverduePct)}%`}
          icon={<IconAlertTriangle size={19} />}
          deltaText={`${totalOverdue} งานค้างรวม`}
          deltaTone={avgOverduePct > 30 ? "destructive" : "success"}
        />
        <StatCard
          label="อัตราปิดเคสสำเร็จเฉลี่ย"
          value={`${Math.round(avgSuccessRate)}%`}
          icon={<IconCheckCircle size={19} />}
          deltaText="ปิดจบ + ได้รับเงินในกรอบเวลา"
          deltaTone={avgSuccessRate >= 70 ? "success" : "warning"}
        />
        <StatCard label="ลูกค้าต้อง Follow-up เอง" value={Math.round(totalFollowUps)} icon={<IconUsers size={19} />} subLabel="รวมทุกคน ทุกงาน" />
      </div>

      {/* Comparison — % ค้างเกินกำหนด ต่อคน (compact horizontal bars) */}
      <div className="ds-card section-block">
        <div className="ds-card-header">
          <div className="ds-card-title">% ค้างเกินกำหนด ต่อผู้ประสานงาน</div>
          <div className="ds-card-desc">
            เรียงจากค้างมากไปน้อย — แท่งสีแดงคือผู้ที่ค้างสูงสุด ควรเข้าไปดูก่อน · ค่าเฉลี่ยทีม {Math.round(avgOverduePct)}%
          </div>
        </div>
        <div className="ds-card-content">
          <div className="teamperf-list">
            {overdueRanked.map((r) => {
              const isWorst = r.overduePct === worstOverdue && worstOverdue > 0;
              return (
                <div className="teamperf-row" key={r.id}>
                  <div className="progress-label">
                    <span>{shortName(r.name)}</span>
                    <span style={{ fontWeight: 700, color: isWorst ? "var(--destructive)" : "var(--foreground)" }}>{r.overduePct}%</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-bar"
                      style={{
                        width: `${Math.round((r.overduePct / overdueScale) * 100)}%`,
                        background: isWorst ? "var(--destructive)" : "var(--primary)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ranking + quality — two-column executive row */}
      <div className="exec-2col section-block">
        {/* Success-rate ranking */}
        <div className="ds-card">
          <div className="ds-card-header">
            <div className="ds-card-title">อัตราปิดเคสสำเร็จ (จัดอันดับ)</div>
            <div className="ds-card-desc">ปิดจบ + ได้รับเงินในกรอบเวลา · คลิกชื่อเพื่อดูรายละเอียดรายบุคคล</div>
          </div>
          <div className="ds-card-content">
            <div className="teamperf-list">
              {successRanked.map((r) => {
                const tone = outlierTone(outlierClass(r.successRate, successRates, false));
                return (
                  <div key={r.id} className="teamperf-row">
                    <div className="progress-label">
                      <DrillName name={r.name} onClick={() => setDrillId(r.id)} />
                      <span style={{ fontWeight: 700, color: "var(--foreground)" }}>
                        {r.successRate}%
                        <DeviationBadge value={r.successRate} allValues={successRates} worseIsHigher={false} />
                      </span>
                    </div>
                    <div className="progress-track">
                      <div className={`progress-bar ${tone}`} style={{ width: `${Math.min(r.successRate, 100)}%` }} />
                    </div>
                    <div className="text-xs text-muted" style={{ marginTop: "0.2rem" }}>
                      งาน Active {r.activeCount} · ค้างเกินกำหนด {r.overdueCount} งาน
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quality signals */}
        <div className="ds-card">
          <div className="ds-card-header">
            <div className="ds-card-title">คุณภาพงานประสานงาน</div>
            <div className="ds-card-desc">% ใบเสนอราคาที่ต้องแก้ซ้ำ (แท่ง) · เอกสารไม่ครบ + Follow-up จากลูกค้า (คำอธิบาย)</div>
          </div>
          <div className="ds-card-content">
            <div className="indicator-list">
              {rows.map((r) => {
                const tone = outlierTone(outlierClass(r.revisionPct, revisionPcts));
                return (
                  <div key={r.id} className="indicator-row" style={{ cursor: "default" }}>
                    <span className="indicator-icon"><IconEdit size={16} /></span>
                    <div className="indicator-main">
                      <div className="indicator-top">
                        <DrillName name={r.name} onClick={() => setDrillId(r.id)} />
                        <span className="indicator-pct">
                          {r.revisionPct}%
                          <DeviationBadge value={r.revisionPct} allValues={revisionPcts} worseIsHigher />
                        </span>
                      </div>
                      <div className="progress-track">
                        <div className={`progress-bar ${tone}`} style={{ width: `${Math.min(r.revisionPct, 100)}%` }} />
                      </div>
                      <div className="indicator-sub flex-row" style={{ gap: "0.9rem" }}>
                        <span className="flex-row" style={{ gap: "0.3rem" }}><IconFileText size={12} /> เอกสารไม่ครบ {r.docIncompletePct}%</span>
                        <span className="flex-row" style={{ gap: "0.3rem" }}><IconPhone size={12} /> ลูกค้าตาม {r.avgFollowUps} ครั้ง/งาน</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Turnaround time — one compact card per coordinator, 4 MiniBars each */}
      <div className="section-block">
        <h3>Turnaround Time ต่อคน (เทียบกัน)</h3>
        <p className="text-xs text-muted" style={{ marginTop: "-0.5rem", marginBottom: "0.75rem" }}>
          เวลาเฉลี่ยแต่ละขั้นตอน ต่อผู้ประสานงาน — ยิ่งแท่งสั้นยิ่งเร็ว
        </p>
        <div className="teamperf-grid">
          {rows.map((r) => (
            <div key={r.id} className="ds-card">
              <div className="ds-card-content" style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                <DrillName name={r.name} onClick={() => setDrillId(r.id)} />
                {STAGES.map((s) => (
                  <div key={s.key} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <span className="text-xs text-muted">{s.label}</span>
                    <MiniBar value={r[s.key]} max={maxStage} tone={s.tone} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controllable vs uncontrollable bottleneck — kept as-is */}
      <div className="section-block">
        <h3>แยกคอขวด: &quot;ควบคุมได้&quot; vs &quot;ควบคุมไม่ได้&quot;</h3>
        <div className="ds-alert ds-alert-info" style={{ marginBottom: "0.9rem" }}>
          <div>
            <strong>ทำไมต้องแยก</strong>
            งานค้างเพราะรอผู้ประสานงานดำเนินการ (ควบคุมได้ = ความรับผิดชอบของคนนี้) กับงานค้างเพราะรอฝ่ายอื่น/ลูกค้า/supplier (ควบคุมไม่ได้)
            ต้องแสดงแยกกันเสมอ — ห้ามรวมเป็นตัวเลขเดียว มิเช่นนั้นจะตัดสินผลงานผิดคน
          </div>
        </div>
        <div className="ds-card">
          <div className="ds-card-content" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {rows.map((r) => {
              const total = r.controllable + r.uncontrollable;
              return (
                <div key={r.id}>
                  <div className="progress-label">
                    <span style={{ fontWeight: 600, color: "var(--foreground)" }}>{r.name}</span>
                    <span>{total} งานค้างเกินกำหนด</span>
                  </div>
                  {total === 0 ? (
                    <div className="text-xs text-muted" style={{ padding: "0.35rem 0" }}>ไม่มีงานค้างเกินกำหนด</div>
                  ) : (
                    <>
                      <div className="flex-row" style={{ height: 18, borderRadius: "999px", overflow: "hidden", background: "var(--muted)" }}>
                        <div style={{ width: `${(r.controllable / maxBacklog) * 100}%`, background: "var(--destructive)", minWidth: r.controllable ? 4 : 0 }} title={`ควบคุมได้ ${r.controllable} งาน`} />
                        <div style={{ width: `${(r.uncontrollable / maxBacklog) * 100}%`, background: "oklch(0.7 0 0)", minWidth: r.uncontrollable ? 4 : 0 }} title={`ควบคุมไม่ได้ ${r.uncontrollable} งาน`} />
                      </div>
                      <div className="flex-row text-xs text-muted" style={{ gap: "1rem", marginTop: "0.3rem" }}>
                        <span className="flex-row" style={{ gap: "0.3rem" }}><span className="dot-chip" style={{ background: "var(--destructive)" }} />ควบคุมได้ {r.controllable} งาน</span>
                        <span className="flex-row" style={{ gap: "0.3rem" }}><span className="dot-chip" style={{ background: "oklch(0.7 0 0)" }} />ควบคุมไม่ได้ {r.uncontrollable} งาน</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Drill-down รายบุคคล — kept exactly as-is */}
      <Modal
        open={!!drillPerson}
        onClose={() => setDrillId(null)}
        title={drillPerson?.name}
        description={drillPerson ? `รายการงานทั้งหมดที่ดูแลอยู่ (${drillJobs.length} งาน) — คลิกเลขที่งานเพื่อดูประวัติย้อนหลังเต็ม` : ""}
        fullscreen
        contentMaxWidth={960}
        footer={<button type="button" className="btn btn-md btn-secondary" onClick={() => setDrillId(null)}>ปิด</button>}
      >
        {drillPerson && (
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
            emptyMessage="ยังไม่มีงานที่ดูแล"
          />
        )}
      </Modal>
    </div>
  );
}
