import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensureYearIssues } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

const schema = z.object({
  year: z.number().int().min(1900).max(3000),
  volume: z.string().min(1).optional(),
});

/** Creates any missing monthly issues (1-12) for a year. */
export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const created = await ensureYearIssues(parsed.data.year, { volume: parsed.data.volume });
  return NextResponse.json({ created: created.length, issues: created }, { status: 201 });
}
