import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { authenticator } from "otplib";
import { getAdminUserById, updateAdminUser } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const user = await getAdminUserById(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.twoFactorEnabled) {
    return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 });
  }

  const secret = authenticator.generateSecret();
  await updateAdminUser(userId, { totpSecret: secret });

  const otpauthUrl = authenticator.keyuri(user.email, "IJAAC Admin", secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  return NextResponse.json({ secret, qrCodeDataUrl });
}
