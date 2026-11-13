import { NextRequest, NextResponse } from "next/server";
import { settingsUpdateSchema } from "@ijaac/shared";
import { getSettings, updateSettings } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getSettings());
}

/** Body: { paperFeeInr?: number, bookFeeInr?: number } - whole rupees, min 1. */
export async function PATCH(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = settingsUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const updatedById = (session.user as { id?: string }).id ?? session.user?.email ?? undefined;
  try {
    const settings = await updateSettings({
      ...(parsed.data.paperFeeInr !== undefined ? { paperFeeInPaise: parsed.data.paperFeeInr * 100 } : {}),
      ...(parsed.data.bookFeeInr !== undefined ? { bookFeeInPaise: parsed.data.bookFeeInr * 100 } : {}),
      updatedById,
    });
    return NextResponse.json(settings);
  } catch (err) {
    console.error("Settings update failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not save settings" }, { status: 500 });
  }
}
