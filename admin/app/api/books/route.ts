import { NextRequest, NextResponse } from "next/server";
import { bookInputSchema } from "@ijaac/shared";
import { createBook, listBooks } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await listBooks());
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = bookInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const book = await createBook(parsed.data);
  return NextResponse.json(book, { status: 201 });
}
