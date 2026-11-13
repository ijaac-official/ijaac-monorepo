import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { paymentRequestCreateSchema } from "@ijaac/shared";
import { createPaymentRequest, getSubmission, listPaymentRequests } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";
import { RazorpayError, createPaymentLink, createUpiQr } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

const QR_DISABLED =
  "QR Codes are not enabled on your Razorpay account - use Payment Link instead";

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await listPaymentRequests());
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = paymentRequestCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const input = parsed.data;

  const submissionId = input.submissionId || undefined;
  if (submissionId && !(await getSubmission(submissionId))) {
    return NextResponse.json({ error: "Linked submission was not found" }, { status: 400 });
  }

  const customer = {
    ...(input.customer.name ? { name: input.customer.name } : {}),
    ...(input.customer.email ? { email: input.customer.email } : {}),
    ...(input.customer.phone ? { phone: input.customer.phone } : {}),
  };
  const amountInPaise = Math.round(input.amountInr * 100);
  const expiresAt = input.expiryDays ? new Date(Date.now() + input.expiryDays * 86_400_000) : undefined;
  const referenceId = `ijaac_${Date.now().toString(36)}${randomBytes(4).toString("hex")}`;
  const createdById = (session.user as { id?: string }).id ?? session.user?.email ?? "admin";
  const notes: Record<string, string> = {
    source: "ijaac-admin",
    ...(submissionId ? { submission_id: submissionId } : {}),
  };

  let remote;
  try {
    const remoteInput = { amountInPaise, description: input.description, customer, expiresAt, referenceId, notes };
    remote = input.kind === "LINK" ? await createPaymentLink(remoteInput) : await createUpiQr(remoteInput);
  } catch (err) {
    if (err instanceof RazorpayError) {
      if (input.kind === "QR" && err.httpStatus !== 401 && err.httpStatus !== 500) {
        return NextResponse.json({ error: `${QR_DISABLED} (Razorpay: ${err.message})` }, { status: 502 });
      }
      return NextResponse.json({ error: err.message }, { status: err.httpStatus >= 500 ? 500 : 502 });
    }
    return NextResponse.json({ error: "Could not reach Razorpay" }, { status: 502 });
  }

  const record = await createPaymentRequest({
    kind: input.kind,
    amountInPaise,
    description: input.description,
    customer,
    ...(submissionId ? { submissionId } : {}),
    ...remote,
    createdById,
    ...(expiresAt ? { expiresAt: expiresAt.toISOString() } : {}),
  });
  return NextResponse.json(record, { status: 201 });
}
