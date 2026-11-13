import type { Issue, SubmissionStatus } from "@ijaac/shared";

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  PENDING: "Pending",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PUBLISHED: "Published",
};

export const STATUS_COLORS: Record<
  SubmissionStatus,
  "default" | "info" | "success" | "error" | "primary" | "warning"
> = {
  PENDING: "warning",
  UNDER_REVIEW: "info",
  APPROVED: "success",
  REJECTED: "error",
  PUBLISHED: "primary",
};

export function issueLabel(issue: Pick<Issue, "title" | "volume" | "number">): string {
  return issue.title ?? `Vol. ${issue.volume}, Issue ${issue.number}`;
}

/** Reads `{ error }` from a failed JSON response - handles zod `flatten()` objects too. */
export async function readError(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  const err = body?.error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const formErrors: string[] = err.formErrors ?? [];
    const fieldErrors: Record<string, string[]> = err.fieldErrors ?? {};
    const first = formErrors[0] ?? Object.entries(fieldErrors).map(([k, v]) => `${k}: ${v?.[0]}`)[0];
    if (first) return first;
  }
  return fallback;
}

export type FilterValues = {
  q: string;
  author: string;
  issue: string;
  visibility: string; // "" | "public" | "private"
  paid: string; // "" | "paid" | "waived"
  from: string; // YYYY-MM-DD
  to: string;
};

export const FILTER_KEYS: (keyof FilterValues)[] = ["q", "author", "issue", "visibility", "paid", "from", "to"];

