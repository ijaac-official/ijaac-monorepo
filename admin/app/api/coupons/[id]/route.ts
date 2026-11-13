import { NextRequest, NextResponse } from "next/server";
import { couponUpdateSchema } from "@ijaac/shared";
import { deleteCoupon, listCoupons, updateCoupon } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = couponUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  if (parsed.data.maxRedemptions !== undefined) {
    const current = (await listCoupons()).find((c) => c.id === params.id);
    if (!current) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    if (parsed.data.maxRedemptions < current.redeemedCount) {
      return NextResponse.json(
        { error: `Number of uses cannot be below the ${current.redeemedCount} already redeemed` },
        { status: 400 }
      );
    }
  }

  try {
    const coupon = await updateCoupon(params.id, parsed.data);
    return NextResponse.json(coupon);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update coupon";
    const status = message.includes("already exists") ? 409 : message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const coupon = (await listCoupons()).find((c) => c.id === params.id);
  if (!coupon) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  if (coupon.redeemedCount > 0) {
    return NextResponse.json(
      { error: "This coupon has already been used - stop it instead of deleting it" },
      { status: 409 }
    );
  }

  await deleteCoupon(params.id);
  return NextResponse.json({ ok: true });
}
