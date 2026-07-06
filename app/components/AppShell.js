"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { IconBell, IconLogOut } from "./icons";
import { useAuth } from "@/app/lib/auth";
import { useNotifications } from "@/app/lib/store";
import { formatRelativeTH } from "@/app/lib/format";

function isActive(pathname, href) {
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AppShell({
  brand = "MACCA PMS",
  brandSub = "Project Management System",
  roleTag,
  navGroups = [],
  user,
  loginHref = "/",
  audience,
  footerExtra,
  title,
  crumb,
  titleMap,
  children,
}) {
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const notifRef = useRef(null);
  const { logout } = useAuth();
  const { notifications, markAllNotificationsRead } = useNotifications();

  const relevantNotifications = notifications.filter((n) => n.audience === "all" || n.audience === audience);
  const unreadCount = relevantNotifications.filter((n) => n.unread).length;

  function handleLogout() {
    logout();
    router.push(loginHref);
  }

  function toggleNotif() {
    const next = !notifOpen;
    setNotifOpen(next);
    // Mark-as-read is a store update; keep it OUT of the setNotifOpen updater so
    // we never call another component's setState during this component's render.
    if (next) markAllNotificationsRead(audience);
  }

  useEffect(() => {
    if (!notifOpen) return undefined;
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  let topTitle = title;
  let topCrumb = crumb;
  if (titleMap) {
    const hit = Object.keys(titleMap).find((k) => isActive(pathname, k));
    if (hit) {
      [topTitle, topCrumb] = titleMap[hit];
    }
  }

  return (
    <div className="app-shell">
      <div className={`app-sidebar-overlay ${open ? "open" : ""}`} onClick={() => setOpen(false)} />

      <nav className={`app-sidebar ${open ? "open" : ""}`}>
        <div className="app-sidebar-brand">
          <div className="app-sidebar-mark">M</div>
          <div>
            <h1>{brand}</h1>
            <span>{brandSub}</span>
          </div>
        </div>

        {roleTag && <div className="app-role-tag">{roleTag}</div>}

        <div className="app-nav">
          {navGroups.map((group) => (
            <div className="app-nav-group" key={group.label || group.items[0]?.href}>
              {group.label && (
                <div className="app-nav-module">
                  {group.icon && <span className="app-nav-module-icon">{group.icon}</span>}
                  <span>{group.label}</span>
                </div>
              )}
              <div className="app-nav-items">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`app-nav-item ${isActive(pathname, item.href) ? "active" : ""}`}
                    onClick={() => setOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {user && (
          <div className="app-sidebar-footer">
            {footerExtra}
            <div className="app-user-row">
              <div className="avatar avatar-md">{user.initials}</div>
              <div>
                <div className="name">{user.name}</div>
                <div className="role">{user.sub}</div>
              </div>
            </div>
            <button type="button" onClick={handleLogout} className="btn btn-outline btn-sm btn-block app-logout">
              <IconLogOut size={14} /> ออกจากระบบ
            </button>
          </div>
        )}
      </nav>

      <div className="app-main">
        <header className="app-topbar">
          <div className="flex-row" style={{ minWidth: 0 }}>
            <div style={{ minWidth: 0 }}>
              {topCrumb && <div className="app-topbar-crumb">{topCrumb}</div>}
              <div className="app-topbar-title">{topTitle}</div>
            </div>
          </div>
          <div className="app-topbar-right">
            <div style={{ position: "relative" }} ref={notifRef}>
              <button
                className="app-icon-btn"
                aria-label="การแจ้งเตือน"
                onClick={toggleNotif}
              >
                <IconBell size={16} />
                {unreadCount > 0 && <span className="dot" />}
              </button>
              {notifOpen && (
                <div className="ds-card notif-panel">
                  <div className="ds-card-header" style={{ paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
                    <div className="ds-card-title" style={{ marginBottom: 0 }}>การแจ้งเตือน</div>
                  </div>
                  {relevantNotifications.length === 0 ? (
                    <div className="notif-item">
                      <div className="d">ยังไม่มีการแจ้งเตือน</div>
                    </div>
                  ) : (
                    relevantNotifications.slice(0, 8).map((n) => (
                      <div className="notif-item" key={n.id}>
                        <div className="t">{n.title}</div>
                        <div className="d">{n.detail}</div>
                        <div className="tm">{formatRelativeTH(n.time)}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            {user && <div className="avatar avatar-md">{user.initials}</div>}
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
