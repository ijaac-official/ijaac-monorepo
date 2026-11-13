import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSubmission, removeReviewAssignment, updateReviewAssignment } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

const patchSchema = z.object({
  status: z.enum(["ASSIGNED", "COMPLETED", "DECLINED"]).optional(),
  recommendation: z.string().trim().max(2000).optional(),
});

type Params = { params: { id: string; reviewerId: string } };

async function loadAssignment(id: string, reviewerId: string) {
  const submission = await getSubmission(id);
  if (!submission) return { error: NextResponse.json({ error: "Submission not found" }, { status: 404 }) };
  if (!(submission.reviewAssignments ?? []).some((a) => a.reviewerId === reviewerId)) {
    return { error: NextResponse.json({ error: "Reviewer is not assigned to this paper" }, { status: 404 }) };
  }
  return { submission };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { error } = await loadAssignment(params.id, params.reviewerId);
  if (error) return error;

  const patch = {
    ...(parsed.data.status ? { status: parsed.data.status } : {}),
    ...(parsed.data.recommendation !== undefined
      ? { recommendation: parsed.data.recommendation || undefined }
      : {}),
  };
  const submission = await updateReviewAssignment(params.id, params.reviewerId, patch);
  return NextResponse.json({ assignments: submission.reviewAssignments ?? [] });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await loadAssignment(params.id, params.reviewerId);
  if (error) return error;

  const submission = await removeReviewAssignment(params.id, params.reviewerId);
  return NextResponse.json({ assignments: submission.reviewAssignments ?? [] });
}
