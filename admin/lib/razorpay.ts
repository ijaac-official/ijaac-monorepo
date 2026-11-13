import QRCode from "qrcode";
import type { PaymentRequest, PaymentRequestStatus } from "@ijaac/shared";

/**
 * Thin Razorpay REST client (Basic auth) for admin payment requests.
 * The key secret never leaves the server - routes only return our own
 * PaymentRequest records.
 */

const API = "https://api.razorpay.com/v1";

export class RazorpayError extends Error {
  constructor(
    message: string,
    public httpStatus: number,
    public code?: string
  ) {
    super(message);
  }
}

function authHeader(): string {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new RazorpayError("Payment gateway is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)", 500);
  }
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

async function rzp<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: authHeader(),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as {
    error?: { code?: string; description?: string };
  };
  if (!res.ok) {
    if (res.status === 401) throw new RazorpayError("Razorpay rejected the API keys", 401, json.error?.code);
    throw new RazorpayError(json.error?.description || `Razorpay request failed (${res.status})`, res.status, json.error?.code);
  }
  return json as T;
}

// ---------------------------------------------------------------------------
// Razorpay response shapes (only the fields we use)

interface RzpLink {
  id: string;
  short_url: string;
  status: "created" | "partially_paid" | "paid" | "cancelled" | "expired";
  expire_by?: number;
  payments?: { payment_id: string; status: string; created_at: number }[] | null;
}

interface RzpQr {
  id: string;
  image_url: string;
  status: "active" | "closed";
  close_reason?: string | null;
  close_by?: number | null;
  payments_count_received?: number;
}

interface RzpQrPayments {
  items: { id: string; status: string; created_at: number }[];
}

export type RemoteState = Pick<PaymentRequest, "status" | "paidAt" | "paymentIds">;

const toIso = (unix: number) => new Date(unix * 1000).toISOString();

function linkState(link: RzpLink): RemoteState {
  const captured = (link.payments ?? []).filter((p) => p.status === "captured");
  const map: Record<RzpLink["status"], PaymentRequestStatus> = {
    created: "CREATED",
    partially_paid: "CREATED",
    paid: "PAID",
    cancelled: "CANCELLED",
    expired: "EXPIRED",
  };
  const latest = captured.reduce((m, p) => Math.max(m, p.created_at), 0);
  return {
    status: map[link.status] ?? "CREATED",
    paymentIds: captured.map((p) => p.payment_id),
    paidAt: latest ? toIso(latest) : undefined,
  };
}

function qrState(qr: RzpQr, payments: RzpQrPayments["items"]): RemoteState {
  const captured = payments.filter((p) => p.status === "captured");
  const latest = captured.reduce((m, p) => Math.max(m, p.created_at), 0);
  let status: PaymentRequestStatus = "CREATED";
  if (captured.length > 0 || qr.close_reason === "paid") status = "PAID";
  else if (qr.status === "closed") status = qr.close_reason === "on_demand" ? "CANCELLED" : "EXPIRED";
  else if (qr.close_by && qr.close_by * 1000 < Date.now()) status = "EXPIRED";
  return {
    status,
    paymentIds: captured.map((p) => p.id),
    paidAt: latest ? toIso(latest) : undefined,
  };
}

// ---------------------------------------------------------------------------

export interface CreateRemoteInput {
  amountInPaise: number;
  description: string;
  customer: { name?: string; email?: string; phone?: string };
  expiresAt?: Date;
  referenceId: string;
  notes: Record<string, string>;
}

function cleanPhone(phone?: string): string | undefined {
  const p = phone?.replace(/[\s-]/g, "");
  return p || undefined;
}

export async function createPaymentLink(input: CreateRemoteInput) {
  const customer: Record<string, string> = {};
  if (input.customer.name) customer.name = input.customer.name;
  if (input.customer.email) customer.email = input.customer.email;
  const phone = cleanPhone(input.customer.phone);
  if (phone) customer.contact = phone;

  const link = await rzp<RzpLink>("POST", "/payment_links", {
    amount: input.amountInPaise,
    currency: "INR",
    accept_partial: false,
    description: input.description.slice(0, 2048),
    ...(Object.keys(customer).length ? { customer } : {}),
    notify: { sms: false, email: false },
    reminder_enable: false,
    ...(input.expiresAt ? { expire_by: Math.floor(input.expiresAt.getTime() / 1000) } : {}),
    reference_id: input.referenceId,
    notes: input.notes,
  });
  return { razorpayId: link.id, shortUrl: link.short_url, ...linkState(link) };
}

export async function createUpiQr(input: CreateRemoteInput) {
  const qr = await rzp<RzpQr>("POST", "/payments/qr_codes", {
    type: "upi_qr",
    name: (input.customer.name || "IJAAC Payment").slice(0, 100),
    usage: "single_use",
    fixed_amount: true,
    payment_amount: input.amountInPaise,
    description: input.description.slice(0, 250),
    ...(input.expiresAt ? { close_by: Math.floor(input.expiresAt.getTime() / 1000) } : {}),
    notes: { ...input.notes, reference_id: input.referenceId },
  });
  return { razorpayId: qr.id, qrImageUrl: qr.image_url, ...qrState(qr, []) };
}

export async function fetchRemoteState(req: PaymentRequest): Promise<RemoteState> {
  if (req.kind === "LINK") {
    return linkState(await rzp<RzpLink>("GET", `/payment_links/${encodeURIComponent(req.razorpayId)}`));
  }
  const id = encodeURIComponent(req.razorpayId);
  const [qr, payments] = await Promise.all([
    rzp<RzpQr>("GET", `/payments/qr_codes/${id}`),
    rzp<RzpQrPayments>("GET", `/payments/qr_codes/${id}/payments`),
  ]);
  return qrState(qr, payments.items ?? []);
}

export async function cancelRemote(req: PaymentRequest): Promise<RemoteState> {
  const id = encodeURIComponent(req.razorpayId);
  if (req.kind === "LINK") {
    return linkState(await rzp<RzpLink>("POST", `/payment_links/${id}/cancel`));
  }
  const qr = await rzp<RzpQr>("POST", `/payments/qr_codes/${id}/close`);
  return qrState(qr, []);
}

/**
 * Image bytes of the request's QR. Payment Links are encoded locally from the
 * short URL (works with any method); UPI QRs use Razorpay's hosted image.
 */
export async function qrImage(req: PaymentRequest): Promise<{ body: Buffer; contentType: string }> {
  if (req.kind === "LINK" && req.shortUrl) {
    const body = await QRCode.toBuffer(req.shortUrl, {
      type: "png",
      errorCorrectionLevel: "M",
      margin: 2,
      width: 720,
      color: { dark: "#000000", light: "#ffffff" },
    });
    return { body, contentType: "image/png" };
  }
  if (req.qrImageUrl) {
    const res = await fetch(req.qrImageUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`Could not fetch QR image (${res.status})`);
    return {
      body: Buffer.from(await res.arrayBuffer()),
      contentType: res.headers.get("content-type") || "image/png",
    };
  }
  throw new Error("This payment request has no QR");
}
