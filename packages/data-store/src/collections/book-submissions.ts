import { randomUUID } from "node:crypto";
import type { BookSubmission, BookSubmissionStatus, Submission } from "@ijaac/shared";
import { readCollection, updateCollection } from "../json-store";

const COLLECTION = "book-submissions";

export interface BookSubmissionFilter {
  status?: BookSubmissionStatus;
  /** Case-insensitive; every whitespace-separated term must match somewhere. */
  query?: string;
}

function matches(b: BookSubmission, query: string): boolean {
  const haystack = [
    b.id,
    b.title,
    b.subtitle ?? "",
    b.authorName,
    ...(b.coAuthors ?? []),
    b.email,
    b.phone,
    b.affiliation ?? "",
    b.category ?? "",
    b.couponCode ?? "",
    b.payment?.receiptNumber ?? "",
    b.payment?.paymentId ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .every((term) => haystack.includes(term));
}

export async function listBookSubmissions(filter?: BookSubmissionFilter): Promise<BookSubmission[]> {
  const items = await readCollection<BookSubmission>(COLLECTION);
  let results = [...items].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  if (filter?.status) results = results.filter((b) => b.status === filter.status);
  if (filter?.query?.trim()) results = results.filter((b) => matches(b, filter.query!));
  return results;
}

export async function getBookSubmission(id: string): Promise<BookSubmission | null> {
  const items = await readCollection<BookSubmission>(COLLECTION);
  return items.find((b) => b.id === id) ?? null;
}

/**
 * True if a Razorpay order is already attached to ANY paper or book submission,
 * so one paid order can never be replayed across the two flows.
 */
export async function isPaymentOrderUsedAnywhere(orderId: string): Promise<boolean> {
  const [papers, books] = await Promise.all([
    readCollection<Submission>("submissions"),
    readCollection<BookSubmission>(COLLECTION),
  ]);
  return (
    papers.some((s) => s.payment?.orderId === orderId) || books.some((b) => b.payment?.orderId === orderId)
  );
}

export class DuplicatePaymentOrderError extends Error {
  constructor(orderId: string) {
    super(`Payment order already used: ${orderId}`);
    this.name = "DuplicatePaymentOrderError";
  }
}

export type NewBookSubmissionInput = Omit<
  BookSubmission,
  "id" | "status" | "submittedAt" | "updatedAt" | "reviewComment" | "publishedBookId" | "decidedAt" | "decidedById"
>;

export async function createBookSubmission(
  input: NewBookSubmissionInput & { id?: string }
): Promise<BookSubmission> {
  const now = new Date().toISOString();
  const record: BookSubmission = {
    ...input,
    id: input.id ?? randomUUID(),
    status: "PENDING",
    submittedAt: now,
    updatedAt: now,
  };
  await updateCollection<BookSubmission>(COLLECTION, (items) => {
    // Re-checked against live data inside the ETag retry loop.
    const orderId = record.payment?.orderId;
    if (orderId && items.some((b) => b.payment?.orderId === orderId)) {
      throw new DuplicatePaymentOrderError(orderId);
    }
    return [...items, record];
  });
  return record;
}

export async function updateBookSubmission(
  id: string,
  patch:
    | Partial<Omit<BookSubmission, "id" | "submittedAt">>
    | ((current: BookSubmission) => Partial<BookSubmission>)
): Promise<BookSubmission> {
  let updated: BookSubmission | undefined;
  await updateCollection<BookSubmission>(COLLECTION, (items) => {
    updated = undefined;
    return items.map((item) => {
      if (item.id !== id) return item;
      const p = typeof patch === "function" ? patch(item) : patch;
      updated = { ...item, ...p, id: item.id, submittedAt: item.submittedAt, updatedAt: new Date().toISOString() };
      return updated;
    });
  });
  if (!updated) throw new Error(`Book submission not found: ${id}`);
  return updated;
}
