import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createIssue, createMonthlyIssue, DuplicateIssueError, listIssues } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

const issueInputSchema = z.object({
  volume: z.string().min(1).optional(),
  number: z.string().min(1).optional(),
  year: z.number().int().min(1900).max(3000),
  month: z.number().int().min(1).max(12).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  publishDate: z.string().optional(),
  isCurrent: z.boolean().optional(),
  isHidden: z.boolean().optional(),
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
  const { coverImageUrl, ...data } = parsed.data;

  try {
    if (data.month) {
      const issue = await createMonthlyIssue({
        ...data,
        month: data.month,
        coverImageUrl: coverImageUrl || undefined,
      });
      return NextResponse.json(issue, { status: 201 });
    }
    // Legacy (non-monthly) shape: explicit volume + number.
    if (!data.volume || !data.number) {
      return NextResponse.json({ error: "Provide a month, or a volume and issue number" }, { status: 400 });
    }
    const issue = await createIssue({
      ...data,
      volume: data.volume,
      number: data.number,
      coverImageUrl: coverImageUrl || undefined,
    });
    return NextResponse.json(issue, { status: 201 });
  } catch (err) {
    if (err instanceof DuplicateIssueError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
