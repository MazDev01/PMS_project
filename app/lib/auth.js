"use client";

// Lightweight client-side session layer. There is no real backend, so
// "logging in" just records which role/demo-user is active in localStorage
// — but that session is now real in the sense that it persists across
// reloads and actually gates access to each role's protected routes
// (RequireAuth below), instead of every route being open regardless of
// login state.
//
// Per earlier product direction, login itself stays one-click (no typing
// required) — this only makes what happens *after* clicking real.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { staffUsers, personnel } from "./mockData";

// v3: session now carries userId (for per-coordinator job scoping) — bumping
// clears stale v2 sessions so everyone re-logs in with the new field.
const SESSION_KEY = "macca-pms-session-v3";

const AuthContext = createContext(null);

function demoUserFor(role) {
  return staffUsers.find((u) => u.role === role && u.status === "active") || null;
}

export function AuthProvider({ children }) {
  // undefined = not yet checked localStorage; null = checked, no session.
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      setSession(raw ? JSON.parse(raw) : null);
    } catch {
      setSession(null);
    }
  }, []);

  // Contractor login identifies a specific technician (personId) — jobs are
  // now assigned to individual crew members, not whole teams, so "which
  // technician is this" has to be part of the session, not just the role.
  const login = useCallback((role, personId) => {
    let next;
    if (role === "contractor" && personId) {
      const person = personnel.find((p) => p.id === personId);
      next = {
        role, personId,
        name: person?.name || "ช่างสาธิต",
        teamId: person?.teamId || null,
        loggedInAt: new Date().toISOString(),
      };
    } else {
      const demoUser = demoUserFor(role);
      // userId identifies WHICH staff member this is. A coordinator only sees
      // jobs they own (job.coordinatorId === userId); an admin/executive sees
      // everything (scopeJobsToSession ignores userId for those roles).
      next = { role, userId: demoUser?.id || null, name: demoUser?.name || "ผู้ใช้งานสาธิต", loggedInAt: new Date().toISOString() };
    }
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    setSession(next);
    return next;
  }, []);

  const logout = useCallback(() => {
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
    setSession(null);
  }, []);

  const value = useMemo(() => ({ session, login, logout }), [session, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
