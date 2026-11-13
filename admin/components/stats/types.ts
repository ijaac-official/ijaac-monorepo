// Shared (client + server) types and date helpers for dashboard stats.
// Dates are bucketed in IST (UTC+05:30, no DST) so a "day" matches the editors' calendar.

import type { SubmissionStatus } from "@ijaac/shared";

export type StatsBucket = "day" | "month";

export interface StatsKpis {
  published: number;
  revenuePaise: number;
  approved: number;
  rejected: number;
  submissions: number;
  /** Submissions currently PENDING or UNDER_REVIEW */
  pendingOrReview: number;
  couponsUsed: number;
}

export interface StatsPoint {
  /** "YYYY-MM-DD" for day buckets, "YYYY-MM" for month buckets */
  key: string;
  submitted: number;
  published: number;
  approved: number;
  rejected: number;
  revenuePaise: number;
}

export interface StatsResponse {
  range: { from: string; to: string; bucket: StatsBucket; allTime: boolean; days: number };
  kpis: StatsKpis;
  /** Previous equal-length period (absent for all time) */
  previous?: StatsKpis;
  previousRange?: { from: string; to: string };
  series: StatsPoint[];
  statusBreakdown: { status: SubmissionStatus; count: number }[];
}

export const IST_OFFSET_MS = 330 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" in IST for a timestamp (ms). */
export function istDate(ms: number): string {
  return new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Start of an IST calendar day (ms) for "YYYY-MM-DD". */
export function istDayStart(date: string): number {
  return Date.parse(`${date}T00:00:00+05:30`);
}

export function addDays(date: string, n: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
}

/** Inclusive day count between two "YYYY-MM-DD" dates. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS) + 1;
}

export function isIsoDate(s: string | null | undefined): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
}
