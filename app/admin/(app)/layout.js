import RequireAuth from "@/app/components/RequireAuth";
import BusinessAppShell from "@/app/components/BusinessAppShell";

const TITLES = {
  "/admin/dashboard": ["Dashboard", "ภาพรวมระบบ"],
  "/admin/users": ["จัดการผู้ใช้", "User Management"],
  "/admin/master-data": ["Master Data", "ข้อมูลตั้งต้นระบบ"],
  "/admin/audit": ["ประวัติการใช้งานระบบ", "System Audit & Logs"],
  "/admin/mango": ["ซิงค์ข้อมูล Mango", "Mango & External Integration"],
  "/admin/team-dispatch": ["กระดานจ่ายงานทีมช่าง", "Team Dispatch Board"],
  "/admin/team-evidence": ["ติดตามหลักฐานหน้างาน", "Site Evidence Tracker"],
  "/admin/team-repairs": ["คิวเคสแจ้งซ่อมรายทีม", "Repair Queue by Team"],
  "/admin/team-roster": ["กำลังพลและความพร้อมทีม", "Team Roster & Availability"],
  "/admin/coordinator-performance": ["ประสิทธิภาพผู้ประสานงาน", "Coordinator Performance View"],
  "/admin/team-performance": ["ประสิทธิภาพทีมช่าง", "Field Team Performance View"],
};

export default function AdminAppLayout({ children }) {
  return (
    <RequireAuth role={["admin", "executive"]} loginHref="/">
      <BusinessAppShell title="Admin Portal" crumb="MACCA PMS" titleMap={TITLES}>
        {children}
      </BusinessAppShell>
    </RequireAuth>
  );
}
