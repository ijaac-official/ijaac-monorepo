import { NextRequest, NextResponse } from "next/server";
import { parseChargeKind, quote } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const kind = parseChargeKind(req.nextUrl.searchParams.get("kind"));
  if (!kind) return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  try {
    const result = await quote(req.nextUrl.searchParams.get("coupon"), kind);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  } catch (err) {
    console.error("Quote failed", err);
    return NextResponse.json({ error: "Could not load pricing, please try again" }, { status: 502 });
  }
}
