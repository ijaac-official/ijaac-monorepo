import { randomUUID } from "node:crypto";
import type { Issue } from "@ijaac/shared";
import { readCollection, updateCollection } from "../json-store";

const COLLECTION = "issues";

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Month (1-12) of an issue: explicit `month`, else the numeric issue number when it is 1-12. */
export function issueMonth(issue: Pick<Issue, "month" | "number">): number | undefined {
  if (issue.month && issue.month >= 1 && issue.month <= 12) return issue.month;
  const n = Number.parseInt(issue.number, 10);
  return Number.isFinite(n) && n >= 1 && n <= 12 ? n : undefined;
}

function numericOrder(issue: Issue): number {
  if (issue.month) return issue.month;
  const n = Number.parseInt(issue.number, 10);
  return Number.isFinite(n) ? n : 0;
}

/** Newest first: year desc, then month / issue number desc (numeric, so 10 > 2). */
export function compareIssuesDesc(a: Issue, b: Issue): number {
  return (
    b.year - a.year ||
    numericOrder(b) - numericOrder(a) ||
    b.number.localeCompare(a.number, undefined, { numeric: true })
  );
}

/**
 * Duplicate check uses only the explicit `month` field: legacy (bimonthly)
 * issues have a number but no month, and must not block a monthly issue.
 */
function sameMonth(a: Issue, year: number, month: number): boolean {
  return a.year === year && a.month === month;
}

export class DuplicateIssueError extends Error {
  constructor(year: number, month: number) {
    super(`An issue for ${MONTH_NAMES[month - 1]} ${year} already exists`);
    this.name = "DuplicateIssueError";
  }
}

export async function listIssues(): Promise<Issue[]> {
  const items = await readCollection<Issue>(COLLECTION);
  return [...items].sort(compareIssuesDesc);
}

/** Issues shown on the public site (hidden ones removed), newest first. */
export async function listPublicIssues(): Promise<Issue[]> {
  return (await listIssues()).filter((i) => !i.isHidden);
}

/** Ids of issues hidden from the public site. */
export async function hiddenIssueIds(): Promise<Set<string>> {
  const items = await readCollection<Issue>(COLLECTION);
  return new Set(items.filter((i) => i.isHidden).map((i) => i.id));
}

/** The current issue, unless it is hidden from public view. */
export async function getPublicCurrentIssue(): Promise<Issue | null> {
  const current = await getCurrentIssue();
  return current && !current.isHidden ? current : null;
}

/** An issue by id, or null when it does not exist or is hidden. */
export async function getPublicIssue(id: string): Promise<Issue | null> {
  const issue = await getIssue(id);
  return issue && !issue.isHidden ? issue : null;
}

export async function getCurrentIssue(): Promise<Issue | null> {
  const items = await readCollection<Issue>(COLLECTION);
  return items.find((i) => i.isCurrent) ?? null;
}

export async function getIssue(id: string): Promise<Issue | null> {
  const items = await readCollection<Issue>(COLLECTION);
  return items.find((i) => i.id === id) ?? null;
}

export type NewIssueInput = Omit<Issue, "id" | "createdAt" | "isCurrent"> & {
  isCurrent?: boolean;
};

/**
 * Creates an issue. When `month` is given, a second issue for the same
 * year+month is rejected with DuplicateIssueError.
 */
export async function createIssue(input: NewIssueInput): Promise<Issue> {
  const now = new Date().toISOString();
  const record: Issue = {
    ...input,
    isCurrent: input.isCurrent ?? false,
    id: randomUUID(),
    createdAt: now,
  };
  await updateCollection<Issue>(COLLECTION, (items) => {
    if (record.month && items.some((i) => sameMonth(i, record.year, record.month!))) {
      throw new DuplicateIssueError(record.year, record.month);
    }
    const next = record.isCurrent ? items.map((i) => ({ ...i, isCurrent: false })) : items;
    return [...next, record];
  });
  return record;
}

