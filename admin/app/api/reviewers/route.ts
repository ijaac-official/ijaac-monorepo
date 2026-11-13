import { NextRequest, NextResponse } from "next/server";
import { reviewerInputSchema } from "@ijaac/shared";
import { createReviewer, listReviewers } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

const STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

/** GET /api/reviewers?status=APPROVED&activeOnly=1 */
export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const statusParam = req.nextUrl.searchParams.get("status")?.toUpperCase();
  const status = STATUSES.find((s) => s === statusParam);
  const activeParam = req.nextUrl.searchParams.get("activeOnly");
  const activeOnly = activeParam === "1" || activeParam === "true";
  return NextResponse.json(await listReviewers({ status, activeOnly }));
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = reviewerInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const reviewer = await createReviewer(parsed.data);
  return NextResponse.json(reviewer, { status: 201 });
}
