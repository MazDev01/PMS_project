import LoginForm from "@/app/components/LoginForm";

export const metadata = { title: "เข้าสู่ระบบ Contractor — MACCA PMS" };

export default function ContractorLoginPage() {
  return (
    <LoginForm
      title="เข้าสู่ระบบ Contractor"
      subtitle="สำหรับผู้รับเหมา / ทีม Service (Mobile-First)"
      dashboardHref="/contractor/jobs"
      role="contractor"
      mobile
    />
  );
}
