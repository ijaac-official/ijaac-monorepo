import { createHmac, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  ACCEPTED_MANUSCRIPT_MIME_TYPES,
  MAX_MANUSCRIPT_SIZE_BYTES,
  formatInr,
  paymentVerificationSchema,
  submissionFormSchema,
  type Submission,
} from "@ijaac/shared";
import { S3_PREFIXES, putObjectBuffer } from "@ijaac/aws";
import {
  createSubmission,
  isPaymentOrderUsed,
  recordPaidRedemption,
  redeemCoupon,
} from "@ijaac/data-store";
import {
  sendPaymentReceiptEmail,
  sendSubmissionEditorNotification,
  sendSubmissionReceivedEmail,
} from "@ijaac/email";
import { generateReceiptPdf } from "@ijaac/certificate";
import { baseFeePaise, getRazorpay, quote } from "@/lib/pricing";

export const runtime = "nodejs";

type PaymentRecord = NonNullable<Submission["payment"]>;

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-150);
}

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  if (!formData) return fail("Invalid form data");

  const payloadRaw = formData.get("payload");
  const paymentRaw = formData.get("payment");
  const couponCodeRaw = formData.get("couponCode");
  const file = formData.get("file");

  if (typeof payloadRaw !== "string" || !(file instanceof File)) return fail("Missing form fields");

  let payloadJson: unknown;
  try {
    payloadJson = JSON.parse(payloadRaw);
  } catch {
    return fail("Malformed payload");
  }

  const parsed = submissionFormSchema.safeParse(payloadJson);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!ACCEPTED_MANUSCRIPT_MIME_TYPES.includes(file.type)) {
    return fail("Only PDF, DOC, or DOCX files are supported");
  }
  if (file.size > MAX_MANUSCRIPT_SIZE_BYTES) return fail("File exceeds the 20 MB limit");

  let paymentRecord: PaymentRecord | undefined;
  let couponCode: string | undefined;
  let discountPercent: number | undefined;

  if (typeof paymentRaw === "string") {
    // --- Paid path (full price or partial discount) -----------------------
    let paymentJson: unknown;
    try {
      paymentJson = JSON.parse(paymentRaw);
    } catch {
      return fail("Malformed payload");
    }
    const payment = paymentVerificationSchema.safeParse(paymentJson);
    if (!payment.success) return fail("Missing or invalid payment details");

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return fail("Payment gateway is not configured", 500);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payment.data;
    const expectedSignature = createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    if (expectedSignature !== razorpay_signature) return fail("Payment verification failed", 402);

    if (await isPaymentOrderUsed(razorpay_order_id)) {
      return fail("This payment has already been used for a submission", 409);
    }

    // Amount and coupon come from Razorpay's own records of an order our
    // server created, never from the client.
    const razorpay = getRazorpay();
    const [rzpPayment, rzpOrder] = await Promise.all([
      razorpay.payments.fetch(razorpay_payment_id),
      razorpay.orders.fetch(razorpay_order_id),
    ]);
    if (
      rzpPayment.order_id !== razorpay_order_id ||
      !["authorized", "captured"].includes(rzpPayment.status)
    ) {
      return fail("Payment could not be confirmed", 402);
    }

    const notes = (rzpOrder.notes ?? {}) as Record<string, string>;
    couponCode = notes.couponCode || undefined;
    discountPercent = notes.discountPercent ? Number(notes.discountPercent) : undefined;
    if (couponCode) await recordPaidRedemption(couponCode);

    paymentRecord = {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amountInPaise: Number(rzpPayment.amount),
      baseAmountInPaise: baseFeePaise(),
      currency: rzpPayment.currency,
      paidAt: new Date().toISOString(),
    };
  } else if (typeof couponCodeRaw === "string" && couponCodeRaw.trim()) {
    // --- Free path: only a 100% coupon skips checkout -----------------------
    const priced = await quote(couponCodeRaw);
    if (!priced.ok) return fail(priced.error);
    if (priced.finalAmountPaise > 0) return fail("This coupon is a partial discount - payment is required");

    const redemption = await redeemCoupon(couponCodeRaw);
    if (!redemption.ok) return fail(redemption.reason);
    couponCode = redemption.coupon.code;
    discountPercent = redemption.coupon.discountPercent;
  } else {
    return fail("Missing payment details");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileKey = `${S3_PREFIXES.manuscripts}${randomUUID()}/${sanitizeFileName(file.name)}`;

  try {
    await putObjectBuffer(fileKey, buffer, file.type);
  } catch (err) {
    console.error("S3 upload failed", err);
    return fail("File upload failed, please try again", 502);
  }

  const submissionId = randomUUID();
  if (paymentRecord) {
    const datePart = paymentRecord.paidAt.slice(0, 10).replace(/-/g, "");
    paymentRecord.receiptNumber = `IJAAC-RCPT-${datePart}-${submissionId.slice(0, 6).toUpperCase()}`;
  }

  const submission = await createSubmission({
    ...parsed.data,
    id: submissionId,
    fileKey,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    payment: paymentRecord,
    couponCode,
    discountPercent,
  });

  // Best-effort notifications - a mail failure should not fail the submission,
  // since the manuscript is already safely stored and recorded.
  const emails: Promise<unknown>[] = [
    sendSubmissionReceivedEmail(submission),
    sendSubmissionEditorNotification(submission),
  ];
  if (paymentRecord) emails.push(sendReceipt(submission, paymentRecord));

  const results = await Promise.allSettled(emails);
  results.forEach((r) => {
    if (r.status === "rejected") console.error("Submission email failed", r.reason);
  });

  return NextResponse.json({ id: submission.id }, { status: 201 });
}

async function sendReceipt(submission: Submission, payment: PaymentRecord) {
  const corresponding =
    submission.authors.find((a) => a.isCorresponding) ?? submission.authors[0];

  const pdf = await generateReceiptPdf({
    receiptNumber: payment.receiptNumber!,
    paidAt: new Date(payment.paidAt),
    payerName: corresponding?.name ?? submission.correspondingEmail,
    payerEmail: submission.correspondingEmail,
    submissionId: submission.id,
    paperTitle: submission.title,
    baseAmountPaise: payment.baseAmountInPaise ?? payment.amountInPaise,
    discountPercent: submission.discountPercent,
    couponCode: submission.couponCode,
    amountPaidPaise: payment.amountInPaise,
    razorpayPaymentId: payment.paymentId,
    razorpayOrderId: payment.orderId,
  });

  await sendPaymentReceiptEmail({
    to: submission.correspondingEmail,
    paperTitle: submission.title,
    amountLabel: formatInr(payment.amountInPaise),
    receiptNumber: payment.receiptNumber!,
    receiptPdf: pdf,
  });
}
