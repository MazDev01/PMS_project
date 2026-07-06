import Link from "next/link";
import { IconHome } from "./icons";

export default function GuestShell({ children }) {
  return (
    <div className="guest-shell">
      <div className="guest-topbar">
        <Link href="/" className="guest-topbar-back" title="กลับหน้ารวมสิทธิ์">
          <IconHome size={14} />
          <span>หน้ารวมสิทธิ์</span>
        </Link>
        <div className="guest-topbar-brand">
          <div className="app-sidebar-mark">M</div>
          <span>MACCA Light Engineering</span>
        </div>
      </div>
      <div className="guest-container">{children}</div>
    </div>
  );
}
