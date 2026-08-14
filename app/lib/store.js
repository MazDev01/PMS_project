"use client";

// Global client-side "database" for the MACCA PMS prototype.
//
// There is no backend in this project — every role (Coordinator, Contractor,
// Admin, Guest) runs in the same browser. This store is the single shared
// source of truth for all mutable demo data, backed by localStorage so that
// actions taken in one role (e.g. a contractor signing off a job) are
// immediately visible in another (e.g. the coordinator's dashboard), and
// survive page reloads instead of resetting on every navigation.
//
// Mango & external integration stays simulated by design (no real Mango
// sandbox/credentials available) — the sync tables here just model what a
// real integration's state would look like.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as seed from "./mockData";

// Bump this whenever mockData.js's seed shape/volume changes meaningfully —
// old localStorage saved under a previous key is simply ignored, so everyone
// picks up the fresh seed data instead of a stale cached copy silently
// overriding it (this key changed when the mock dataset grew from ~10 jobs/
// 5 teams to ~55 jobs/10 teams, again when generatedLinks gained a `token`
// field the guest pages depend on, again when the ผู้บริหาร/Executive role +
// staff user were added, and again when jobs/teams gained the
// coordinatorId/quotationRevisions/customerFollowUps/customerRating/onLeave
// fields the two Executive performance-analytics pages depend on).
const STORAGE_KEY = "macca-pms-db-v21";

function loadInitial() {
  return {
    jobs: seed.jobs,
    customers: seed.customers,
    teams: seed.teams,
    personnel: seed.personnel,
    jobTypes: seed.jobTypes,
    scheduleEvents: seed.scheduleEvents,
    generatedLinks: seed.generatedLinks,
    warranties: seed.warranties,
    repairTickets: seed.repairTickets,
    syncStatus: seed.syncStatus,
    staffUsers: seed.staffUsers,
    auditLogs: seed.auditLogs,
    // Seeded with two inbound customer cases (a reschedule request and a
    // quotation rejection) so the coordinator's bell shows real "next action"
    // examples from the start; live guest actions append more of the same shape.
    notifications: seed.seedNotifications,
    roles: seed.defaultRoles,
    // Completed jobs ship with a full evidence trail (before/during/after
    // photos + signed delivery note) so an opened done-job shows what the
    // system stores at close-out, instead of an empty gallery.
    uploads: seed.seedUploads,
  };
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [db, setDb] = useState(loadInitial);
  const [hydrated, setHydrated] = useState(false);

  // Rehydrate from localStorage after mount only, so the server-rendered
  // markup and the first client render match (avoids a hydration warning).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setDb((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // Corrupt/unavailable storage — fall back to the seed data silently.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      // Storage full or unavailable (e.g. private browsing) — data still
      // works for the current session, just won't persist across reloads.
    }
  }, [db, hydrated]);

  const update = useCallback((key, updater) => {
    setDb((prev) => ({
      ...prev,
      [key]: typeof updater === "function" ? updater(prev[key]) : updater,
    }));
  }, []);

  const addAuditLog = useCallback((entry) => {
    setDb((prev) => ({
      ...prev,
      auditLogs: [
        {
          id: `L-${Date.now()}`,
          timestamp: new Date().toISOString(),
          ...entry,
        },
        ...prev.auditLogs,
      ],
    }));
  }, []);

  const addNotification = useCallback((entry) => {
    setDb((prev) => ({
      ...prev,
      notifications: [
        {
          id: `N-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          time: new Date().toISOString(),
          unread: true,
          audience: "all",
          ...entry,
        },
        ...prev.notifications,
      ],
    }));
  }, []);

  const markNotificationRead = useCallback((id) => {
    setDb((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    }));
  }, []);

  const markAllNotificationsRead = useCallback((audienceFilter) => {
    setDb((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        !audienceFilter || n.audience === audienceFilter || n.audience === "all" ? { ...n, unread: false } : n
      ),
    }));
  }, []);

  const setUpload = useCallback((jobId, updater) => {
    setDb((prev) => {
      const current = prev.uploads[jobId] || { before: [], during: [], after: [], deliveryFileName: null, sentToCoordinator: false, signedOff: false };
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...prev, uploads: { ...prev.uploads, [jobId]: next } };
    });
  }, []);

  const resetDemo = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setDb(loadInitial());
  }, []);

  const value = useMemo(
    () => ({ db, update, addAuditLog, addNotification, markNotificationRead, markAllNotificationsRead, setUpload, resetDemo, hydrated }),
    [db, update, addAuditLog, addNotification, markNotificationRead, markAllNotificationsRead, setUpload, resetDemo, hydrated]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}

// Per-entity hooks with a useState-like [value, setValue] shape, so existing
// pages that did `useState(initialJobs)` only need to swap the import.
function makeEntityHook(key) {
  return function useEntity() {
    const { db, update } = useStore();
    const setValue = useCallback((updater) => update(key, updater), [update]);
    return [db[key], setValue];
  };
}

export const useJobs = makeEntityHook("jobs");
export const useCustomers = makeEntityHook("customers");
export const useTeams = makeEntityHook("teams");
export const usePersonnel = makeEntityHook("personnel");
export const useJobTypes = makeEntityHook("jobTypes");
export const useScheduleEvents = makeEntityHook("scheduleEvents");
export const useGeneratedLinks = makeEntityHook("generatedLinks");
export const useWarranties = makeEntityHook("warranties");
export const useRepairTickets = makeEntityHook("repairTickets");
export const useSyncStatus = makeEntityHook("syncStatus");
export const useStaffUsers = makeEntityHook("staffUsers");
export const useAuditLogs = makeEntityHook("auditLogs");
export const useRoles = makeEntityHook("roles");

export function useNotifications() {
  const { db, addNotification, markNotificationRead, markAllNotificationsRead } = useStore();
  return { notifications: db.notifications, addNotification, markNotificationRead, markAllNotificationsRead };
}

export function useUploads(jobId) {
  const { db, setUpload } = useStore();
  const value = db.uploads[jobId] || { before: [], during: [], after: [], deliveryFileName: null, sentToCoordinator: false, signedOff: false };
  const setValue = useCallback((updater) => setUpload(jobId, updater), [setUpload, jobId]);
  return [value, setValue];
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
