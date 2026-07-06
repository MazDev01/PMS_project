import LoginForm from "@/app/components/LoginForm";

export const metadata = { title: "เข้าสู่ระบบ Admin — MACCA PMS" };

export default function AdminLoginPage() {
  return (
    <LoginForm
      title="เข้าสู่ระบบ Admin"
      subtitle="สำหรับผู้ดูแลระบบ (Administration)"
      dashboardHref="/admin/dashboard"
      role="admin"
    />
  );
}
