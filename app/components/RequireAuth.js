"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth";

function isAllowed(session, role) {
  if (!session) return false;
  return Array.isArray(role) ? role.includes(session.role) : session.role === role;
}

// Gates a role's (app) route group behind a real session check. Visiting a
// protected URL directly (e.g. typing /coordinator/dashboard with no prior
// login) now redirects to `loginHref` (the "/" role-picker hub, same as
// clicking logout) instead of rendering the page regardless of login state.
// `role` may be a single role or an array — the Coordinator route group also
// allows "admin" sessions through, since Admin (Owner) reuses the
// Coordinator's own pages rather than a duplicate set.
export default function RequireAuth({ role, loginHref, children }) {
  const { session } = useAuth();
  const router = useRouter();
  const allowed = isAllowed(session, role);

  useEffect(() => {
    if (session === null || (session && !allowed)) {
      router.replace(loginHref);
    }
  }, [session, allowed, loginHref, router]);

  if (session === undefined) {
    return (
      <div className="auth-check-wrap">
        <div className="auth-check-spinner" />
      </div>
    );
  }
  if (session === null || !allowed) return null;

  return children;
}
