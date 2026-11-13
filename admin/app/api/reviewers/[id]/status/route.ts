import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getReviewer, setReviewerStatus } from "@ijaac/data-store";
import { sendReviewerApprovedEmail, sendReviewerRejectedEmail } from "@ijaac/email";
import { requireSession } from "@/lib/requireSession";

const bodySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  note: z.string().trim().max(2000).optional(),
  /** Send the approval / rejection email (default true) */
  notify: z.boolean().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await getReviewer(params.id);
  if (!existing) return NextResponse.json({ error: "Reviewer not found" }, { status: 404 });

  const { status, note, notify = true } = parsed.data;
  const reviewer = await setReviewerStatus(params.id, status);

  let emailSent = false;
  let emailError: string | undefined;
  if (notify && status !== "PENDING" && (existing.status ?? "APPROVED") !== status) {
    try {
      if (!reviewer.email) throw new Error("Reviewer has no email address");
      if (status === "APPROVED") await sendReviewerApprovedEmail(reviewer);
      else await sendReviewerRejectedEmail(reviewer, note || undefined);
      emailSent = true;
    } catch (err) {
      console.error(`[reviewers/${params.id}/status] ${status} email failed`, err);
      emailError = err instanceof Error ? err.message : "Email could not be sent";
    }
  }

  return NextResponse.json({ reviewer, emailSent, emailError });
}
