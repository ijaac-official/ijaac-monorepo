import { NextResponse } from "next/server";
import { updateAdminUser } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

export async function POST() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  await updateAdminUser(userId, { twoFactorEnabled: false, totpSecret: undefined });
  return NextResponse.json({ ok: true });
}
