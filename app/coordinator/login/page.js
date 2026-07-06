import LoginForm from "@/app/components/LoginForm";

export const metadata = { title: "เข้าสู่ระบบ Coordinator — MACCA PMS" };

export default function CoordinatorLoginPage() {
  return (
    <LoginForm
      title="เข้าสู่ระบบ Coordinator"
      subtitle="สำหรับผู้ประสานงาน (Staff / Coordinator Level)"
      dashboardHref="/coordinator/dashboard"
      role="coordinator"
    />
  );
}
