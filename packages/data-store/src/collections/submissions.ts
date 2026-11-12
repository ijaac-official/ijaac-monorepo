import { randomUUID } from "node:crypto";
import type { Submission, SubmissionStatus } from "@ijaac/shared";
import { readCollection, updateCollection } from "../json-store";

const COLLECTION = "submissions";

export async function listSubmissions(filter?: {
  status?: SubmissionStatus;
  /** Case-insensitive match against title, keywords, or any author's name/email. */
  query?: string;
}): Promise<Submission[]> {
  const items = await readCollection<Submission>(COLLECTION);
  let results = [...items].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  if (filter?.status) {
    results = results.filter((s) => s.status === filter.status);
  }
  if (filter?.query?.trim()) {
    const q = filter.query.trim().toLowerCase();
    results = results.filter((s) => {
      const haystack = [
        s.title,
        ...s.keywords,
        ...s.authors.flatMap((a) => [a.name, a.email]),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }
  return results;
}

/** Submissions published within the given month (defaults to the current month). */
export async function listPublicationsForMonth(reference: Date = new Date()): Promise<Submission[]> {
  const items = await readCollection<Submission>(COLLECTION);
  return items
    .filter((s) => {
      if (s.status !== "PUBLISHED" || !s.publishedAt) return false;
      const d = new Date(s.publishedAt);
      return d.getUTCFullYear() === reference.getUTCFullYear() && d.getUTCMonth() === reference.getUTCMonth();
    })
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}

/** Paginated, newest-published-first listing for the public "All Publications" page. */
export async function listPublishedPapersPage(options?: {
  offset?: number;
  limit?: number;
}): Promise<{ items: Submission[]; total: number }> {
  const items = await readCollection<Submission>(COLLECTION);
  const published = items
    .filter((s) => s.status === "PUBLISHED")
    .sort((a, b) => (b.publishedAt ?? b.submittedAt).localeCompare(a.publishedAt ?? a.submittedAt));

  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? 10;
  return { items: published.slice(offset, offset + limit), total: published.length };
}

export async function getSubmission(id: string): Promise<Submission | null> {
  const items = await readCollection<Submission>(COLLECTION);
  return items.find((s) => s.id === id) ?? null;
}

export type NewSubmissionInput = Omit<
  Submission,
  "id" | "status" | "submittedAt" | "updatedAt" | "decidedAt" | "decidedById" | "reviewComment"
>;

export async function createSubmission(input: NewSubmissionInput): Promise<Submission> {
  const now = new Date().toISOString();
  const record: Submission = {
    ...input,
    id: randomUUID(),
    status: "PENDING",
    submittedAt: now,
    updatedAt: now,
  };
  await updateCollection<Submission>(COLLECTION, (items) => [...items, record]);
  return record;
}

export interface DecideSubmissionInput {
  status: "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "PUBLISHED";
  reviewComment?: string;
  decidedById?: string;
  issueId?: string;
  volume?: string;
  issueNumber?: string;
  publishedFileKey?: string;
  publicFileKey?: string;
}

export async function decideSubmission(
  id: string,
  input: DecideSubmissionInput
): Promise<Submission> {
  let updated: Submission | undefined;
  await updateCollection<Submission>(COLLECTION, (items) =>
    items.map((item) => {
      if (item.id !== id) return item;
      const now = new Date().toISOString();
      updated = {
        ...item,
        status: input.status,
        reviewComment: input.reviewComment ?? item.reviewComment,
        decidedById: input.decidedById ?? item.decidedById,
        issueId: input.issueId ?? item.issueId,
        volume: input.volume ?? item.volume,
        issueNumber: input.issueNumber ?? item.issueNumber,
        publishedFileKey: input.publishedFileKey ?? item.publishedFileKey,
        publicFileKey: input.publicFileKey ?? item.publicFileKey,
        publishedAt: input.status === "PUBLISHED" ? item.publishedAt ?? now : item.publishedAt,
        decidedAt: now,
        updatedAt: now,
      };
      return updated;
    })
  );
  if (!updated) throw new Error(`Submission not found: ${id}`);
  return updated;
}
