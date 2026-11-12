import { randomUUID } from "node:crypto";
import type { Coupon } from "@ijaac/shared";
import { readCollection, updateCollection } from "../json-store";

const COLLECTION = "coupons";

export type CouponCheck = { ok: true; coupon: Coupon } | { ok: false; reason: string };

function checkUsable(c: Coupon | undefined): CouponCheck {
  if (!c) return { ok: false, reason: "Invalid coupon code" };
  if (!c.isActive) return { ok: false, reason: "This coupon has been stopped" };
  if (c.redeemedCount >= c.maxRedemptions) return { ok: false, reason: "This coupon has been fully redeemed" };
  return { ok: true, coupon: c };
}

const sameCode = (c: Coupon, code: string) => c.code.toLowerCase() === code.trim().toLowerCase();

export async function listCoupons(): Promise<Coupon[]> {
  const items = await readCollection<Coupon>(COLLECTION);
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Read-only check, used to quote a price - does not consume a redemption. */
export async function validateCoupon(code: string): Promise<CouponCheck> {
  const items = await readCollection<Coupon>(COLLECTION);
  return checkUsable(items.find((c) => sameCode(c, code)));
}

export async function createCoupon(input: {
  code: string;
  discountPercent: number;
  maxRedemptions: number;
}): Promise<Coupon> {
  const code = input.code.trim().toUpperCase();
  const existing = await readCollection<Coupon>(COLLECTION);
  if (existing.some((c) => sameCode(c, code))) {
    throw new Error(`Coupon code already exists: ${code}`);
  }

  const now = new Date().toISOString();
  const record: Coupon = {
    id: randomUUID(),
    code,
    discountPercent: input.discountPercent,
    maxRedemptions: input.maxRedemptions,
    redeemedCount: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  await updateCollection<Coupon>(COLLECTION, (items) => [...items, record]);
  return record;
}

export async function setCouponActive(id: string, isActive: boolean): Promise<Coupon> {
  let updated: Coupon | undefined;
  await updateCollection<Coupon>(COLLECTION, (items) =>
    items.map((c) => {
      if (c.id !== id) return c;
      updated = { ...c, isActive, updatedAt: new Date().toISOString() };
      return updated;
    })
  );
  if (!updated) throw new Error(`Coupon not found: ${id}`);
  return updated;
}

/**
 * Atomically validates and consumes one redemption - re-checks against live
 * data under the ETag-guarded retry, so two simultaneous submissions can't
 * both slip in under the last remaining slot.
 */
export async function redeemCoupon(code: string): Promise<CouponCheck> {
  let result: CouponCheck = { ok: false, reason: "Invalid coupon code" };

  await updateCollection<Coupon>(COLLECTION, (items) =>
    items.map((c) => {
      if (!sameCode(c, code)) return c;
      result = checkUsable(c);
      if (!result.ok) return c;
      const updated = { ...c, redeemedCount: c.redeemedCount + 1, updatedAt: new Date().toISOString() };
      result = { ok: true, coupon: updated };
      return updated;
    })
  );

  return result;
}

/**
 * Counts a redemption for a coupon whose discount was already paid for at a
 * server-priced Razorpay order - the customer has paid, so this never refuses.
 */
export async function recordPaidRedemption(code: string): Promise<void> {
  await updateCollection<Coupon>(COLLECTION, (items) =>
    items.map((c) =>
      sameCode(c, code)
        ? { ...c, redeemedCount: c.redeemedCount + 1, updatedAt: new Date().toISOString() }
        : c
    )
  );
}
