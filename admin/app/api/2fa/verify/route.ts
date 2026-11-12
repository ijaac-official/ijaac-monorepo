import { NextRequest, NextResponse } from "next/server";
import { authenticator } from "otplib";
import { totpVerifySchema } from "@ijaac/shared";
import { getAdminUserById, updateAdminUser } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = totpVerifySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the 6-digit code" }, { status: 400 });
  }

  const userId = (session.user as { id: string }).id;
  const user = await getAdminUserById(userId);
  if (!user?.totpSecret) {
    return NextResponse.json({ error: "Start 2FA setup first" }, { status: 400 });
  }

  const valid = authenticator.verify({ token: parsed.data.code, secret: user.totpSecret });
  if (!valid) {
    return NextResponse.json({ error: "Incorrect code" }, { status: 400 });
  }

  await updateAdminUser(userId, { twoFactorEnabled: true });
  return NextResponse.json({ ok: true });
}
