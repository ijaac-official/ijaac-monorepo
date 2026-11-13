import { NextRequest, NextResponse } from "next/server";
import { listAllSubmissionsRaw } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";
import { isIsoDate } from "@/components/stats/types";
import { computeStats } from "./compute";

export const dynamic = "force-dynamic";

/**
 * GET /api/stats?from=YYYY-MM-DD&to=YYYY-MM-DD&bucket=day|month
 * Omit `from` for all time. Dates are IST calendar days, both inclusive.
 */
export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = req.nextUrl.searchParams;
  const from = params.get("from");
  const to = params.get("to");
  const bucket = params.get("bucket");

  if ((from && !isIsoDate(from)) || (to && !isIsoDate(to))) {
    return NextResponse.json({ error: "Dates must be YYYY-MM-DD" }, { status: 400 });
  }
  if (bucket && bucket !== "day" && bucket !== "month" && bucket !== "auto") {
    return NextResponse.json({ error: "bucket must be day, month or auto" }, { status: 400 });
  }

  const items = await listAllSubmissionsRaw();
  const stats = computeStats(items, {
    from: from || undefined,
    to: to || undefined,
    bucket: bucket === "day" || bucket === "month" ? bucket : undefined,
  });
  return NextResponse.json(stats, { headers: { "Cache-Control": "no-store" } });
}
