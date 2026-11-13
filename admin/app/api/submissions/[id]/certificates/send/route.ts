import { NextRequest, NextResponse } from "next/server";
import { getSubmission } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";
import { sendCertificatesAndPaper } from "../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * (Re)sends each author their own certificate plus the paper (typeset
 * published PDF if present, else the original manuscript). Sets
 * certificatesSentAt when every author with an email received it.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const submission = await getSubmission(params.id);
  if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  if (submission.status !== "APPROVED" && submission.status !== "PUBLISHED") {
    return NextResponse.json(
      { error: "Certificates can only be sent for approved or published papers" },
      { status: 409 }
    );
  }
  if (!submission.authors.some((a) => a.email?.trim())) {
    return NextResponse.json({ error: "No author has an email address on record" }, { status: 422 });
  }

  const result = await sendCertificatesAndPaper(submission);
  const status = result.sent === 0 ? 502 : 200;
  return NextResponse.json(result, { status });
}
