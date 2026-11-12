import { NextRequest, NextResponse } from "next/server";
import { quote } from "@/lib/pricing";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const result = await quote(req.nextUrl.searchParams.get("coupon"));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
