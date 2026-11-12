/** Razorpay rejects orders below ₹1, so any non-free amount is clamped up to this. */
export const MIN_CHARGE_PAISE = 100;

export function discountedAmountPaise(basePaise: number, discountPercent: number): number {
  const pct = Math.min(100, Math.max(0, discountPercent));
  if (pct >= 100) return 0;
  const discounted = Math.round(basePaise * (1 - pct / 100));
  return Math.max(MIN_CHARGE_PAISE, discounted);
}

export function formatInr(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
