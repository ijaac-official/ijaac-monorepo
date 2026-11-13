import Razorpay from "razorpay";
import { discountedAmountPaise, type ChargeKind } from "@ijaac/shared";
import { getSettings, validateCoupon } from "@ijaac/data-store";

export const CHARGE_KINDS: ChargeKind[] = ["PAPER", "BOOK"];

/** Parses a client-supplied kind; anything unknown/absent is PAPER (the original flow). */
export function parseChargeKind(raw: unknown): ChargeKind | null {
  if (raw === undefined || raw === null || raw === "") return "PAPER";
  return raw === "PAPER" || raw === "BOOK" ? raw : null;
}

/**
 * Base fee from the admin "Fees & Charges" settings (data/settings.json), which
 * itself falls back to SUBMISSION_FEE_INR / BOOK_FEE_INR when never saved.
 */
export async function baseFeePaise(kind: ChargeKind = "PAPER"): Promise<number> {
  const settings = await getSettings();
  return kind === "BOOK" ? settings.bookFeeInPaise : settings.paperFeeInPaise;
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
      kind: ChargeKind;
      baseAmountPaise: number;
      finalAmountPaise: number;
      discountPercent: number;
      couponCode?: string;
    }
  | { ok: false; error: string };

/** Server-side price for a paper or book, with an optional coupon - never trusts a client-sent amount. */
export async function quote(couponCode?: string | null, kind: ChargeKind = "PAPER"): Promise<Quote> {
  const base = await baseFeePaise(kind);
  const code = couponCode?.trim();
  if (!code) return { ok: true, kind, baseAmountPaise: base, finalAmountPaise: base, discountPercent: 0 };

  const check = await validateCoupon(code, kind);
  if (!check.ok) return { ok: false, error: check.reason };

  return {
    ok: true,
    kind,
    baseAmountPaise: base,
    finalAmountPaise: discountedAmountPaise(base, check.coupon.discountPercent),
    discountPercent: check.coupon.discountPercent,
    couponCode: check.coupon.code,
  };
}
