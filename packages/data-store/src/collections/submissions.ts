import { randomUUID } from "node:crypto";
import { isPubliclyVisible } from "@ijaac/shared";
import type { ReviewAssignment, Submission, SubmissionStatus } from "@ijaac/shared";
import { readCollection, updateCollection } from "../json-store";

const COLLECTION = "submissions";

export interface SubmissionFilter {
  status?: SubmissionStatus;
  /** Case-insensitive match against title, abstract, keywords, any author's name/email/affiliation, article number. */
  query?: string;
  /** Case-insensitive match against author names/emails only */
  author?: string;
  issueId?: string;
  /** "public" | "private" - only meaningful for published papers */
  visibility?: "public" | "private";
  reviewerId?: string;
  /** ISO date (inclusive) bounds applied to submittedAt */
  from?: string;
  to?: string;
  paid?: boolean;
}

function matchesFullText(s: Submission, query: string): boolean {
  const haystack = [
    s.title,
    s.abstract,
    s.articleNumber ?? "",
    s.couponCode ?? "",
    s.id,
    ...s.keywords,
    ...s.authors.flatMap((a) => [a.name, a.email, a.affiliation ?? ""]),
  ]
    .join(" ")
    .toLowerCase();
  const q = query.trim().toLowerCase();
  // every whitespace-separated term must match somewhere
  return q.split(/\s+/).every((term) => haystack.includes(term));
}

export function filterSubmissions(items: Submission[], filter?: SubmissionFilter): Submission[] {
  let results = [...items].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  if (!filter) return results;
  if (filter.status) results = results.filter((s) => s.status === filter.status);
  if (filter.query?.trim()) results = results.filter((s) => matchesFullText(s, filter.query!));
  if (filter.author?.trim()) {
    const a = filter.author.trim().toLowerCase();
    results = results.filter((s) =>
      s.authors.some((x) => x.name.toLowerCase().includes(a) || x.email.toLowerCase().includes(a))
    );
  }
  if (filter.issueId) results = results.filter((s) => s.issueId === filter.issueId);
  if (filter.visibility === "public") results = results.filter((s) => s.isPublic !== false);
  if (filter.visibility === "private") results = results.filter((s) => s.isPublic === false);
  if (filter.reviewerId)
    results = results.filter((s) => s.reviewAssignments?.some((r) => r.reviewerId === filter.reviewerId));
  if (filter.from) results = results.filter((s) => s.submittedAt >= filter.from!);
  if (filter.to) {
    // inclusive end-of-day when a bare date is given
    const to = filter.to.length <= 10 ? `${filter.to}T23:59:59.999Z` : filter.to;
    results = results.filter((s) => s.submittedAt <= to);
  }
  if (filter.paid === true) results = results.filter((s) => !!s.payment);
  if (filter.paid === false) results = results.filter((s) => !s.payment);
  return results;
}

export async function listSubmissions(filter?: SubmissionFilter): Promise<Submission[]> {
  const items = await readCollection<Submission>(COLLECTION);
  return filterSubmissions(items, filter);
}

/** All submissions, unsorted - for stats. */
export async function listAllSubmissionsRaw(): Promise<Submission[]> {
  return readCollection<Submission>(COLLECTION);
}

/** Submissions published within the given month (defaults to the current month). */
export async function listPublicationsForMonth(reference: Date = new Date()): Promise<Submission[]> {
  const items = await readCollection<Submission>(COLLECTION);
  return items
    .filter((s) => {
      if (!isPubliclyVisible(s) || !s.publishedAt) return false;
      const d = new Date(s.publishedAt);
      return d.getUTCFullYear() === reference.getUTCFullYear() && d.getUTCMonth() === reference.getUTCMonth();
    })
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}

/** Paginated, newest-published-first listing for the public "All Publications" page. */
export async function listPublishedPapersPage(options?: {
  offset?: number;
  limit?: number;
  query?: string;
}): Promise<{ items: Submission[]; total: number }> {
  const items = await readCollection<Submission>(COLLECTION);
  let published = items
    .filter((s) => isPubliclyVisible(s))
    .sort((a, b) => (b.publishedAt ?? b.submittedAt).localeCompare(a.publishedAt ?? a.submittedAt));

  if (options?.query?.trim()) {
    published = published.filter((s) => matchesFullText(s, options.query!));
  }

  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? 10;
  return { items: published.slice(offset, offset + limit), total: published.length };
}

/** True if a Razorpay order has already been attached to a submission - blocks replaying a paid order. */
export async function isPaymentOrderUsed(orderId: string): Promise<boolean> {
  const items = await readCollection<Submission>(COLLECTION);
  return items.some((s) => s.payment?.orderId === orderId);
}

