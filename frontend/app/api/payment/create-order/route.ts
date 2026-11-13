import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { MULTIPART_FALLBACK_MAX_BYTES, type ChargeKind } from "@ijaac/shared";
import { getRazorpay, parseChargeKind, quote } from "@/lib/pricing";
import {
  checkManuscriptMeta,
  checkoutPrevalidationSchema,
  firstIssueMessage,
  normalizeSubmissionInput,
} from "@/app/submit-paper/manuscript-checks";
import { bookCheckoutPrevalidationSchema, normalizeBookInput } from "@/app/books/publish/book-checks";
import { UPLOAD_RULES, type UploadKind } from "@/lib/file-checks";
import { verifyUpload } from "@/lib/uploads";

export const runtime = "nodejs";

type FileDescriptor = { name: string; size: number; type: string; key?: string; token?: string };

/**
 * A file is either already in S3 (key + token: verified now - exists, size, magic
 * bytes) or will travel in the multipart body, which only works up to the fallback limit.
 */
async function checkFile(kind: UploadKind, f: FileDescriptor): Promise<string | null> {
  if (f.key || f.token) {
    const v = await verifyUpload(kind, f.key, f.token);
    return v.ok ? null : v.error;
  }
  const metaError = UPLOAD_RULES[kind].checkMeta(f);
  if (metaError) return metaError;
  if (f.size > MULTIPART_FALLBACK_MAX_BYTES) {
    return "The file upload did not complete. Please try again (files over 4 MB must upload directly).";
  }
  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const raw = body as Record<string, unknown>;
  const kind: ChargeKind | null = parseChargeKind(raw.kind);
  if (!kind) return NextResponse.json({ error: "Invalid checkout kind" }, { status: 400 });

  // Pre-validate the full submission metadata (no file contents) before any
  // order exists, so a crafted request cannot open checkout for an empty or
  // incomplete submission. The submission routes re-validate everything again.
  let couponCode: string | undefined;
  let fileError: string | null;
  try {
    if (kind === "BOOK") {
      const parsed = bookCheckoutPrevalidationSchema.safeParse({ ...raw, book: normalizeBookInput(raw.book) });
      if (!parsed.success) {
        return NextResponse.json(
          { error: firstIssueMessage(parsed.error), issues: parsed.error.issues },
          { status: 400 }
        );
      }
      couponCode = parsed.data.couponCode || undefined;
      // No manuscript file for books (the editorial office collects it by email); only the optional cover.
      fileError = parsed.data.cover ? await checkFile("book-cover", parsed.data.cover) : null;
    } else {
      const parsed = checkoutPrevalidationSchema.safeParse({
        ...raw,
        submission: normalizeSubmissionInput(raw.submission),
      });
      if (!parsed.success) {
        return NextResponse.json(
          { error: firstIssueMessage(parsed.error), issues: parsed.error.issues },
          { status: 400 }
        );
      }
      couponCode = parsed.data.couponCode || undefined;
      fileError = checkManuscriptMeta(parsed.data.file) ?? (await checkFile("paper-manuscript", parsed.data.file));
    }
  } catch (err) {
    console.error("Upload verification failed", err);
    return NextResponse.json({ error: "Could not verify the uploaded file, please try again" }, { status: 502 });
  }
  if (fileError) return NextResponse.json({ error: fileError }, { status: 400 });

  const priced = await quote(couponCode, kind);
  if (!priced.ok) return NextResponse.json({ error: priced.error }, { status: 400 });

  // 100% discount: there is nothing to charge, and Razorpay rejects Rs 0 orders.
  if (priced.finalAmountPaise === 0) {
    return NextResponse.json({ free: true, ...priced });
  }

  try {
    const order = await getRazorpay().orders.create({
      amount: priced.finalAmountPaise,
      currency: "INR",
      receipt: `${kind === "BOOK" ? "book" : "sub"}_${randomUUID().slice(0, 24)}`,
      // Server-set and stored by Razorpay - the submission routes read the kind,
      // base price and coupon back from here rather than trusting the client.
      notes: {
        kind,
        basePaise: String(priced.baseAmountPaise),
        ...(priced.couponCode
          ? { couponCode: priced.couponCode, discountPercent: String(priced.discountPercent) }
          : {}),
      },
    });

    return NextResponse.json({
      free: false,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      ...priced,
    });
  } catch (err) {
    console.error("Razorpay order creation failed", err);
    return NextResponse.json({ error: "Could not create payment order" }, { status: 502 });
  }
}
