import LoginForm from "@/app/components/LoginForm";

export const metadata = { title: "เข้าสู่ระบบ Executive — MACCA PMS" };

export default function ExecutiveLoginPage() {
  return (
    <LoginForm
      title="เข้าสู่ระบบ Executive"
      subtitle="สำหรับผู้บริหาร (ดูข้อมูลทุกส่วนได้ แก้ไข/ลบไม่ได้)"
      dashboardHref="/admin/dashboard"
      role="executive"
    />
  );
}
