import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateIssue } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

const issueUpdateSchema = z.object({
  volume: z.string().min(1).optional(),
  number: z.string().min(1).optional(),
  year: z.number().int().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  publishDate: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = issueUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const issue = await updateIssue(params.id, parsed.data);
  return NextResponse.json(issue);
}
