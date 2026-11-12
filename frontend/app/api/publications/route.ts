import { NextRequest, NextResponse } from "next/server";
import { listPublishedPapersPage } from "@ijaac/data-store";

export async function GET(req: NextRequest) {
  const offset = Number(req.nextUrl.searchParams.get("offset") ?? "0");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "10");
  const query = req.nextUrl.searchParams.get("q") ?? undefined;

  const { items, total } = await listPublishedPapersPage({ offset, limit, query }).catch(() => ({
    items: [],
    total: 0,
  }));

  return NextResponse.json({ items, total });
}