/** Published + public papers, newest first (for issue pages, credentials, etc). */
export async function listPublicPapers(filter?: { issueId?: string }): Promise<Submission[]> {
  const items = await readCollection<Submission>(COLLECTION);
  return items
    .filter((s) => isPubliclyVisible(s) && (!filter?.issueId || s.issueId === filter.issueId))
    .sort((a, b) => (b.publishedAt ?? b.submittedAt).localeCompare(a.publishedAt ?? a.submittedAt));
}

export async function getSubmission(id: string): Promise<Submission | null> {
  const items = await readCollection<Submission>(COLLECTION);
  return items.find((s) => s.id === id) ?? null;
}

export type NewSubmissionInput = Omit<
  Submission,
  "id" | "status" | "submittedAt" | "updatedAt" | "decidedAt" | "decidedById" | "reviewComment"
>;

export async function createSubmission(
  input: NewSubmissionInput & { id?: string; status?: SubmissionStatus }
): Promise<Submission> {
  const now = new Date().toISOString();
  const record: Submission = {
    ...input,
    id: input.id ?? randomUUID(),
    status: input.status ?? "PENDING",
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
  articleNumber?: string;
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
        articleNumber: input.articleNumber ?? item.articleNumber,
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

/**
 * Generic patch used by the admin full-edit screen and other targeted updates
 * (visibility, certificatesSentAt, ...). `patch` may also be a function of the
 * live record, evaluated inside the ETag retry loop.
 */
export async function updateSubmission(
  id: string,
  patch: Partial<Omit<Submission, "id" | "submittedAt">> | ((current: Submission) => Partial<Submission>)
): Promise<Submission> {
  let updated: Submission | undefined;
  await updateCollection<Submission>(COLLECTION, (items) => {
    updated = undefined;
    return items.map((item) => {
      if (item.id !== id) return item;
      const p = typeof patch === "function" ? patch(item) : patch;
      updated = { ...item, ...p, id: item.id, submittedAt: item.submittedAt, updatedAt: new Date().toISOString() };
      return updated;
    });
  });
  if (!updated) throw new Error(`Submission not found: ${id}`);
  return updated;
}

export async function setSubmissionVisibility(id: string, isPublic: boolean): Promise<Submission> {
  return updateSubmission(id, { isPublic });
}

export async function markCertificatesSent(id: string): Promise<Submission> {
  return updateSubmission(id, { certificatesSentAt: new Date().toISOString() });
}

/** Adds reviewers (skipping ones already assigned). Returns the submission and the newly-added reviewer ids. */
export async function assignReviewers(
  id: string,
  reviewerIds: string[]
): Promise<{ submission: Submission; added: string[] }> {
  let added: string[] = [];
  const submission = await updateSubmission(id, (current) => {
    const existing = current.reviewAssignments ?? [];
    const now = new Date().toISOString();
    added = reviewerIds.filter((rid) => !existing.some((a) => a.reviewerId === rid));
    const next: ReviewAssignment[] = [
      ...existing,
      ...added.map((reviewerId) => ({ reviewerId, assignedAt: now, status: "ASSIGNED" as const })),
    ];
    return {
      reviewAssignments: next,
      status: current.status === "PENDING" ? "UNDER_REVIEW" : current.status,
    };
  });
  return { submission, added };
}

export async function updateReviewAssignment(
  id: string,
  reviewerId: string,
  patch: Partial<Omit<ReviewAssignment, "reviewerId" | "assignedAt">>
): Promise<Submission> {
  return updateSubmission(id, (current) => ({
    reviewAssignments: (current.reviewAssignments ?? []).map((a) =>
      a.reviewerId !== reviewerId
        ? a
        : {
            ...a,
            ...patch,
            completedAt:
              patch.status === "COMPLETED" ? a.completedAt ?? new Date().toISOString() : patch.status ? undefined : a.completedAt,
          }
    ),
  }));
}

export async function removeReviewAssignment(id: string, reviewerId: string): Promise<Submission> {
  return updateSubmission(id, (current) => ({
    reviewAssignments: (current.reviewAssignments ?? []).filter((a) => a.reviewerId !== reviewerId),
  }));
}

/** reviewerId -> number of COMPLETED reviews */
export async function countCompletedReviews(): Promise<Record<string, number>> {
  const items = await readCollection<Submission>(COLLECTION);
  const counts: Record<string, number> = {};
  for (const s of items)
    for (const a of s.reviewAssignments ?? [])
      if (a.status === "COMPLETED") counts[a.reviewerId] = (counts[a.reviewerId] ?? 0) + 1;
  return counts;
}

/** Next sequential article number, e.g. "e009". */
export async function nextArticleNumber(): Promise<string> {
  const items = await readCollection<Submission>(COLLECTION);
  const max = items.reduce((m, s) => {
    const n = s.articleNumber ? parseInt(s.articleNumber.replace(/\D/g, ""), 10) : 0;
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `e${String(max + 1).padStart(3, "0")}`;
}
