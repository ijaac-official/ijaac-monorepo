import { NextRequest, NextResponse } from "next/server";
import { editorialBoardInputSchema } from "@ijaac/shared";
import { createEditorialBoardMember, listEditorialBoard } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await listEditorialBoard());
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = editorialBoardInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const member = await createEditorialBoardMember(parsed.data);
  return NextResponse.json(member, { status: 201 });
}
