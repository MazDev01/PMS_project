"use client";

import { useEffect, useRef, useState } from "react";
import AppShell from "./AppShell";
import { useAuth } from "@/app/lib/auth";
import {
  IconGrid, IconBriefcase, IconCalendar, IconLink, IconDollar, IconShield,
  IconUsers, IconDatabase, IconActivity, IconRefresh, IconTruck,
  IconChevronDown, IconCheck, IconClipboard, IconCamera, IconAlertTriangle,
} from "./icons";

const VIEW_FILTER_KEY = "macca-pms-view-filter";

// มุมมองผู้บริหาร — the executive's overview area, gathering the three
// company-wide dashboards: the whole-business dashboard plus each department's
// performance dashboard. This is where a leader lands to see "what's going on
// in each department" at a glance, before drilling into operational pages.
const EXEC_OVERVIEW_GROUP = {
  key: "executive",
  label: "มุมมองผู้บริหาร",
  icon: <IconActivity size={16} />,
  items: [
    { href: "/admin/dashboard", label: "ภาพรวมทั้งบริษัท", icon: <IconGrid size={17} /> },
    { href: "/admin/coordinator-performance", label: "ประสิทธิภาพผู้ประสานงาน", icon: <IconBriefcase size={17} /> },
    { href: "/admin/team-performance", label: "ประสิทธิภาพทีมช่าง", icon: <IconTruck size={17} /> },
  ],
};

// Coordinator's OWN workspace (shown only when a coordinator logs in) — every
// job-list page here is scoped to jobs they own (scopeJobsToSession).
const COORDINATOR_GROUP = {
  key: "coordinator",
  label: "งานของฉัน",
  icon: <IconBriefcase size={16} />,
  items: [
    { href: "/coordinator/dashboard", label: "ภาพรวม", icon: <IconGrid size={17} /> },
    { href: "/coordinator/jobs", label: "จัดการงาน", icon: <IconBriefcase size={17} /> },
    { href: "/coordinator/schedule", label: "จัดทำแผนงาน", icon: <IconCalendar size={17} /> },
    { href: "/coordinator/links", label: "สร้างลิงก์", icon: <IconLink size={17} /> },
    { href: "/coordinator/closing", label: "ปิดงาน & การเงิน", icon: <IconDollar size={17} /> },
    { href: "/coordinator/warranty", label: "บริการหลังการขาย", icon: <IconShield size={17} /> },
  ],
};

// The coordinator dept's OPERATIONAL pages, as an executive uses them (showing
// every coordinator's data). The dept's overview/dashboard lives in
// EXEC_OVERVIEW_GROUP above, so this group is purely the working pages.
const OPS_COORDINATOR_GROUP = {
  key: "coordinator",
  label: "งานผู้ประสานงาน",
  icon: <IconBriefcase size={16} />,
  items: [
    { href: "/coordinator/jobs", label: "จัดการงาน", icon: <IconBriefcase size={17} /> },
    { href: "/coordinator/schedule", label: "จัดทำแผนงาน", icon: <IconCalendar size={17} /> },
    { href: "/coordinator/links", label: "สร้างลิงก์", icon: <IconLink size={17} /> },
    { href: "/coordinator/closing", label: "ปิดงาน & การเงิน", icon: <IconDollar size={17} /> },
    { href: "/coordinator/warranty", label: "บริการหลังการขาย", icon: <IconShield size={17} /> },
  ],
};

// The field-team dept's OPERATIONAL pages — team-centric views that the flat,
// per-job coordinator list can't give: a dispatch board (load by team), a
// site-evidence/photo tracker (QA), a repair-ticket queue by team, and a
// manpower roster. The old single "จัดการงานทีมช่าง" page (a redundant copy of
// the job list) is folded into these.
const OPS_CONTRACTOR_GROUP = {
  key: "contractor",
  label: "งานทีมช่าง",
  icon: <IconTruck size={16} />,
  items: [
    { href: "/admin/team-dispatch", label: "กระดานจ่ายงาน", icon: <IconClipboard size={17} /> },
    { href: "/admin/team-evidence", label: "ติดตามหลักฐานหน้างาน", icon: <IconCamera size={17} /> },
    { href: "/admin/team-repairs", label: "คิวเคสแจ้งซ่อมรายทีม", icon: <IconAlertTriangle size={17} /> },
    { href: "/admin/team-roster", label: "กำลังพลและความพร้อมทีม", icon: <IconUsers size={17} /> },
  ],
};

// System administration — user accounts, master data, audit trail, Mango sync.
const SYSTEM_GROUP = {
  key: "system",
  label: "ระบบ",
  icon: <IconDatabase size={16} />,
  items: [
    { href: "/admin/users", label: "จัดการผู้ใช้", icon: <IconUsers size={17} /> },
    { href: "/admin/master-data", label: "Master Data", icon: <IconDatabase size={17} /> },
    { href: "/admin/audit", label: "ประวัติการใช้งานระบบ", icon: <IconActivity size={17} /> },
    { href: "/admin/mango", label: "ซิงค์ข้อมูล Mango", icon: <IconRefresh size={17} /> },
  ],
};

// "ทั้งหมด" already shows everything an executive sees (overview + both dept
// ops + system), so a separate "มุมมองผู้บริหาร" filter would be redundant; the
// standalone "ระบบ" filter was dropped too. What's left are the two department
// work-views a manager might want to focus on, plus the full view.
const VIEW_OPTIONS = [
  { key: "all", label: "ทั้งหมด", sub: "มุมมองผู้บริหาร (ทุกส่วนงาน)", icon: <IconGrid size={14} />, gradient: "var(--gradient-brand)" },
  { key: "coordinator", label: "งานผู้ประสานงาน", sub: "ฝ่ายประสานงาน", icon: <IconBriefcase size={14} />, gradient: "var(--gradient-teal)" },
  { key: "contractor", label: "งานทีมช่าง", sub: "ฝ่ายปฏิบัติการ", icon: <IconTruck size={14} />, gradient: "var(--gradient-purple)" },
];

