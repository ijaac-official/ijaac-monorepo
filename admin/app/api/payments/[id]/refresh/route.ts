import { NextResponse } from "next/server";
import { getPaymentRequest, updatePaymentRequest } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";
import { RazorpayError, fetchRemoteState } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const record = await getPaymentRequest(params.id);
  if (!record) return NextResponse.json({ error: "Payment request not found" }, { status: 404 });

  try {
    const state = await fetchRemoteState(record);
    const updated = await updatePaymentRequest(record.id, {
      status: state.status,
      paymentIds: state.paymentIds?.length ? state.paymentIds : record.paymentIds,
      paidAt: state.paidAt ?? record.paidAt,
    });
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof RazorpayError ? err.message : "Could not reach Razorpay";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
