import { NextRequest, NextResponse } from "next/server";
import { otpRequestSchema } from "@ijaac/shared";
import { issueLoginOtp } from "@ijaac/data-store";
import { sendLoginOtpEmail } from "@ijaac/email";
import { generateOtp, hashOtp, OTP_RESEND_COOLDOWN_SECONDS, OTP_TTL_MINUTES } from "@/lib/otp";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = otpRequestSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });

  const code = generateOtp();
  const issued = await issueLoginOtp(
    parsed.data.email,
    (userId) => hashOtp(userId, code),
    OTP_TTL_MINUTES * 60_000,
    OTP_RESEND_COOLDOWN_SECONDS * 1000
  );

  if (issued.ok) {
    try {
      await sendLoginOtpEmail(issued.user.email, code, OTP_TTL_MINUTES);
    } catch (err) {
      console.error("Login code email failed", err);
      return NextResponse.json({ error: "Could not send the code, please try again shortly" }, { status: 502 });
    }
  }

  // Same response whether or not the email is an admin, so this can't be
  // used to discover which addresses have access.
  return NextResponse.json({ ok: true, resendAfterSeconds: OTP_RESEND_COOLDOWN_SECONDS });
}
