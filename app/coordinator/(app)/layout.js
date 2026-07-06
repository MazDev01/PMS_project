import RequireAuth from "@/app/components/RequireAuth";
import BusinessAppShell from "@/app/components/BusinessAppShell";

const TITLES = {
  "/coordinator/dashboard": ["Dashboard", "ภาพรวมระบบ"],
  "/coordinator/jobs": ["จัดการงาน", "Job Management"],
  "/coordinator/schedule": ["จัดทำแผนงาน", "Job Scheduling"],
  "/coordinator/links": ["สร้างลิงก์", "Link Generator"],
  "/coordinator/closing": ["ปิดงาน & การเงิน", "Job Closing"],
  "/coordinator/warranty": ["บริการหลังการขาย", "Warranty & Maintenance"],
};

export default function CoordinatorAppLayout({ children }) {
  return (
    <RequireAuth role={["coordinator", "admin", "executive"]} loginHref="/">
      <BusinessAppShell title="Coordinator Portal" crumb="MACCA PMS" titleMap={TITLES}>
        {children}
      </BusinessAppShell>
    </RequireAuth>
  );
}
