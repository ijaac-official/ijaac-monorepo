import { createHmac, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  ACCEPTED_MANUSCRIPT_MIME_TYPES,
  MAX_MANUSCRIPT_SIZE_BYTES,
  paymentVerificationSchema,
  submissionFormSchema,
} from "@ijaac/shared";
import { S3_PREFIXES, putObjectBuffer } from "@ijaac/aws";
import { createSubmission, getSettings } from "@ijaac/data-store";
import { sendSubmissionEditorNotification, sendSubmissionReceivedEmail } from "@ijaac/email";

export const runtime = "nodejs";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-150);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const payloadRaw = formData.get("payload");
  const paymentRaw = formData.get("payment");
  const couponCodeRaw = formData.get("couponCode");
  const file = formData.get("file");

  if (typeof payloadRaw !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing form fields" }, { status: 400 });
  }

  let payloadJson: unknown;
  try {
    payloadJson = JSON.parse(payloadRaw);
  } catch {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  const parsed = submissionFormSchema.safeParse(payloadJson);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Coupon path: re-validate server-side against the live setting - never
  // trust the client's say-so that a coupon is valid.
  let waivedCouponCode: string | undefined;
  if (typeof couponCodeRaw === "string" && couponCodeRaw.trim()) {
    const settings = await getSettings();
    if (
      settings.earlyBirdEnabled &&
      couponCodeRaw.trim().toUpperCase() === settings.earlyBirdCouponCode.toUpperCase()
    ) {
      waivedCouponCode = settings.earlyBirdCouponCode;
    } else {
      return NextResponse.json({ error: "Invalid or expired coupon code" }, { status: 400 });
    }
  }

  let paymentRecord: { orderId: string; paymentId: string; amountInPaise: number; currency: string; paidAt: string } | undefined;

  if (!waivedCouponCode) {
    if (typeof paymentRaw !== "string") {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }

    let paymentJson: unknown;
    try {
      paymentJson = JSON.parse(paymentRaw);
    } catch {
      return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
    }

    const paymentParsed = paymentVerificationSchema.safeParse(paymentJson);
    if (!paymentParsed.success) {
      return NextResponse.json({ error: "Missing or invalid payment details" }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: "Payment gateway is not configured" }, { status: 500 });
    }

    const expectedSignature = createHmac("sha256", keySecret)
      .update(`${paymentParsed.data.razorpay_order_id}|${paymentParsed.data.razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== paymentParsed.data.razorpay_signature) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 402 });
    }

    paymentRecord = {
      orderId: paymentParsed.data.razorpay_order_id,
      paymentId: paymentParsed.data.razorpay_payment_id,
      amountInPaise: Math.round(Number(process.env.SUBMISSION_FEE_INR ?? "500") * 100),
      currency: "INR",
      paidAt: new Date().toISOString(),
    };
  }

  if (!ACCEPTED_MANUSCRIPT_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only PDF, DOC, or DOCX files are supported" },
      { status: 400 }
    );
  }
  if (file.size > MAX_MANUSCRIPT_SIZE_BYTES) {
    return NextResponse.json({ error: "File exceeds the 20 MB limit" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileKey = `${S3_PREFIXES.manuscripts}${randomUUID()}/${sanitizeFileName(file.name)}`;

  try {
    await putObjectBuffer(fileKey, buffer, file.type);
  } catch (err) {
    console.error("S3 upload failed", err);
    return NextResponse.json({ error: "File upload failed, please try again" }, { status: 502 });
  }

  const submission = await createSubmission({
    ...parsed.data,
    fileKey,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    payment: paymentRecord,
    couponCode: waivedCouponCode,
  });

  // Best-effort notifications - a mail failure should not fail the submission,
  // since the manuscript is already safely stored and recorded.
  await Promise.allSettled([
    sendSubmissionReceivedEmail(submission),
    sendSubmissionEditorNotification(submission),
  ]).then((results) => {
    results.forEach((r) => {
      if (r.status === "rejected") console.error("Submission email failed", r.reason);
    });
  });

  return NextResponse.json({ id: submission.id }, { status: 201 });
}
