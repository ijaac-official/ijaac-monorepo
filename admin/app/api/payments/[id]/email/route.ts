import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { formatInr } from "@ijaac/shared";
import { getPaymentRequest } from "@ijaac/data-store";
import { sendPaymentRequestEmail } from "@ijaac/email";
import { requireSession } from "@/lib/requireSession";
import { qrImage } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ to: z.string().trim().email("Enter a valid email address") });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const record = await getPaymentRequest(params.id);
  if (!record) return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
  if (record.status !== "CREATED") {
    return NextResponse.json({ error: `This request is ${record.status.toLowerCase()} - nothing to pay` }, { status: 409 });
  }

  try {
    const { body } = await qrImage(record);
    await sendPaymentRequestEmail({
      to: parsed.data.to,
      customerName: record.customer.name,
      amountLabel: formatInr(record.amountInPaise),
      description: record.description,
      payUrl: record.shortUrl,
      qrPng: body,
      expiresAt: record.expiresAt,
      kind: record.kind,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? `Email failed: ${err.message}` : "Email failed" },
      { status: 502 }
    );
  }
}
