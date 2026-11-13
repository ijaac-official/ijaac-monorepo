// ---------------------------------------------------------------------------
// Deterministic credential identifiers. No storage needed: a credential is
// fully described by its submission and (for authors) the author position.
//
//   publication credential id = <submissionId>
//   author credential id      = <submissionId>-<authorIndex + 1>   e.g. "abc123-1"
//
// Pure functions only (no fs / pdf-lib) so client and server code can share them.
// ---------------------------------------------------------------------------

/** Canonical public site. Printed on certificates, so it never depends on env. */
export const CREDENTIAL_SITE_URL = "https://www.ijaac.in";

export function authorCredentialId(submissionId: string, index: number): string {
  return `${submissionId}-${index + 1}`;
}

/** Inverse of `authorCredentialId`. Returns null for malformed ids. */
export function parseAuthorCredentialId(id: string): { submissionId: string; index: number } | null {
  const match = /^(.+)-(\d{1,3})$/.exec(id.trim());
  if (!match) return null;
  const position = parseInt(match[2], 10);
  if (!Number.isFinite(position) || position < 1) return null;
  return { submissionId: match[1], index: position - 1 };
}

export function publicationCredentialId(submissionId: string): string {
  return submissionId;
}

export function authorCredentialUrl(submissionId: string, index: number, base = CREDENTIAL_SITE_URL): string {
  return `${base.replace(/\/$/, "")}/credentials/author/${encodeURIComponent(authorCredentialId(submissionId, index))}`;
}

export function publicationCredentialUrl(submissionId: string, base = CREDENTIAL_SITE_URL): string {
  return `${base.replace(/\/$/, "")}/credentials/publication/${encodeURIComponent(submissionId)}`;
}
