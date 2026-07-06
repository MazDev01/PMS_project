"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import StatCard from "@/app/components/StatCard";
import { SimpleBarChart } from "@/app/components/charts";
import {
  IconBriefcase, IconCheckCircle, IconClipboard, IconBell, IconLogOut,
  IconChevronRight, IconShield, IconPhone, IconAlertTriangle,
} from "@/app/components/icons";
import {
  TODAY_ISO, chartBlueShades, personJobs, jobTypeToSpecialty, specialtyShort,
} from "@/app/lib/mockData";
import { useJobs, usePersonnel, useTeams } from "@/app/lib/store";
import { useAuth } from "@/app/lib/auth";

// Short aliases so job-type names stay readable as bar-chart labels inside
// the narrow phone body.
const SHORT_LABELS = {
  "ระบบปรับอากาศ (HVAC)": "ปรับอากาศ",
  "ระบบไฟฟ้าและสื่อสาร": "ไฟฟ้า-สื่อสาร",
  "ระบบสุขาภิบาล": "สุขาภิบาล",
  "ระบบป้องกันอัคคีภัย": "ดับเพลิง",
  "ซ่อมบำรุงทั่วไป": "ซ่อมบำรุง",
};

function daysBetween(aIso, bIso) {
  if (!aIso || !bIso) return null;
  const [ay, am, ad] = aIso.split("-").map(Number);
  const [by, bm, bd] = bIso.split("-").map(Number);
  const a = Date.UTC(ay, am - 1, ad);
  const b = Date.UTC(by, bm - 1, bd);
  return Math.round((b - a) / 86400000);
}

// A compact star meter — filled/half/empty out of 5.
function Stars({ value }) {
  if (value == null) return <span className="text-muted">—</span>;
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <span style={{ letterSpacing: "1px", color: "#f5a623" }}>
      {"★".repeat(full)}
      {half ? "⯪" : ""}
      <span style={{ color: "var(--border)" }}>{"★".repeat(5 - full - (half ? 1 : 0))}</span>
    </span>
  );
}

