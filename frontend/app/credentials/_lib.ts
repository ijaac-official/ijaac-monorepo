import type { Submission } from "@ijaac/shared";
import { isPubliclyVisible } from "@ijaac/shared";
import { getIssue, getSubmission } from "@ijaac/data-store";
import {
  CREDENTIAL_SITE_URL,
  authorCredentialId,
  parseAuthorCredentialId,
} from "@ijaac/certificate/src/credentials";

export { CREDENTIAL_SITE_URL, authorCredentialId };

export const JOURNAL_NAME = "International Journal of Applied AI & Computing";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export interface PublicAuthor {
  name: string;
  affiliation?: string;
  credentialId: string;
}

/** Public, email-free view of a published paper used by the credential pages. */
export interface PublicationRecord {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  authors: PublicAuthor[];
  volume?: string;
  issueNumber?: string;
  articleNumber?: string;
  /** ISO date */
  publishedAt: string;
  /** "November 2026" */
  monthYear: string;
  issueMonth: number;
  issueYear: number;
  /** "Volume 1, Issue 11 (November 2026)" */
  issueLabel: string;
}

function toRecord(s: Submission, issue: Awaited<ReturnType<typeof getIssue>>): PublicationRecord {
  const published = new Date(s.publishedAt ?? s.decidedAt ?? s.submittedAt);
  const issueYear = issue?.year ?? published.getUTCFullYear();
  const issueMonth = issue?.month ?? published.getUTCMonth() + 1;
  const monthYear = `${MONTHS[issueMonth - 1]} ${issueYear}`;
  const volume = issue?.volume ?? s.volume;
  const issueNumber = issue?.number ?? s.issueNumber;
  const parts = [volume && `Volume ${volume}`, issueNumber && `Issue ${issueNumber}`].filter(Boolean).join(", ");
  return {
    id: s.id,
    title: s.title,
    abstract: s.abstract,
    keywords: s.keywords ?? [],
    authors: s.authors.map((a, i) => ({
      name: a.name,
      affiliation: a.affiliation || undefined,
      credentialId: authorCredentialId(s.id, i),
    })),
    volume,
    issueNumber,
    articleNumber: s.articleNumber,
    publishedAt: published.toISOString(),
    monthYear,
    issueMonth,
    issueYear,
    issueLabel: parts ? `${parts} (${monthYear})` : monthYear,
  };
}

/** Only publicly visible (published + not hidden) papers resolve. */
export async function loadPublicationRecord(id: string): Promise<PublicationRecord | null> {
  if (!id || id.length > 200) return null;
  const submission = await getSubmission(id).catch(() => null);
  if (!submission || !isPubliclyVisible(submission)) return null;
  const issue = submission.issueId ? await getIssue(submission.issueId).catch(() => null) : null;
  return toRecord(submission, issue);
}

export async function loadAuthorCredential(
  credentialId: string
): Promise<{ record: PublicationRecord; author: PublicAuthor; index: number } | null> {
  const parsed = parseAuthorCredentialId(safeDecode(credentialId));
  if (!parsed) return null;
  const record = await loadPublicationRecord(parsed.submissionId);
  if (!record) return null;
  const author = record.authors[parsed.index];
  if (!author) return null;
  return { record, author, index: parsed.index };
}

/** decodeURIComponent that never throws (route params may or may not arrive encoded). */
export function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function authorCredentialPageUrl(credentialId: string): string {
  return `${CREDENTIAL_SITE_URL}/credentials/author/${encodeURIComponent(credentialId)}`;
}

export function publicationCredentialPageUrl(id: string): string {
  return `${CREDENTIAL_SITE_URL}/credentials/publication/${encodeURIComponent(id)}`;
}
