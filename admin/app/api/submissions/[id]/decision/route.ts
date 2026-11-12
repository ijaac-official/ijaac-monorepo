import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { decisionSchema } from "@ijaac/shared";
import { decideSubmission, getSubmission } from "@ijaac/data-store";
import { sendCertificateEmail, sendSubmissionDecisionEmail } from "@ijaac/email";
import { copyObject, getObjectBuffer, S3_PREFIXES } from "@ijaac/aws";
import { generateCertificatePdf } from "@ijaac/certificate";

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

  let publicFileKey: string | undefined;
  if (parsed.data.status === "PUBLISHED") {
    const sourceKey = existing.publishedFileKey ?? existing.fileKey;
    const extension = sourceKey.split(".").pop() ?? "pdf";
    publicFileKey = `${S3_PREFIXES.publicPapers}${params.id}.${extension}`;
    await copyObject(sourceKey, publicFileKey).catch((err) => {
      console.error("Failed to copy published file to public prefix", err);
      publicFileKey = undefined;
    });
  }

  const adminId = (session.user as { id?: string }).id;
  const updated = await decideSubmission(params.id, {
    status: parsed.data.status,
    reviewComment: parsed.data.reviewComment,
    decidedById: adminId,
    issueId: parsed.data.issueId,
    publicFileKey,
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
