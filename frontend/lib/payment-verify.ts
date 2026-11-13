// Server-side Razorpay verification shared by the paper and book submission routes.
import { createHmac } from "node:crypto";
import { discountedAmountPaise, paymentVerificationSchema, type ChargeKind } from "@ijaac/shared";
import { isPaymentOrderUsedAnywhere } from "@ijaac/data-store";
import { baseFeePaise, getRazorpay } from "@/lib/pricing";

export interface VerifiedPayment {
  orderId: string;
  paymentId: string;
  amountInPaise: number;
  baseAmountInPaise: number;
  currency: string;
  couponCode?: string;
  discountPercent?: number;
}

export type VerifyPaymentResult = { ok: true; payment: VerifiedPayment } | { ok: false; error: string; status: number };

const bad = (error: string, status = 400): VerifyPaymentResult => ({ ok: false, error, status });

/**
 * 1. HMAC signature check, 2. replay guard across paper AND book submissions,
 * 3. payment + order fetched from Razorpay (never trusting the client),
 * 4. order kind (notes.kind) must match - a paper order cannot pay for a book or vice versa,
 * 5. paid amount must equal the order amount, which must equal the server-computed
 *    price (notes.basePaise discounted by notes.discountPercent) recorded when our server created it.
 * Coupon redemption is left to the caller.
 */
export async function verifyRazorpayPayment(paymentRaw: string, kind: ChargeKind): Promise<VerifyPaymentResult> {
  let paymentJson: unknown;
  try {
    paymentJson = JSON.parse(paymentRaw);
  } catch {
    return bad("Malformed payload");
  }
  const payment = paymentVerificationSchema.safeParse(paymentJson);
  if (!payment.success) return bad("Missing or invalid payment details");

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return bad("Payment gateway is not configured", 500);

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payment.data;
  const expectedSignature = createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  if (expectedSignature !== razorpay_signature) return bad("Payment verification failed", 402);

  if (await isPaymentOrderUsedAnywhere(razorpay_order_id)) {
    return bad("This payment has already been used for a submission", 409);
  }

  const razorpay = getRazorpay();
  const [rzpPayment, rzpOrder] = await Promise.all([
    razorpay.payments.fetch(razorpay_payment_id),
    razorpay.orders.fetch(razorpay_order_id),
  ]);
  if (rzpPayment.order_id !== razorpay_order_id || !["authorized", "captured"].includes(rzpPayment.status)) {
    return bad("Payment could not be confirmed", 402);
  }

  const notes = (rzpOrder.notes ?? {}) as Record<string, string>;
  // Orders created before kind-aware checkout carry no kind - they were all paper orders.
  const orderKind = notes.kind || "PAPER";
  if (orderKind !== kind) {
    return bad(
      kind === "BOOK"
        ? "This payment was made for a paper submission, not a book"
        : "This payment was made for a book submission, not a paper",
      409
    );
  }

  const couponCode = notes.couponCode || undefined;
  const discountPercent = notes.discountPercent ? Number(notes.discountPercent) : undefined;
  const orderAmount = Number(rzpOrder.amount);
  const paidAmount = Number(rzpPayment.amount);
  if (!Number.isFinite(paidAmount) || paidAmount !== orderAmount || rzpPayment.currency !== "INR") {
    return bad("Payment amount does not match the order", 402);
  }

  let base: number;
  if (notes.basePaise) {
    base = Number(notes.basePaise);
    if (!Number.isFinite(base) || discountedAmountPaise(base, discountPercent ?? 0) !== orderAmount) {
      return bad("Payment amount does not match the price", 402);
    }
  } else {
    base = await baseFeePaise(kind);
  }

  return {
    ok: true,
    payment: {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amountInPaise: paidAmount,
      baseAmountInPaise: base,
      currency: rzpPayment.currency,
      couponCode,
      discountPercent,
    },
  };
}
