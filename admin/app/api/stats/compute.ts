import type { Submission, SubmissionStatus } from "@ijaac/shared";
import { SUBMISSION_STATUSES } from "@ijaac/shared";
import {
  addDays,
  daysBetween,
  istDate,
  istDayStart,
  type StatsBucket,
  type StatsKpis,
  type StatsPoint,
  type StatsResponse,
} from "@/components/stats/types";

export interface StatsQuery {
  /** "YYYY-MM-DD" (IST). Omit for all time. */
  from?: string;
  /** "YYYY-MM-DD" (IST). Defaults to today. */
  to?: string;
  bucket?: StatsBucket;
}

function ts(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? undefined : ms;
}

function inRange(ms: number | undefined, start: number, end: number): ms is number {
  return ms !== undefined && ms >= start && ms < end;
}

function computeKpis(items: Submission[], start: number, end: number): StatsKpis {
  const k: StatsKpis = {
    published: 0,
    revenuePaise: 0,
    approved: 0,
    rejected: 0,
    submissions: 0,
    pendingOrReview: 0,
    couponsUsed: 0,
  };
  for (const s of items) {
    const submitted = ts(s.submittedAt);
    if (inRange(submitted, start, end)) {
      k.submissions++;
      if (s.status === "PENDING" || s.status === "UNDER_REVIEW") k.pendingOrReview++;
      if (s.couponCode) k.couponsUsed++;
    }
    if (inRange(ts(s.publishedAt), start, end)) k.published++;
    const decided = ts(s.decidedAt);
    // Published papers were approved first; publishing overwrites decidedAt, so use publishedAt for them.
    if (s.status === "APPROVED" && inRange(decided, start, end)) k.approved++;
    if (s.status === "PUBLISHED" && inRange(ts(s.publishedAt ?? s.decidedAt), start, end)) k.approved++;
    if (s.status === "REJECTED" && inRange(decided, start, end)) k.rejected++;
    if (s.payment && inRange(ts(s.payment.paidAt), start, end)) k.revenuePaise += s.payment.amountInPaise || 0;
  }
  return k;
}

function bucketKey(ms: number, bucket: StatsBucket): string {
  const d = istDate(ms);
  return bucket === "day" ? d : d.slice(0, 7);
}

function enumerateBuckets(from: string, to: string, bucket: StatsBucket): string[] {
  const keys: string[] = [];
  if (bucket === "day") {
    for (let d = from; d <= to; d = addDays(d, 1)) keys.push(d);
    return keys;
  }
  let [y, m] = from.slice(0, 7).split("-").map(Number);
  const end = to.slice(0, 7);
  for (;;) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    keys.push(key);
    if (key >= end || keys.length > 1200) break;
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return keys;
}

function earliestEventDate(items: Submission[], fallback: string): string {
  let min: number | undefined;
  for (const s of items) {
    for (const v of [s.submittedAt, s.publishedAt, s.decidedAt, s.payment?.paidAt]) {
      const ms = ts(v);
      if (ms !== undefined && (min === undefined || ms < min)) min = ms;
    }
  }
  return min === undefined ? fallback : istDate(min);
}

export function computeStats(items: Submission[], query: StatsQuery = {}): StatsResponse {
  const today = istDate(Date.now());
  const allTime = !query.from;
  let to = query.to ?? today;
  let from = query.from ?? earliestEventDate(items, to);
  if (from > to) [from, to] = [to, from];

  const days = daysBetween(from, to);
  const autoBucket: StatsBucket = !allTime && days <= 90 ? "day" : "month";
  // Cap daily buckets at ~2 years so a stray query can't build a huge series.
  const bucket: StatsBucket = query.bucket === "day" && days > 731 ? "month" : query.bucket ?? autoBucket;
  const start = istDayStart(from);
  const end = istDayStart(addDays(to, 1));

  const kpis = computeKpis(items, start, end);

  let previous: StatsKpis | undefined;
  let previousRange: StatsResponse["previousRange"];
  if (!allTime) {
    const prevTo = addDays(from, -1);
    const prevFrom = addDays(prevTo, -(days - 1));
    previous = computeKpis(items, istDayStart(prevFrom), start);
    previousRange = { from: prevFrom, to: prevTo };
  }

  const map = new Map<string, StatsPoint>();
  for (const key of enumerateBuckets(from, to, bucket)) {
    map.set(key, { key, submitted: 0, published: 0, approved: 0, rejected: 0, revenuePaise: 0 });
  }
  const bump = (ms: number | undefined, field: Exclude<keyof StatsPoint, "key">, by = 1) => {
    if (!inRange(ms, start, end)) return;
    const point = map.get(bucketKey(ms, bucket));
    if (point) point[field] += by;
  };

  const statusCounts = new Map<SubmissionStatus, number>();
  for (const s of items) {
    const submitted = ts(s.submittedAt);
    bump(submitted, "submitted");
    if (inRange(submitted, start, end)) statusCounts.set(s.status, (statusCounts.get(s.status) ?? 0) + 1);
    bump(ts(s.publishedAt), "published");
    if (s.status === "APPROVED") bump(ts(s.decidedAt), "approved");
    if (s.status === "PUBLISHED") bump(ts(s.publishedAt ?? s.decidedAt), "approved");
    if (s.status === "REJECTED") bump(ts(s.decidedAt), "rejected");
    if (s.payment) bump(ts(s.payment.paidAt), "revenuePaise", s.payment.amountInPaise || 0);
  }

  return {
    range: { from, to, bucket, allTime, days },
    kpis,
    previous,
    previousRange,
    series: [...map.values()],
    statusBreakdown: SUBMISSION_STATUSES.map((status) => ({ status, count: statusCounts.get(status) ?? 0 })),
  };
}
