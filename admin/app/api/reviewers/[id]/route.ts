import { NextRequest, NextResponse } from "next/server";
import { reviewerInputSchema } from "@ijaac/shared";
import { deleteReviewer, updateReviewer } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = reviewerInputSchema.partial().safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const reviewer = await updateReviewer(params.id, parsed.data);
  return NextResponse.json(reviewer);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await deleteReviewer(params.id);
  return NextResponse.json({ ok: true });
}
