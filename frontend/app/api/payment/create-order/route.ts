import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getRazorpay, quote } from "@/lib/pricing";
import {
  checkManuscriptMeta,
  checkoutPrevalidationSchema,
  firstIssueMessage,
  normalizeSubmissionInput,
} from "@/app/submit-paper/manuscript-checks";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Pre-validate the full submission metadata (no file contents) before any
  // order exists, so a crafted request cannot open checkout for an empty or
  // incomplete submission. /api/submissions re-validates everything again.
  const parsed = checkoutPrevalidationSchema.safeParse({
    ...body,
    submission: normalizeSubmissionInput((body as Record<string, unknown>).submission),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: firstIssueMessage(parsed.error), issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const fileError = checkManuscriptMeta(parsed.data.file);
  if (fileError) return NextResponse.json({ error: fileError }, { status: 400 });

  const priced = await quote(parsed.data.couponCode || undefined);
  if (!priced.ok) return NextResponse.json({ error: priced.error }, { status: 400 });

  // 100% discount: there is nothing to charge, and Razorpay rejects ₹0 orders.
  if (priced.finalAmountPaise === 0) {
    return NextResponse.json({ free: true, ...priced });
  }

  try {
    const order = await getRazorpay().orders.create({
      amount: priced.finalAmountPaise,
      currency: "INR",
      receipt: `sub_${randomUUID().slice(0, 24)}`,
      // Server-set and stored by Razorpay - the submission route reads the
      // coupon back from here rather than trusting the client.
      notes: priced.couponCode
        ? { couponCode: priced.couponCode, discountPercent: String(priced.discountPercent) }
        : {},
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
