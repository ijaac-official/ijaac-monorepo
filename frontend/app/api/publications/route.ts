import { NextRequest, NextResponse } from "next/server";
import { listPublishedPapersPage } from "@ijaac/data-store";

export const dynamic = "force-dynamic";

function toInt(raw: string | null, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const offset = toInt(params.get("offset"), 0, 0, 100_000);
  const limit = toInt(params.get("limit"), 10, 1, 50);
  // Matching in the data store is case-insensitive; normalise whitespace here too.
  const query = (params.get("q") ?? "").trim().replace(/\s+/g, " ") || undefined;

  const { items, total } = await listPublishedPapersPage({ offset, limit, query }).catch(() => ({
    items: [],
    total: 0,
  }));

  return NextResponse.json({ items, total });
}
