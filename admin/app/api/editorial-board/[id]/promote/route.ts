import { NextRequest, NextResponse } from "next/server";
import { getEditorialBoardMember, promoteBoardMemberToReviewer } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

/** Promote an editorial board member to an approved reviewer (idempotent). */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await getEditorialBoardMember(params.id);
  if (!member) return NextResponse.json({ error: "Board member not found" }, { status: 404 });

  const { reviewer, created } = await promoteBoardMemberToReviewer(member);
  return NextResponse.json({ reviewerId: reviewer.id, created });
}
