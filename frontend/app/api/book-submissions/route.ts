import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { formatInr, bookSubmissionFormSchema, type BookSubmission } from "@ijaac/shared";
import { S3_PREFIXES, putObjectBuffer } from "@ijaac/aws";
import {
  DuplicatePaymentOrderError,
  createBookSubmission,
  recordPaidRedemption,
  redeemCoupon,
} from "@ijaac/data-store";
import {
  sendBookPaymentReceiptEmail,
  sendBookSubmissionEditorNotification,
  sendBookSubmissionReceivedEmail,
} from "@ijaac/email";
import { generateReceiptPdf } from "@ijaac/certificate";
import { quote } from "@/lib/pricing";
import { verifyRazorpayPayment } from "@/lib/payment-verify";
import { displayName, promoteUpload, verifyUpload } from "@/lib/uploads";
import { UPLOAD_RULES, sanitizeFileName, type UploadKind } from "@/lib/file-checks";
import { firstIssueMessage } from "@/app/submit-paper/manuscript-checks";
import { normalizeBookInput } from "@/app/books/publish/book-checks";

export const runtime = "nodejs";

type PaymentRecord = NonNullable<BookSubmission["payment"]>;

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

interface AcceptedFile {
  /** Verified pending S3 key (direct upload) ... */
  pendingKey?: string;
  /** ... or the bytes from the multipart fallback */
  buffer?: Buffer;
  name: string;
  size: number;
  contentType: string;
}

