import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  formatInr,
  submissionFormSchema,
  type Submission,
} from "@ijaac/shared";
import { S3_PREFIXES, putObjectBuffer } from "@ijaac/aws";
import { createSubmission, recordPaidRedemption, redeemCoupon } from "@ijaac/data-store";
import {
  sendPaymentReceiptEmail,
  sendSubmissionEditorNotification,
  sendSubmissionReceivedEmail,
} from "@ijaac/email";
import { generateReceiptPdf } from "@ijaac/certificate";
import { quote } from "@/lib/pricing";
import { verifyRazorpayPayment } from "@/lib/payment-verify";
import { displayName, promoteUpload, verifyUpload } from "@/lib/uploads";
import {
  MANUSCRIPT_MIME,
  checkManuscriptBytes,
  checkManuscriptMeta,
  firstIssueMessage,
  kindFromName,
  normalizeSubmissionInput,
} from "@/app/submit-paper/manuscript-checks";

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
  // Preferred path: the browser already PUT the file to S3 via /api/uploads/upload-url.
  const fileKeyRaw = formData.get("fileKey");
  const fileTokenRaw = formData.get("fileToken");
  const fileNameRaw = formData.get("fileName");
  const direct = typeof fileKeyRaw === "string" && fileKeyRaw.length > 0;

  if (typeof payloadRaw !== "string" || (!direct && !(file instanceof File))) return fail("Missing form fields");

  let payloadJson: unknown;
  try {
    payloadJson = JSON.parse(payloadRaw);
  } catch {
    return fail("Malformed payload");
  }

  const parsed = submissionFormSchema.safeParse(normalizeSubmissionInput(payloadJson));
  if (!parsed.success) {
    return NextResponse.json(
      { error: firstIssueMessage(parsed.error), issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // File checks happen BEFORE any coupon is redeemed or payment is consumed:
  // non-empty, allowed extension/MIME, size limit, and magic bytes that match
  // the extension (%PDF, D0 CF 11 E0 for .doc, PK zip for .docx).
  // Direct uploads: the key must be one we issued (HMAC token) under the pending
  // prefix, and the stored object is checked with HeadObject (exists, size) and a
  // ranged GET of its first bytes (magic bytes).
  let buffer: Buffer | null = null;
  let pendingKey: string | null = null;
  let originalName: string;
  let fileSize: number;
  if (direct) {
    let verified;
    try {
      verified = await verifyUpload("paper-manuscript", fileKeyRaw, fileTokenRaw);
    } catch (err) {
      console.error("Upload verification failed", err);
      return fail("Could not verify the uploaded file, please try again", 502);
    }
    if (!verified.ok) return fail(verified.error);
    pendingKey = verified.key;
    originalName = displayName(fileNameRaw, verified.key);
    fileSize = verified.size;
  } else {
    const f = file as File;
    const metaError = checkManuscriptMeta(f);
    if (metaError) return fail(metaError);
    buffer = Buffer.from(await f.arrayBuffer());
    if (buffer.length === 0) return fail("The selected file is empty.");
    const bytesError = checkManuscriptBytes(f.name, new Uint8Array(buffer.subarray(0, 1024)));
    if (bytesError) return fail(bytesError);
    originalName = f.name;
    fileSize = buffer.length;
  }
  const fileKind = kindFromName(originalName)!;
  const fileType = MANUSCRIPT_MIME[fileKind];

  let paymentRecord: PaymentRecord | undefined;
  let couponCode: string | undefined;
  let discountPercent: number | undefined;

  if (typeof paymentRaw === "string") {
    // --- Paid path (full price or partial discount) -----------------------
    // Signature, cross-collection replay guard, Razorpay-side amount/status,
    // order kind (PAPER) and server-computed price are all checked here.
    const verified = await verifyRazorpayPayment(paymentRaw, "PAPER");
    if (!verified.ok) return fail(verified.error, verified.status);
    const v = verified.payment;

    couponCode = v.couponCode;
    discountPercent = v.discountPercent;
    if (couponCode) await recordPaidRedemption(couponCode);

    paymentRecord = {
      orderId: v.orderId,
      paymentId: v.paymentId,
      amountInPaise: v.amountInPaise,
      baseAmountInPaise: v.baseAmountInPaise,
      currency: v.currency,
      paidAt: new Date().toISOString(),
    };
  } else if (typeof couponCodeRaw === "string" && couponCodeRaw.trim()) {
    // --- Free path: only a 100% coupon skips checkout -----------------------
    const priced = await quote(couponCodeRaw, "PAPER");
    if (!priced.ok) return fail(priced.error);
    if (priced.finalAmountPaise > 0) return fail("This coupon is a partial discount - payment is required");

    const redemption = await redeemCoupon(couponCodeRaw, "PAPER");
    if (!redemption.ok) return fail(redemption.reason);
    couponCode = redemption.coupon.code;
    discountPercent = redemption.coupon.discountPercent;
  } else {
    return fail("Missing payment details");
  }

  const fileKey = `${S3_PREFIXES.manuscripts}${randomUUID()}/${sanitizeFileName(originalName)}`;

  try {
    if (pendingKey) await promoteUpload(pendingKey, fileKey);
    else await putObjectBuffer(fileKey, buffer!, fileType);
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
    fileName: originalName,
    fileType,
    fileSize,
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
