import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { decisionSchema, type Issue, type Submission } from "@ijaac/shared";
import { decideSubmission, getIssue, getSubmission, nextArticleNumber, updateSubmission } from "@ijaac/data-store";
import { sendSubmissionDecisionEmail } from "@ijaac/email";
import { getObjectBuffer, putObjectBuffer, S3_PREFIXES } from "@ijaac/aws";
import { inspectPdf, tryTypesetPdf } from "@ijaac/certificate";
import { loadLogoPng, sendCertificatesAndPaper, type SendResult } from "../certificates/_lib";

export const runtime = "nodejs";
export const maxDuration = 60;

interface TypesettingReport {
  /** "typeset" = journal template applied; "original" = original file is what gets published */
  result: "typeset" | "original";
  reason?: string;
  pageCount?: number;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await getSubmission(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = decisionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // The PDF is served through our own /article/view/[id] proxy route (see
  // frontend), which reads straight from the private bucket - no need to
  // copy anything to a public prefix on publish.
  let publishedFileKey: string | undefined;
  let articleNumber: string | undefined;
  let volume: string | undefined;
  let issueNumber: string | undefined;
  let issue: Issue | null = null;
  let typesetting: TypesettingReport | undefined;

  if (parsed.data.status === "PUBLISHED") {
    // Highest existing number + 1 (never reuses a number freed by unpublishing).
    articleNumber = existing.articleNumber ?? (await nextArticleNumber());

    const issueId = parsed.data.issueId ?? existing.issueId;
    if (issueId) {
      issue = await getIssue(issueId);
      volume = issue?.volume ?? existing.volume;
      issueNumber = issue?.number ?? existing.issueNumber;
    }

    const outcome = await buildTypesetPublishedPdf(
      { ...existing, volume: volume ?? existing.volume, issueNumber: issueNumber ?? existing.issueNumber },
      articleNumber,
      issue
    ).catch((err): { key?: string; report: TypesettingReport } => {
      console.error("Typesetting failed, publishing the original file", err);
      return { report: { result: "original", reason: (err as Error)?.message ?? "Typesetting failed" } };
    });
    publishedFileKey = outcome.key;
    typesetting = outcome.report;
    if (typesetting.result === "original") {
      console.warn(`Submission ${existing.id}: publishing original file unchanged - ${typesetting.reason}`);
    }
  }

  const adminId = (session.user as { id?: string }).id;
  let updated = await decideSubmission(params.id, {
    status: parsed.data.status,
    reviewComment: parsed.data.reviewComment,
    decidedById: adminId,
    issueId: parsed.data.issueId,
    volume,
    issueNumber,
    publishedFileKey,
    articleNumber,
  });

  // A stale typeset file from an earlier publish must not outlive a failed
  // re-typeset: drop the key so readers get the original file instead.
  if (typesetting?.result === "original" && updated.publishedFileKey) {
    updated = await updateSubmission(params.id, { publishedFileKey: undefined });
  }

  if (parsed.data.status === "APPROVED" || parsed.data.status === "REJECTED") {
    await sendSubmissionDecisionEmail(updated, parsed.data.status).catch((err) => {
      console.error("Decision email failed", err);
    });
  }

  // Certificate + paper to every author: always on approval; on publication
  // only if they were never sent (e.g. papers approved before this feature or
  // entered by an editor). Resends are manual via /certificates/send.
  let certificates: SendResult | undefined;
  const shouldSendCertificates =
    parsed.data.status === "APPROVED" || (parsed.data.status === "PUBLISHED" && !updated.certificatesSentAt);
  if (shouldSendCertificates && updated.authors.some((a) => a.email?.trim())) {
    certificates = await sendCertificatesAndPaper(updated, issue).catch((err): SendResult => {
      console.error("Certificate generation/email failed", err);
      return { sent: 0, failed: updated.authors.length, skipped: 0, errors: [{ author: "*", error: String(err) }] };
    });
    if (certificates.certificatesSentAt) updated = { ...updated, certificatesSentAt: certificates.certificatesSentAt };
  }

  return NextResponse.json({ ...updated, typesetting, certificates });
}

async function buildTypesetPublishedPdf(
  submission: Submission,
  articleNumber: string,
  issue: Issue | null
): Promise<{ key?: string; report: TypesettingReport }> {
  const original = await getObjectBuffer(submission.fileKey);
  if (!original || original.length === 0) {
    return { report: { result: "original", reason: "Original manuscript not found in storage" } };
  }

  const publishedAt = submission.publishedAt ? new Date(submission.publishedAt) : new Date();
  const result = await tryTypesetPdf(new Uint8Array(original), {
    title: submission.title,
    authors: submission.authors.map((a) => ({
      name: a.name,
      affiliation: a.affiliation,
      email: a.email,
      isCorresponding: a.isCorresponding,
    })),
    abstract: submission.abstract,
    keywords: submission.keywords,
    volume: submission.volume,
    issueNumber: submission.issueNumber,
    year: issue?.year ?? publishedAt.getUTCFullYear(),
    month: issue?.month ?? (issue ? undefined : publishedAt.getUTCMonth() + 1),
    articleNumber,
    receivedDate: new Date(submission.submittedAt),
    acceptedDate: submission.decidedAt ? new Date(submission.decidedAt) : undefined,
    publishedDate: publishedAt,
    logoPng: await loadLogoPng(),
  });

  if (!result.ok) {
    return { report: { result: "original", reason: `${result.code}: ${result.reason}` } };
  }

  // Belt and braces: never write an empty/invalid PDF to S3.
  const check = await inspectPdf(result.pdf);
  if (!check.ok) {
    return { report: { result: "original", reason: `Typeset output invalid: ${check.reason}` } };
  }

  const key = `${S3_PREFIXES.published}${submission.id}/typeset.pdf`;
  await putObjectBuffer(key, Buffer.from(result.pdf), "application/pdf");
  return { key, report: { result: "typeset", pageCount: check.pageCount } };
}
