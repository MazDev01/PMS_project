import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names with Tailwind conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Thai Baht, e.g. 12500 → "฿12,500". */
export function formatBaht(amount: number, withSymbol = true) {
  const value = new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return withSymbol ? `฿${value}` : value;
}

/** Format an ISO date string to Thai short date, e.g. "3 ก.ค. 2569". */
export function formatThaiDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  }).format(d);
}

/** Format an ISO datetime to Thai date + time. */
export function formatThaiDateTime(iso: string) {
  return formatThaiDate(iso, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