/** Reads one file either as a verified S3 key (`<field>Key`/`<field>Token`) or a multipart File (`<field>`). */
async function acceptFile(
  formData: FormData,
  field: "cover",
  kind: UploadKind
): Promise<{ ok: true; file: AcceptedFile | null } | { ok: false; error: string; status?: number }> {
  const key = formData.get(`${field}Key`);
  const token = formData.get(`${field}Token`);
  const name = formData.get(`${field}Name`);
  const rules = UPLOAD_RULES[kind];

  if (typeof key === "string" && key) {
    let v;
    try {
      v = await verifyUpload(kind, key, token);
    } catch (err) {
      console.error("Upload verification failed", err);
      return { ok: false, error: "Could not verify the uploaded file, please try again", status: 502 };
    }
    if (!v.ok) return { ok: false, error: v.error };
    return {
      ok: true,
      file: { pendingKey: v.key, name: displayName(name, v.key), size: v.size, contentType: v.contentType },
    };
  }

  const f = formData.get(field);
  if (!(f instanceof File)) return { ok: true, file: null };
  const metaError = rules.checkMeta(f);
  if (metaError) return { ok: false, error: metaError };
  const buffer = Buffer.from(await f.arrayBuffer());
  if (buffer.length === 0) return { ok: false, error: "The selected file is empty." };
  const bytesError = rules.checkBytes(f.name, new Uint8Array(buffer.subarray(0, 1024)));
  if (bytesError) return { ok: false, error: bytesError };
  return { ok: true, file: { buffer, name: f.name, size: buffer.length, contentType: rules.contentType(f.name)! } };
}

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  if (!formData) return fail("Invalid form data");

  const payloadRaw = formData.get("payload");
  const paymentRaw = formData.get("payment");
  const couponCodeRaw = formData.get("couponCode");
  const consent = formData.get("consent");
  if (typeof payloadRaw !== "string") return fail("Missing form fields");
  if (consent !== "true") return fail("Please confirm the rights declaration and the non-refundable fee policy");

  let payloadJson: unknown;
  try {
    payloadJson = JSON.parse(payloadRaw);
  } catch {
    return fail("Malformed payload");
  }
  const parsed = bookSubmissionFormSchema.safeParse(normalizeBookInput(payloadJson));
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error), issues: parsed.error.issues }, { status: 400 });
  }

  // No manuscript file is collected online - the editorial office requests it by email.
  // The optional cover is fully verified BEFORE any coupon is redeemed or payment is consumed.
  const coverRes = await acceptFile(formData, "cover", "book-cover");
  if (!coverRes.ok) return fail(coverRes.error, coverRes.status);
  const cover = coverRes.file;

  let paymentRecord: PaymentRecord | undefined;
  let couponCode: string | undefined;
  let discountPercent: number | undefined;

  if (typeof paymentRaw === "string") {
    // Signature, replay guard across papers + books, Razorpay status/amount,
    // order kind must be BOOK, and the amount must equal the server-computed price.
    const verified = await verifyRazorpayPayment(paymentRaw, "BOOK");
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
    // Free path: only a 100% coupon valid for books skips checkout.
    const priced = await quote(couponCodeRaw, "BOOK");
    if (!priced.ok) return fail(priced.error);
    if (priced.finalAmountPaise > 0) return fail("This coupon is a partial discount - payment is required");
    const redemption = await redeemCoupon(couponCodeRaw, "BOOK");
    if (!redemption.ok) return fail(redemption.reason);
    couponCode = redemption.coupon.code;
    discountPercent = redemption.coupon.discountPercent;
  } else {
    return fail("Missing payment details");
  }

  const id = randomUUID();
  const coverKey = cover ? `${S3_PREFIXES.bookCovers}${id}/${sanitizeFileName(cover.name)}` : undefined;

  if (cover && coverKey) {
    try {
      if (cover.pendingKey) await promoteUpload(cover.pendingKey, coverKey);
      else await putObjectBuffer(coverKey, cover.buffer!, cover.contentType);
    } catch (err) {
      console.error("Book cover storage failed", err);
      return fail("Cover image upload failed, please try again", 502);
    }
  }

  if (paymentRecord) {
    const datePart = paymentRecord.paidAt.slice(0, 10).replace(/-/g, "");
    paymentRecord.receiptNumber = `IJAAC-BOOK-${datePart}-${id.slice(0, 6).toUpperCase()}`;
  }

  let record: BookSubmission;
  try {
    record = await createBookSubmission({
      ...parsed.data,
      id,
      coverKey,
      coverType: cover?.contentType,
      payment: paymentRecord,
      couponCode,
      discountPercent,
    });
  } catch (err) {
    if (err instanceof DuplicatePaymentOrderError) return fail("This payment has already been used for a submission", 409);
    throw err;
  }

  // Best-effort notifications - the submission is already safely stored.
  const emails: Promise<unknown>[] = [
    sendBookSubmissionReceivedEmail(record),
    sendBookSubmissionEditorNotification(record),
  ];
  if (paymentRecord) emails.push(sendReceipt(record, paymentRecord));
  const results = await Promise.allSettled(emails);
  results.forEach((r) => {
    if (r.status === "rejected") console.error("Book submission email failed", r.reason);
  });

  return NextResponse.json({ id: record.id }, { status: 201 });
}

async function sendReceipt(book: BookSubmission, payment: PaymentRecord) {
  const pdf = await generateReceiptPdf({
    receiptNumber: payment.receiptNumber!,
    paidAt: new Date(payment.paidAt),
    payerName: book.authorName,
    payerEmail: book.email,
    submissionId: book.id,
    paperTitle: book.subtitle ? `${book.title}: ${book.subtitle}` : book.title,
    titleLabel: "Book",
    itemLabel: "Book publication fee",
    baseAmountPaise: payment.baseAmountInPaise ?? payment.amountInPaise,
    discountPercent: book.discountPercent,
    couponCode: book.couponCode,
    amountPaidPaise: payment.amountInPaise,
    razorpayPaymentId: payment.paymentId,
    razorpayOrderId: payment.orderId,
  });
  await sendBookPaymentReceiptEmail({
    to: book.email,
    authorName: book.authorName,
    bookTitle: book.title,
    amountLabel: formatInr(payment.amountInPaise),
    receiptNumber: payment.receiptNumber!,
    receiptPdf: pdf,
  });
}
