import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSubmission, setSubmissionVisibility } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

export const runtime = "nodejs";

const visibilitySchema = z.object({ isPublic: z.boolean() });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = visibilitySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const existing = await getSubmission(params.id);
  if (!existing) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  const updated = await setSubmissionVisibility(params.id, parsed.data.isPublic);
  return NextResponse.json({ id: updated.id, isPublic: updated.isPublic !== false });
}