/** Volume for a year: Volume 1 = firstYear. */
export function volumeForYear(year: number, firstYear: number): number {
  return Math.max(1, year - firstYear + 1);
}

/** Earliest year among existing issues, or the current year if there are none. */
export function firstIssueYear(items: Issue[]): number {
  return items.length ? Math.min(...items.map((i) => i.year)) : new Date().getFullYear();
}

function buildMonthlyIssue(
  items: Issue[],
  input: { year: number; month: number; volume?: string; title?: string; description?: string; coverImageUrl?: string; publishDate?: string; isCurrent?: boolean },
  now: string
): Issue {
  const firstYear = Math.min(firstIssueYear(items), input.year);
  return {
    id: randomUUID(),
    year: input.year,
    month: input.month,
    number: String(input.month),
    volume: input.volume ?? String(volumeForYear(input.year, firstYear)),
    title: input.title ?? `${MONTH_NAMES[input.month - 1]} ${input.year}`,
    description: input.description,
    coverImageUrl: input.coverImageUrl,
    publishDate: input.publishDate ?? new Date(Date.UTC(input.year, input.month - 1, 1)).toISOString(),
    isCurrent: input.isCurrent ?? false,
    createdAt: now,
  };
}

/** Creates one monthly issue (number = month, volume auto-computed unless given). */
export async function createMonthlyIssue(input: {
  year: number;
  month: number;
  volume?: string;
  title?: string;
  description?: string;
  coverImageUrl?: string;
  publishDate?: string;
  isCurrent?: boolean;
}): Promise<Issue> {
  if (!Number.isInteger(input.month) || input.month < 1 || input.month > 12) {
    throw new Error("Month must be between 1 and 12");
  }
  const now = new Date().toISOString();
  let record: Issue | undefined;
  await updateCollection<Issue>(COLLECTION, (items) => {
    record = undefined;
    if (items.some((i) => sameMonth(i, input.year, input.month))) {
      throw new DuplicateIssueError(input.year, input.month);
    }
    record = buildMonthlyIssue(items, input, now);
    const next = record.isCurrent ? items.map((i) => ({ ...i, isCurrent: false })) : items;
    return [...next, record];
  });
  if (!record) throw new Error("Failed to create issue");
  return record;
}

/**
 * Ensures all 12 monthly issues exist for `year`. Months that already have an
 * issue are skipped. Returns only the newly created issues.
 */
export async function ensureYearIssues(year: number, options?: { volume?: string }): Promise<Issue[]> {
  const now = new Date().toISOString();
  let created: Issue[] = [];
  await updateCollection<Issue>(COLLECTION, (items) => {
    created = [];
    for (let month = 1; month <= 12; month++) {
      if (items.some((i) => sameMonth(i, year, month))) continue;
      created.push(buildMonthlyIssue(items, { year, month, volume: options?.volume }, now));
    }
    return created.length ? [...items, ...created] : items;
  });
  return created;
}

export async function setCurrentIssue(id: string): Promise<void> {
  await updateCollection<Issue>(COLLECTION, (items) =>
    items.map((i) => ({ ...i, isCurrent: i.id === id }))
  );
}

export async function updateIssue(
  id: string,
  patch: Partial<Omit<Issue, "id" | "createdAt" | "isCurrent">>
): Promise<Issue> {
  let updated: Issue | undefined;
  await updateCollection<Issue>(COLLECTION, (items) => {
    updated = undefined;
    const existing = items.find((i) => i.id === id);
    if (existing) {
      const merged = { ...existing, ...patch };
      const month = merged.month;
      if (
        month &&
        (patch.year !== undefined || patch.month !== undefined) &&
        items.some((i) => i.id !== id && sameMonth(i, merged.year, month))
      ) {
        throw new DuplicateIssueError(merged.year, month);
      }
    }
    return items.map((i) => {
      if (i.id !== id) return i;
      updated = { ...i, ...patch };
      return updated;
    });
  });
  if (!updated) throw new Error(`Issue not found: ${id}`);
  return updated;
}
