import { randomUUID } from "node:crypto";
import { couponAppliesTo, type ChargeKind, type Coupon, type CouponScope } from "@ijaac/shared";
import { readCollection, updateCollection } from "../json-store";

const COLLECTION = "coupons";

export type CouponCheck = { ok: true; coupon: Coupon } | { ok: false; reason: string };

const scopeLabel: Record<ChargeKind, string> = { PAPER: "paper submissions", BOOK: "book publication" };

/** `kind` omitted = no scope check (legacy callers). */
function checkUsable(c: Coupon | undefined, kind?: ChargeKind): CouponCheck {
  if (!c) return { ok: false, reason: "Invalid coupon code" };
  if (!c.isActive) return { ok: false, reason: "This coupon has been stopped" };
  if (kind && !couponAppliesTo(c.appliesTo, kind)) {
    const other: ChargeKind = kind === "PAPER" ? "BOOK" : "PAPER";
    return { ok: false, reason: `This coupon is only valid for ${scopeLabel[other]}, not ${scopeLabel[kind]}` };
  }
  if (c.redeemedCount >= c.maxRedemptions) return { ok: false, reason: "This coupon has been fully redeemed" };
  return { ok: true, coupon: c };
}

const sameCode = (c: Coupon, code: string) => c.code.toLowerCase() === code.trim().toLowerCase();

export async function listCoupons(): Promise<Coupon[]> {
  const items = await readCollection<Coupon>(COLLECTION);
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Read-only check, used to quote a price - does not consume a redemption. */
export async function validateCoupon(code: string, kind?: ChargeKind): Promise<CouponCheck> {
  const items = await readCollection<Coupon>(COLLECTION);
  return checkUsable(items.find((c) => sameCode(c, code)), kind);
}

export async function createCoupon(input: {
  code: string;
  discountPercent: number;
  maxRedemptions: number;
  appliesTo?: CouponScope;
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
    ...(input.appliesTo && input.appliesTo !== "ALL" ? { appliesTo: input.appliesTo } : {}),
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
export async function redeemCoupon(code: string, kind?: ChargeKind): Promise<CouponCheck> {
  let result: CouponCheck = { ok: false, reason: "Invalid coupon code" };

  await updateCollection<Coupon>(COLLECTION, (items) => {
    // reset per pass - this runs again on an ETag conflict
    result = { ok: false, reason: "Invalid coupon code" };
    return items.map((c) => {
      if (!sameCode(c, code)) return c;
      result = checkUsable(c, kind);
      if (!result.ok) return c;
      const updated = { ...c, redeemedCount: c.redeemedCount + 1, updatedAt: new Date().toISOString() };
      result = { ok: true, coupon: updated };
      return updated;
    });
  });

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

/** Edit code / discount / quantity / active flag. Rejects a code that collides with another coupon. */
export async function updateCoupon(
  id: string,
  patch: {
    code?: string;
    discountPercent?: number;
    maxRedemptions?: number;
    isActive?: boolean;
    appliesTo?: CouponScope;
  }
): Promise<Coupon> {
  let updated: Coupon | undefined;
  let conflict = false;
  const code = patch.code?.trim().toUpperCase();
  await updateCollection<Coupon>(COLLECTION, (items) => {
    updated = undefined;
    conflict = !!code && items.some((c) => c.id !== id && sameCode(c, code));
    if (conflict) return items;
    return items.map((c) => {
      if (c.id !== id) return c;
      updated = {
        ...c,
        ...(code ? { code } : {}),
        ...(patch.discountPercent !== undefined ? { discountPercent: patch.discountPercent } : {}),
        ...(patch.maxRedemptions !== undefined ? { maxRedemptions: patch.maxRedemptions } : {}),
        ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
        ...(patch.appliesTo !== undefined ? { appliesTo: patch.appliesTo } : {}),
        updatedAt: new Date().toISOString(),
      };
      return updated;
    });
  });
  if (conflict) throw new Error(`Coupon code already exists: ${code}`);
  if (!updated) throw new Error(`Coupon not found: ${id}`);
  return updated;
}

export async function deleteCoupon(id: string): Promise<void> {
  await updateCollection<Coupon>(COLLECTION, (items) => items.filter((c) => c.id !== id));
}
