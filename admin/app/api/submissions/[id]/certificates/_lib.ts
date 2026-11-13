import { readFile } from "fs/promises";
import path from "path";
import type { Issue, Submission } from "@ijaac/shared";
import { getIssue, markCertificatesSent } from "@ijaac/data-store";
import { getObjectBuffer } from "@ijaac/aws";
import { sendCertificateEmail } from "@ijaac/email";
import {
  authorCredentialId,
  authorCredentialUrl,
  generateCertificatePdf,
  hasPdfHeader,
  inspectPdf,
  isPng,
} from "@ijaac/certificate";

// Shared by the decision route (automatic send on approval) and
// POST /api/submissions/[id]/certificates/send (manual one-click resend).

const assetCache = new Map<string, Uint8Array | null>();

/**
 * Loads a PNG asset used in generated PDFs (logo, certificate stamp,
 * certificate background). Reads admin/public/<file> from disk (works locally
 * and when the file is traced into the server bundle), then the package's
 * assets folder; on Vercel public/ is usually CDN-only, so fall back to
 * fetching it from the public sites. Never throws - PDFs render fine without
 * any of these (the certificate draws vector fallbacks for stamp/background).
 * Results, including misses, are cached per server instance.
 */
export async function loadPublicPng(file: string): Promise<Uint8Array | undefined> {
  if (assetCache.has(file)) return assetCache.get(file) ?? undefined;
  const cwd = process.cwd();
  for (const candidate of [
    path.join(cwd, "public", file),
    path.join(cwd, "admin", "public", file),
    path.join(cwd, "..", "packages", "certificate", "assets", file),
    path.join(cwd, "packages", "certificate", "assets", file),
  ]) {
    try {
      const bytes = new Uint8Array(await readFile(candidate));
      if (isPng(bytes)) {
        assetCache.set(file, bytes);
        return bytes;
      }
    } catch {
      // next candidate
    }
  }
  const bases = [process.env.ADMIN_URL, process.env.FRONTEND_URL, "https://www.ijaac.in"].filter(Boolean) as string[];
  for (const base of bases) {
    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/${file}`, {
        signal: AbortSignal.timeout(4000),
        cache: "no-store",
      });
      if (!res.ok) continue;
      const bytes = new Uint8Array(await res.arrayBuffer());
      if (isPng(bytes)) {
        assetCache.set(file, bytes);
        return bytes;
      }
    } catch {
      // next base
    }
  }
  assetCache.set(file, null);
  return undefined;
}

/** Logo for certificates and the typeset masthead (public/logo.png). */
export function loadLogoPng(): Promise<Uint8Array | undefined> {
  return loadPublicPng("logo.png");
}

export interface CertificateAssets {
  logoPng?: Uint8Array;
  /** public/stamp.png - optional Editor-in-Chief seal (vector seal otherwise). */
  stampPng?: Uint8Array;
  /** public/certificate-bg.png - optional background art (vector motif otherwise). */
  backgroundPng?: Uint8Array;
  /** CERTIFICATE_EDITOR_NAME env var - printed above the signature line when set. */
  editorInChiefName?: string;
}

/** Everything the certificate template can take from the environment, loaded in parallel. */
export async function loadCertificateAssets(): Promise<CertificateAssets> {
  const [logoPng, stampPng, backgroundPng] = await Promise.all([
    loadLogoPng(),
    loadPublicPng("stamp.png"),
    loadPublicPng("certificate-bg.png"),
  ]);
  const editorInChiefName = process.env.CERTIFICATE_EDITOR_NAME?.trim() || undefined;
  return { logoPng, stampPng, backgroundPng, editorInChiefName };
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export interface IssueInfo {
  volume?: string;
  issueNumber?: string;
  month?: number;
  year?: number;
  /** "Volume 1, Issue 11 (November 2026)" */
  label?: string;
}

export async function resolveIssueInfo(submission: Submission, issue?: Issue | null): Promise<IssueInfo> {
  const resolved = issue ?? (submission.issueId ? await getIssue(submission.issueId).catch(() => null) : null);
  const volume = resolved?.volume ?? submission.volume;
  const issueNumber = resolved?.number ?? submission.issueNumber;
  const ref = new Date(submission.publishedAt ?? submission.decidedAt ?? Date.now());
  const year = resolved?.year ?? ref.getUTCFullYear();
  const month = resolved?.month ?? (resolved ? undefined : ref.getUTCMonth() + 1);
  const when = month ? `${MONTHS[month - 1]} ${year}` : String(year);
  const parts = [volume && `Volume ${volume}`, issueNumber && `Issue ${issueNumber}`].filter(Boolean).join(", ");
  return { volume, issueNumber, month, year, label: parts ? `${parts} (${when})` : undefined };
}

export interface PaperAttachment {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  kind: "published" | "manuscript";
}

const safeName = (name: string) => name.replace(/[^\w.\- ]+/g, "_").trim() || "paper";

/** Typeset published PDF when present and valid, else the original manuscript as uploaded. */
export async function loadPaperAttachment(submission: Submission): Promise<PaperAttachment | null> {
  if (submission.publishedFileKey) {
    const typeset = await getObjectBuffer(submission.publishedFileKey).catch(() => null);
    if (typeset && (await inspectPdf(typeset)).ok) {
      return {
        buffer: typeset,
        fileName: `IJAAC-${safeName(submission.articleNumber ?? submission.id)}.pdf`,
        contentType: "application/pdf",
        kind: "published",
      };
    }
    console.error("Typeset PDF missing or invalid, attaching the original manuscript", submission.id);
  }
  const original = await getObjectBuffer(submission.fileKey).catch(() => null);
  if (!original || original.length === 0) return null;
  const isPdf = hasPdfHeader(original);
  return {
    buffer: original,
    fileName: submission.fileName || `${submission.id}${isPdf ? ".pdf" : ""}`,
    contentType: isPdf ? "application/pdf" : submission.fileType || "application/octet-stream",
    kind: "manuscript",
  };
}

export interface SendResult {
  sent: number;
  failed: number;
  /** Authors with no email address on record */
  skipped: number;
  errors: { author: string; error: string }[];
  certificatesSentAt?: string;
}

/**
 * Emails every author their own certificate plus the paper. Marks the
 * submission as `certificatesSentAt` only when every author with an email
 * received it.
 */
export async function sendCertificatesAndPaper(submission: Submission, issue?: Issue | null): Promise<SendResult> {
  const paper = await loadPaperAttachment(submission);
  if (!paper) {
    const total = submission.authors.length;
    return { sent: 0, failed: total, skipped: 0, errors: [{ author: "*", error: "Paper file not found in storage" }] };
  }

  const info = await resolveIssueInfo(submission, issue);
  const assets = await loadCertificateAssets();
  const issuedDate = new Date(submission.publishedAt ?? submission.decidedAt ?? Date.now());
  const credentialLive = submission.status === "PUBLISHED" && submission.isPublic !== false;

  const result: SendResult = { sent: 0, failed: 0, skipped: 0, errors: [] };

  // Sequential on purpose: SMTP providers rate-limit bursts and one big
  // attachment per author is enough load.
  for (const [index, author] of submission.authors.entries()) {
    if (!author.email?.trim()) {
      result.skipped++;
      continue;
    }
    try {
      const credentialId = authorCredentialId(submission.id, index);
      const certificatePdf = await generateCertificatePdf({
        certificateId: credentialId,
        authorName: author.name,
        affiliation: author.affiliation,
        paperTitle: submission.title,
        volume: info.volume,
        issueNumber: info.issueNumber,
        month: info.month,
        year: info.year,
        articleNumber: submission.articleNumber,
        issuedDate,
        verifyUrl: authorCredentialUrl(submission.id, index),
        ...assets,
      });
      if (!(await inspectPdf(certificatePdf)).ok) throw new Error("Generated certificate failed validation");

      await sendCertificateEmail(submission.title, {
        authorEmail: author.email.trim(),
        authorName: author.name,
        certificatePdf,
        certificateFileName: `IJAAC-certificate-${credentialId}.pdf`,
        manuscript: { buffer: paper.buffer, fileName: paper.fileName, contentType: paper.contentType },
        credentialUrl: authorCredentialUrl(submission.id, index),
        credentialLive,
        paperKind: paper.kind,
        issueLabel: info.label,
      });
      result.sent++;
    } catch (err) {
      result.failed++;
      result.errors.push({ author: author.name, error: (err as Error)?.message ?? String(err) });
      console.error("Certificate email failed for an author", submission.id, index, err);
    }
  }

  if (result.failed === 0 && result.sent > 0) {
    const updated = await markCertificatesSent(submission.id);
    result.certificatesSentAt = updated.certificatesSentAt;
  }
  return result;
}
