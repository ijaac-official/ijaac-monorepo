import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setCouponActive } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

const toggleSchema = z.object({ isActive: z.boolean() });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = toggleSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const coupon = await setCouponActive(params.id, parsed.data.isActive);
  return NextResponse.json(coupon);
}
