import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSettings, updateSettings } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

const settingsUpdateSchema = z.object({
  earlyBirdEnabled: z.boolean().optional(),
  earlyBirdCouponCode: z.string().min(3).optional(),
});

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getSettings());
}

export async function PATCH(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = settingsUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const settings = await updateSettings(parsed.data);
  return NextResponse.json(settings);
}
