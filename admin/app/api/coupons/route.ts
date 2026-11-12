import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createCoupon, listCoupons } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

const couponInputSchema = z.object({
  code: z.string().trim().min(3).max(30).regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, - and _ only"),
  discountPercent: z.number().int().min(1).max(100),
  maxRedemptions: z.number().int().min(1).max(100000),
});

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await listCoupons());
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = couponInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  try {
    const coupon = await createCoupon(parsed.data);
    return NextResponse.json(coupon, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create coupon" },
      { status: 409 }
    );
  }
}
