import { NextRequest, NextResponse } from "next/server";
import { contactFormSchema } from "@ijaac/shared";
import { createContactMessage } from "@ijaac/data-store";

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = contactFormSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const message = await createContactMessage(parsed.data);
  return NextResponse.json({ id: message.id }, { status: 201 });
}
