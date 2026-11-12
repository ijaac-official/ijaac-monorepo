import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getRazorpay, quote } from "@/lib/pricing";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const priced = await quote(typeof body?.couponCode === "string" ? body.couponCode : undefined);
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
