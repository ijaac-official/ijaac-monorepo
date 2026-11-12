import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createIssue, listIssues } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

const issueInputSchema = z.object({
  volume: z.string().min(1),
  number: z.string().min(1),
  year: z.number().int(),
  title: z.string().optional(),
  publishDate: z.string().optional(),
  isCurrent: z.boolean().optional(),
});

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await listIssues());
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = issueInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const issue = await createIssue(parsed.data);
  return NextResponse.json(issue, { status: 201 });
}
