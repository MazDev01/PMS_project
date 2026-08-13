import { schedule, jobs, getCustomer } from "./data";
import type { Job, Customer, ScheduleEntry } from "./types";

/** The signed-in service team for this prototype. */
export const CURRENT_CONTRACTOR_ID = "t1";
export const CURRENT_CONTRACTOR_NAME = "ทีมช่างเอก";
/** "Today" fixed to the proposal's system date. */
export const TODAY = "2026-07-03";

export type CtBucket = "today" | "upcoming" | "done";

export interface MyJob {
  entry: ScheduleEntry;
  job: Job;
  customer?: Customer;
  bucket: CtBucket;
  label: string;
  tone: "today" | "progress" | "done" | "wait";
}

function classify(entry: ScheduleEntry, job: Job): MyJob {
  const customer = getCustomer(job.customerId);
  const finished = ["delivered", "paid", "closed"].includes(job.status);

  let bucket: CtBucket;
  let label: string;
  let tone: MyJob["tone"];

  if (finished || entry.date < TODAY) {
    bucket = "done";
    label = "เสร็จแล้ว";
    tone = "done";
  } else if (entry.date === TODAY) {
    bucket = "today";
    if (job.status === "in_progress") {
      label = "กำลังทำงาน";
      tone = "progress";
    } else {
      label = "ถึงคิววันนี้";
      tone = "today";
    }
  } else {
    bucket = "upcoming";
    if (!entry.confirmed) {
      label = "รอลูกค้ายืนยัน";
      tone = "wait";
    } else {
      label = "ยืนยันแล้ว";
      tone = "today";
    }
  }

  return { entry, job, customer, bucket, label, tone };
}

export function getMyJobs(contractorId = CURRENT_CONTRACTOR_ID): MyJob[] {
  return schedule
    .filter((s) => s.contractorId === contractorId)
    .map((entry) => {
      const job = jobs.find((j) => j.id === entry.jobId)!;
      return classify(entry, job);
    })
    .filter((m) => m.job)
    .sort((a, b) => a.entry.date.localeCompare(b.entry.date));
}

export function getMyJobById(jobId: string) {
  const entry = schedule.find(
    (s) => s.jobId === jobId && s.contractorId === CURRENT_CONTRACTOR_ID,
  );
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return undefined;
  const base = entry ?? {
    id: "tmp",
    jobId,
    contractorId: CURRENT_CONTRACTOR_ID,
    date: TODAY,
    start: "09:00",
    end: "12:00",
    confirmed: true,
  };
  return classify(base, job);
}

export const TONE_CLASS: Record<MyJob["tone"], string> = {
  today: "bg-white/25 text-white",
  progress: "bg-amber-300/90 text-amber-950",
  done: "bg-emerald-300/90 text-emerald-950",
  wait: "bg-white/15 text-white/90",
};
