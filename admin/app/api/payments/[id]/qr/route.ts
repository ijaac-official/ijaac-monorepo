import { NextRequest, NextResponse } from "next/server";
import { getPaymentRequest } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";
import { qrImage } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

/** The request's QR as an image (same-origin, so the client can draw/download it). */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const record = await getPaymentRequest(params.id);
  if (!record) return NextResponse.json({ error: "Payment request not found" }, { status: 404 });

  try {
    const { body, contentType } = await qrImage(record);
    const download = req.nextUrl.searchParams.get("download") === "1";
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
        ...(download ? { "Content-Disposition": `attachment; filename="ijaac-payment-${record.id.slice(0, 8)}.png"` } : {}),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not load QR" }, { status: 502 });
  }
}
