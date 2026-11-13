import { NextRequest, NextResponse } from "next/server";
import { bookSubmissionDecisionSchema, type BookSubmissionStatus } from "@ijaac/shared";
import { getBookSubmission, updateBookSubmission } from "@ijaac/data-store";
import { sendBookSubmissionDecisionEmail } from "@ijaac/email";
import { requireSession } from "@/lib/requireSession";

export const runtime = "nodejs";

/** Allowed status transitions. ACCEPTED -> PUBLISHED goes through /publish; REJECTED and PUBLISHED are final. */
const NEXT: Record<BookSubmissionStatus, BookSubmissionStatus[]> = {
  PENDING: ["UNDER_REVIEW", "ACCEPTED", "REJECTED"],
  UNDER_REVIEW: ["ACCEPTED", "REJECTED"],
  ACCEPTED: [],
  REJECTED: [],
  PUBLISHED: [],
};

class TransitionError extends Error {}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const record = await getBookSubmission(params.id);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bookSubmissionDecisionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { status, reviewComment } = parsed.data;
  const notify = parsed.data.notify !== false;
  const adminId = (session.user as { id?: string }).id ?? session.user?.email ?? undefined;

  let updated;
  try {
    updated = await updateBookSubmission(params.id, (current) => {
      if (!NEXT[current.status].includes(status)) {
        throw new TransitionError(`Cannot change a ${current.status.replace("_", " ").toLowerCase()} submission to ${status.replace("_", " ").toLowerCase()}`);
      }
      const now = new Date().toISOString();
      return {
        status,
        reviewComment: reviewComment || current.reviewComment,
        decidedById: adminId,
        decidedAt: now,
      };
    });
  } catch (err) {
    if (err instanceof TransitionError) return NextResponse.json({ error: err.message }, { status: 409 });
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: message.includes("not found") ? 404 : 500 });
  }

  let emailed = false;
  if (notify && (status === "ACCEPTED" || status === "REJECTED")) {
    try {
      await sendBookSubmissionDecisionEmail(updated, status);
      emailed = true;
    } catch (err) {
      console.error("Book decision email failed", err);
    }
  }
  return NextResponse.json({ submission: updated, emailed });
}
