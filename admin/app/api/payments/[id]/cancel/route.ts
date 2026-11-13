import { NextResponse } from "next/server";
import { getPaymentRequest, updatePaymentRequest } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";
import { RazorpayError, cancelRemote } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const record = await getPaymentRequest(params.id);
  if (!record) return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
  if (record.status !== "CREATED") {
    return NextResponse.json({ error: `This request is already ${record.status.toLowerCase()}` }, { status: 409 });
  }

  try {
    const state = await cancelRemote(record);
    // A QR close reports "on_demand"; anything else means it was paid/expired in the meantime.
    const updated = await updatePaymentRequest(record.id, {
      status: state.status === "CREATED" ? "CANCELLED" : state.status,
      ...(state.paymentIds?.length ? { paymentIds: state.paymentIds } : {}),
      ...(state.paidAt ? { paidAt: state.paidAt } : {}),
    });
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof RazorpayError ? err.message : "Could not reach Razorpay";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
