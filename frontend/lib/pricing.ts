import Razorpay from "razorpay";
import { discountedAmountPaise } from "@ijaac/shared";
import { validateCoupon } from "@ijaac/data-store";

export function baseFeePaise(): number {
  return Math.round(Number(process.env.SUBMISSION_FEE_INR ?? "1200") * 100);
}

export function getRazorpay(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Payment gateway is not configured");
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export type Quote =
  | {
      ok: true;
      baseAmountPaise: number;
      finalAmountPaise: number;
      discountPercent: number;
      couponCode?: string;
    }
  | { ok: false; error: string };

/** Server-side price for a submission, with an optional coupon - never trusts a client-sent amount. */
export async function quote(couponCode?: string | null): Promise<Quote> {
  const base = baseFeePaise();
  const code = couponCode?.trim();
  if (!code) return { ok: true, baseAmountPaise: base, finalAmountPaise: base, discountPercent: 0 };

  const check = await validateCoupon(code);
  if (!check.ok) return { ok: false, error: check.reason };

  return {
    ok: true,
    baseAmountPaise: base,
    finalAmountPaise: discountedAmountPaise(base, check.coupon.discountPercent),
    discountPercent: check.coupon.discountPercent,
    couponCode: check.coupon.code,
  };
}
