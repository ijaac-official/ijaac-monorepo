import { NextRequest, NextResponse } from "next/server";
import { submissionUpdateSchema, type Submission } from "@ijaac/shared";
import { getIssue, getSubmission, updateSubmission } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

export const runtime = "nodejs";

/** Optional string fields where an empty string means "clear this field". */
const CLEARABLE = [
  "correspondingPhone",
  "reviewComment",
  "issueId",
  "volume",
  "issueNumber",
  "articleNumber",
  "publishedAt",
] as const;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const submission = await getSubmission(params.id);
  if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  return NextResponse.json(submission);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await getSubmission(params.id);
  if (!existing) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  const json = await req.json().catch(() => null);
  const parsed = submissionUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const patch: Partial<Submission> = { ...parsed.data };
  for (const key of CLEARABLE) {
    if (key in patch && typeof patch[key] === "string") {
      const trimmed = (patch[key] as string).trim();
      (patch as Record<string, unknown>)[key] = trimmed === "" ? undefined : trimmed;
    }
  }

  if (patch.keywords) patch.keywords = patch.keywords.map((k) => k.trim()).filter(Boolean);

  if (patch.publishedAt && Number.isNaN(Date.parse(patch.publishedAt))) {
    return NextResponse.json({ error: "Published date is not a valid date" }, { status: 400 });
  }

  if (patch.issueId && patch.issueId !== existing.issueId) {
    const issue = await getIssue(patch.issueId);
    if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 400 });
    // Fill volume/number from the issue unless the editor set them explicitly.
    if (!("volume" in parsed.data)) patch.volume = issue.volume;
    if (!("issueNumber" in parsed.data)) patch.issueNumber = issue.number;
  }

  // Moving a paper to PUBLISHED by hand still needs a publication date.
  if (patch.status === "PUBLISHED" && !patch.publishedAt && !("publishedAt" in parsed.data) && !existing.publishedAt) {
    patch.publishedAt = new Date().toISOString();
  }

  try {
    const updated = await updateSubmission(params.id, patch);
    return NextResponse.json(updated);
  } catch (err) {
    console.error("Submission update failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Update failed" }, { status: 500 });
  }
}
