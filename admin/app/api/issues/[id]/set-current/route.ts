import { NextRequest, NextResponse } from "next/server";
import { setCurrentIssue } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await setCurrentIssue(params.id);
  return NextResponse.json({ ok: true });
}
