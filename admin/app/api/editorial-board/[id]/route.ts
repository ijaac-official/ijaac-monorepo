import { NextRequest, NextResponse } from "next/server";
import { editorialBoardInputSchema } from "@ijaac/shared";
import { deleteEditorialBoardMember, updateEditorialBoardMember } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = editorialBoardInputSchema.partial().safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const member = await updateEditorialBoardMember(params.id, parsed.data);
  return NextResponse.json(member);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await deleteEditorialBoardMember(params.id);
  return NextResponse.json({ ok: true });
}
