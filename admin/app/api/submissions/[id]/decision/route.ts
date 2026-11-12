import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { decisionSchema } from "@ijaac/shared";
import { decideSubmission, getIssue, getSubmission, listPublishedPapersPage } from "@ijaac/data-store";
import { sendCertificateEmail, sendSubmissionDecisionEmail } from "@ijaac/email";
import { getObjectBuffer, putObjectBuffer, S3_PREFIXES } from "@ijaac/aws";
import { buildTypesetPdf, generateCertificatePdf } from "@ijaac/certificate";

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
  if (parsed.data.status === "PUBLISHED") {
    articleNumber = existing.articleNumber ?? (await nextArticleNumber());

    const issueId = parsed.data.issueId ?? existing.issueId;
    if (issueId) {
      const issue = await getIssue(issueId);
      volume = issue?.volume ?? existing.volume;
      issueNumber = issue?.number ?? existing.issueNumber;
    }

    if (existing.fileType === "application/pdf") {
      publishedFileKey = await buildTypesetPublishedPdf(
        { ...existing, volume: volume ?? existing.volume, issueNumber: issueNumber ?? existing.issueNumber },
        articleNumber
      ).catch((err) => {
        console.error("Typesetting failed, falling back to original file", err);
        return undefined;
      });
    }
  }

  const adminId = (session.user as { id?: string }).id;
  const updated = await decideSubmission(params.id, {
    status: parsed.data.status,
    reviewComment: parsed.data.reviewComment,
    decidedById: adminId,
    issueId: parsed.data.issueId,
    volume,
    issueNumber,
    publishedFileKey,
    articleNumber,
  });

  if (parsed.data.status === "APPROVED" || parsed.data.status === "REJECTED") {
    await sendSubmissionDecisionEmail(updated, parsed.data.status).catch((err) => {
      console.error("Decision email failed", err);
    });
  }

  if (parsed.data.status === "APPROVED") {
    await sendCertificatesToAuthors(updated).catch((err) => {
      console.error("Certificate generation/email failed", err);
    });
  }

  return NextResponse.json(updated);
}

async function nextArticleNumber(): Promise<string> {
  const { total } = await listPublishedPapersPage({ limit: 0 });
  return `e${String(total + 1).padStart(3, "0")}`;
}

async function buildTypesetPublishedPdf(
  submission: NonNullable<Awaited<ReturnType<typeof getSubmission>>>,
  articleNumber: string
): Promise<string | undefined> {
  const original = await getObjectBuffer(submission.fileKey);
  if (!original) return undefined;

  const typeset = await buildTypesetPdf(original, {
    title: submission.title,
    authors: submission.authors.map((a) => ({ name: a.name, affiliation: a.affiliation, email: a.email })),
    abstract: submission.abstract,
    keywords: submission.keywords,
    volume: submission.volume,
    issueNumber: submission.issueNumber,
    articleNumber,
    receivedDate: new Date(submission.submittedAt),
    acceptedDate: submission.decidedAt ? new Date(submission.decidedAt) : undefined,
  });

  const key = `${S3_PREFIXES.published}${submission.id}/typeset.pdf`;
  await putObjectBuffer(key, Buffer.from(typeset), "application/pdf");
  return key;
}

async function sendCertificatesToAuthors(submission: Awaited<ReturnType<typeof decideSubmission>>) {
  const manuscript = await getObjectBuffer(submission.fileKey);
  if (!manuscript) {
    console.error("Manuscript file missing from S3, skipping certificate emails", submission.fileKey);
    return;
  }

  const results = await Promise.allSettled(
    submission.authors.map(async (author, index) => {
      const certificatePdf = await generateCertificatePdf({
        certificateId: `IJAAC/CERT/${new Date().getFullYear()}/${submission.id.slice(0, 8)}-${index + 1}`,
        authorName: author.name,
        paperTitle: submission.title,
        volume: submission.volume,
        issueNumber: submission.issueNumber,
      });

      await sendCertificateEmail(submission.title, {
        authorEmail: author.email,
        authorName: author.name,
        certificatePdf,
        manuscript: { buffer: manuscript, fileName: submission.fileName },
      });
    })
  );

  results.forEach((r) => {
    if (r.status === "rejected") console.error("Certificate email failed for an author", r.reason);
  });
}