function ViewSwitcher({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = VIEW_OPTIONS.find((o) => o.key === value) || VIEW_OPTIONS[0];

  useEffect(() => {
    if (!open) return undefined;
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="view-switch" ref={ref}>
      <div className="text-xs text-muted" style={{ marginBottom: "0.35rem" }}>สลับมุมมอง (DEMO)</div>
      <button type="button" className="view-switch-trigger" onClick={() => setOpen((v) => !v)}>
        <span className="view-switch-icon" style={{ background: current.gradient }}>{current.icon}</span>
        <span className="view-switch-label">
          <span className="t">{current.label}</span>
          <span className="s">{current.sub}</span>
        </span>
        <IconChevronDown size={14} className="view-switch-chevron" style={{ transform: open ? "rotate(180deg)" : undefined }} />
      </button>
      {open && (
        <div className="view-switch-panel">
          {VIEW_OPTIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              className="view-switch-option"
              onClick={() => {
                onChange(o.key);
                setOpen(false);
              }}
            >
              <span className="view-switch-icon" style={{ background: o.gradient }}>{o.icon}</span>
              <span className="view-switch-label">
                <span className="t">{o.label}</span>
                <span className="s">{o.sub}</span>
              </span>
              {o.key === value && <IconCheck size={14} className="check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Executive/Admin nav: the มุมมองผู้บริหาร overview (company + per-dept
// performance dashboards) up top, then each department's operational pages
// (showing EVERY person's data), then system administration. A coordinator,
// by contrast, gets only their own workspace (COORDINATOR_GROUP), scoped to
// the jobs they own.
const EXEC_NAV = [EXEC_OVERVIEW_GROUP, OPS_COORDINATOR_GROUP, OPS_CONTRACTOR_GROUP, SYSTEM_GROUP];

const ROLE_META = {
  coordinator: {
    roleTag: "Coordinator · Staff Level",
    user: { initials: "นภ", name: "นภัสสร ใจดี", sub: "Coordinator" },
    navGroups: [COORDINATOR_GROUP],
  },
  admin: {
    roleTag: "ผู้บริหาร / แอดมิน · Full Access",
    user: { initials: "ปส", name: "ปุสิทธิ์ นันทวงศ์", sub: "ผู้บริหาร (Owner)" },
    navGroups: EXEC_NAV,
  },
  executive: {
    roleTag: "ผู้บริหาร / แอดมิน · Full Access",
    user: { initials: "ธน", name: "ธนาธิป มหาศาล", sub: "ผู้บริหาร (Owner)" },
    navGroups: EXEC_NAV,
  },
};

// Shared shell for the Coordinator and Admin route groups. Nav items and the
// sidebar identity are derived from the actual logged-in session (not the
// URL) — so an Admin browsing into a Coordinator page still sees their own
// name and the full nav. Logging out always lands back on "/" (the
// role-picker hub), matching the rest of the app's logout behavior.
export default function BusinessAppShell({ title, crumb, titleMap, children }) {
  const { session } = useAuth();
  const meta = ROLE_META[session?.role] || ROLE_META.coordinator;
  // Both seats see all 3 nav groups, so both get the "สลับมุมมอง" preview
  // switcher too — it's a display filter, not a permission (Executive's
  // actual write restriction is separate and always on regardless of filter).
  const isAdmin = session?.role === "admin" || session?.role === "executive";

  const [viewFilter, setViewFilter] = useState("all");
  // Keyed to this login's own loggedInAt, not just saved forever — otherwise
  // narrowing the nav to "ทีมช่าง" etc. in one session silently carries over
  // into a completely different login later and hides Admin's own menu
  // (จัดการผู้ใช้ / Master Data / ...) with no visible reason why.
  useEffect(() => {
    if (!isAdmin) return;
    try {
      const raw = window.localStorage.getItem(VIEW_FILTER_KEY);
      const saved = raw ? JSON.parse(raw) : null;
      setViewFilter(saved && saved.loggedInAt === session?.loggedInAt ? saved.value : "all");
    } catch {
      setViewFilter("all");
    }
  }, [isAdmin, session?.loggedInAt]);

  function handleViewFilterChange(value) {
    setViewFilter(value);
    try {
      window.localStorage.setItem(VIEW_FILTER_KEY, JSON.stringify({ value, loggedInAt: session?.loggedInAt }));
    } catch {
      // ignore
    }
  }

  // The view filter only narrows which nav sections are *shown* — it is a
  // display preference, not a role change. Actions taken while filtered to
  // "ทีมช่าง" etc. are still logged under the real Admin identity, so the
  // audit trail always reflects who actually did what.
  const navGroups = isAdmin && viewFilter !== "all"
    ? meta.navGroups.filter((g) => g.key === viewFilter)
    : meta.navGroups;

  const footerExtra = isAdmin && <ViewSwitcher value={viewFilter} onChange={handleViewFilterChange} />;

  return (
    <AppShell
      roleTag={meta.roleTag}
      navGroups={navGroups}
      user={meta.user}
      loginHref="/"
      audience={session?.role}
      footerExtra={footerExtra}
      title={title}
      crumb={crumb}
      titleMap={titleMap}
    >
      {children}
    </AppShell>
  );
}
