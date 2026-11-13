import type { BookSubmissionStatus } from "@ijaac/shared";

export const BOOK_STATUS_LABELS: Record<BookSubmissionStatus, string> = {
  PENDING: "Pending",
  UNDER_REVIEW: "Under Review",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  PUBLISHED: "Published",
};

export const BOOK_STATUS_COLORS: Record<
  BookSubmissionStatus,
  "default" | "info" | "success" | "error" | "secondary" | "warning"
> = {
  PENDING: "warning",
  UNDER_REVIEW: "info",
  ACCEPTED: "success",
  REJECTED: "error",
  PUBLISHED: "secondary",
};

export function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}
