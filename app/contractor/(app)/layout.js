import ContractorShell from "@/app/components/ContractorShell";
import RequireAuth from "@/app/components/RequireAuth";
import { IconBriefcase, IconCalendar, IconCamera, IconUser } from "@/app/components/icons";

const tabs = [
  { href: "/contractor/jobs", label: "งานของฉัน", icon: <IconBriefcase size={18} /> },
  { href: "/contractor/calendar", label: "ปฏิทิน", icon: <IconCalendar size={18} /> },
  { href: "/contractor/upload", label: "ส่งรูปภาพ", icon: <IconCamera size={18} /> },
  { href: "/contractor/dashboard", label: "โปรไฟล์", icon: <IconUser size={18} /> },
];

export default function ContractorAppLayout({ children }) {
  return (
    <RequireAuth role="contractor" loginHref="/">
      <ContractorShell tabs={tabs}>
        {children}
      </ContractorShell>
    </RequireAuth>
  );
}