function Meter({ label, pct, tone = "" }) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <div className="progress-label">
        <span>{label}</span>
        <span style={{ fontWeight: 600 }}>{pct}%</span>
      </div>
      <div className="progress-track">
        <div className={`progress-bar ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ContractorProfileDashboardPage() {
  const [jobs] = useJobs();
  const [personnel] = usePersonnel();
  const [teams] = useTeams();
  const { session, logout } = useAuth();
  const router = useRouter();

  const person = personnel.find((p) => p.id === session?.personId);
  const team = teams.find((t) => t.id === person?.teamId);
  const myJobs = personJobs(session?.personId, jobs);

  // ── Work performance metrics (computed from this technician's own jobs) ──
  const total = myJobs.length;
  const doneJobs = myJobs.filter((j) => j.status === "done");
  const inProgressCount = myJobs.filter((j) => j.status === "in_progress").length;
  const repairCount = myJobs.filter((j) => j.status === "repair").length;
  const doneCount = doneJobs.length;

  const successRate = total ? Math.round((doneCount / total) * 100) : 0;

  const onTimeJobs = doneJobs.filter((j) => (daysBetween(j.scheduledDate, j.closedDate) ?? 99) <= 3);
  const onTimeRate = doneCount ? Math.round((onTimeJobs.length / doneCount) * 100) : 0;

  const ratedJobs = doneJobs.filter((j) => j.customerRating != null);
  const avgRating = ratedJobs.length
    ? Math.round((ratedJobs.reduce((s, j) => s + j.customerRating, 0) / ratedJobs.length) * 10) / 10
    : null;

  const qualityChecked = myJobs.filter((j) => j.status === "done" || j.status === "repair");
  const docCompliancePct = qualityChecked.length
    ? Math.round((qualityChecked.filter((j) => j.docsComplete).length / qualityChecked.length) * 100)
    : 100;

  const monthPrefix = TODAY_ISO.slice(0, 7);
  const monthCount = myJobs.filter((j) => (j.scheduledDate || "").slice(0, 7) === monthPrefix).length;

  const statusRows = [
    { key: "in_progress", label: "กำลังดำเนินการ", count: inProgressCount, tone: "secondary" },
    { key: "done", label: "เสร็จสิ้น", count: doneCount, tone: "success" },
    { key: "repair", label: "แจ้งซ่อม", count: repairCount, tone: "danger" },
  ];

  // Group MY jobs by the specialty they cover — a personal workload view.
  const bySpecialty = {};
  myJobs.forEach((j) => {
    const spec = jobTypeToSpecialty(j.jobType);
    bySpecialty[spec] = (bySpecialty[spec] || 0) + 1;
  });
  const specialtyChart = Object.entries(bySpecialty).map(([spec, count], i) => ({
    label: SHORT_LABELS[spec] || spec,
    value: count,
    color: chartBlueShades[i % chartBlueShades.length],
  }));

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div>
      {/* ── Profile identity ──────────────────────────────── */}
      <div className="profile-header">
        <div className="profile-avatar">{(person?.name || "?").slice(0, 1)}</div>
        <div className="profile-name">{person?.name || session?.name || "ช่างสาธิต"}</div>
        {person?.lead && (
          <span className="badge badge-secondary flex-row" style={{ width: "fit-content", margin: "0.3rem auto 0" }}>
            <IconShield size={11} />หัวหน้าทีม{team ? ` — ${team.name}` : ""}
          </span>
        )}
        <div className="profile-meta"><IconBriefcase size={13} />{specialtyShort[person?.specialty] || person?.specialty || "-"}{team ? ` · ${team.name}` : ""}</div>
        <div className="profile-meta"><IconPhone size={13} />{person?.phone || "-"}</div>
      </div>

      {/* ── Performance KPIs ──────────────────────────────── */}
      <div className="kpi-grid">
        <StatCard label="งานทั้งหมด" value={total} icon={<IconBriefcase size={18} />} deltaText="สะสม" deltaTone="secondary" />
        <StatCard label="เสร็จสิ้นแล้ว" value={doneCount} icon={<IconCheckCircle size={18} />} deltaText="ปิดงาน" deltaTone="success" />
        <StatCard label="อัตราสำเร็จ" value={`${successRate}%`} icon={<IconCheckCircle size={18} />} deltaText="ของงานทั้งหมด" deltaTone={successRate >= 80 ? "success" : "secondary"} />
        <StatCard label="งานเดือนนี้" value={monthCount} icon={<IconClipboard size={18} />} deltaText="ก.ค." deltaTone="secondary" />
      </div>

      {/* ── Work performance summary ──────────────────────── */}
      <div className="ds-card section-block">
        <div className="ds-card-header">
          <div className="ds-card-title">สรุปผลการทำงาน</div>
          <div className="ds-card-desc">ตัวชี้วัดคุณภาพงานของคุณ</div>
        </div>
        <div className="ds-card-content">
          <div className="flex-between" style={{ marginBottom: "0.9rem" }}>
            <span className="text-sm">คะแนนจากลูกค้า</span>
            <span className="flex-row" style={{ gap: "0.4rem" }}>
              <Stars value={avgRating} />
              <span style={{ fontWeight: 700 }}>{avgRating != null ? avgRating.toFixed(1) : "—"}</span>
              <span className="text-xs text-muted">/ 5</span>
            </span>
          </div>
          <Meter label="อัตราความสำเร็จ" pct={successRate} tone="success" />
          <Meter label="ส่งงานตรงเวลา" pct={onTimeRate} tone={onTimeRate >= 80 ? "success" : ""} />
          <Meter label="เอกสารครบถ้วน" pct={docCompliancePct} tone={docCompliancePct >= 90 ? "success" : ""} />
        </div>
      </div>

      {/* ── Status split ──────────────────────────────────── */}
      <div className="ds-card section-block">
        <div className="ds-card-header">
          <div className="ds-card-title">สถานะงานของฉัน</div>
          <div className="ds-card-desc">สัดส่วนงานทั้งหมด {total} งาน</div>
        </div>
        <div className="ds-card-content">
          {total === 0 ? (
            <div className="text-xs text-muted">ยังไม่มีงานที่ได้รับมอบหมาย</div>
          ) : (
            <div className="indicator-list">
              {statusRows.map((row) => (
                <Meter
                  key={row.key}
                  label={`${row.label} · ${row.count} งาน`}
                  pct={Math.round((row.count / total) * 100)}
                  tone={row.tone}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Specialty split ───────────────────────────────── */}
      <div className="section-block">
        <h3>ประเภทงานของฉัน</h3>
        <div className="ds-card">
          <div className="ds-card-content">
            {specialtyChart.length ? (
              <SimpleBarChart data={specialtyChart} />
            ) : (
              <div className="text-xs text-muted"><IconAlertTriangle size={12} /> ยังไม่มีงานที่ได้รับมอบหมาย</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Account menu ──────────────────────────────────── */}
      <div className="ds-card section-block">
        <div className="ds-card-content profile-menu">
          <Link href="/contractor/jobs" className="profile-menu-item">
            <IconClipboard size={16} /> ประวัติงาน <IconChevronRight size={14} className="chev" />
          </Link>
          <Link href="/contractor/notifications" className="profile-menu-item">
            <IconBell size={16} /> การแจ้งเตือน <IconChevronRight size={14} className="chev" />
          </Link>
          <button type="button" onClick={handleLogout} className="profile-menu-item logout">
            <IconLogOut size={16} /> ออกจากระบบ
          </button>
        </div>
      </div>

      <div className="profile-version">MACCA Service · เวอร์ชัน 2.1.0</div>
    </div>
  );
}
