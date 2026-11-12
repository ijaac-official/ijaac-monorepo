import { NextRequest, NextResponse } from "next/server";
import { reviewerInputSchema } from "@ijaac/shared";
import { createReviewer, listReviewers } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await listReviewers());
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
