import { getFromAddress, getTransporter } from "./transporter";
import { emailLayout } from "./templates/layout";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Address replies should go to - the editors' inbox, falling back to the sending account. */
function editorialAddress(): string | undefined {
  return process.env.EDITOR_NOTIFICATION_EMAIL || process.env.GMAIL_USER || undefined;
}

export interface PaymentRequestMailInput {
  to: string;
  customerName?: string;
  amountLabel: string;
  description: string;
  /** Payment Link URL - omitted for UPI QR requests, which are scan-only */
  payUrl?: string;
  /** PNG bytes of the QR code, embedded inline via CID and also attached */
  qrPng: Uint8Array;
  expiresAt?: string;
  /** "LINK" accepts UPI, cards, netbanking, wallets; "QR" is UPI only */
  kind: "LINK" | "QR";
}

const QR_CID = "ijaac-payment-qr";

export async function sendPaymentRequestEmail(input: PaymentRequestMailInput): Promise<void> {
  const greeting = input.customerName ? `Dear ${escapeHtml(input.customerName)},` : "Dear Sir/Madam,";
  const expiry = input.expiresAt
    ? `<p style="color:#8a8f98;font-size:12px;">This request is valid until ${escapeHtml(
        new Date(input.expiresAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })
      )} IST.</p>`
    : "";
  const methods =
    input.kind === "LINK"
      ? "You can pay using UPI, debit/credit card, netbanking or wallets."
      : "Scan the QR code below with any UPI app (Google Pay, PhonePe, Paytm, BHIM and others).";
  const button = input.payUrl
    ? `<p style="text-align:center;margin:24px 0;">
         <a href="${escapeHtml(input.payUrl)}" style="background:#7a1f2b;color:#ffffff;text-decoration:none;padding:12px 28px;font-weight:bold;display:inline-block;">Pay ${escapeHtml(input.amountLabel)}</a>
       </p>
       <p style="font-size:12px;color:#555;word-break:break-all;">Or open this link: <a href="${escapeHtml(input.payUrl)}" style="color:#7a1f2b;">${escapeHtml(input.payUrl)}</a></p>`
    : "";

  const html = emailLayout(
    "Payment Request",
    `<p>${greeting}</p>
     <p>The IJAAC editorial office has requested a payment of <b>${escapeHtml(input.amountLabel)}</b> for:</p>
     <p style="font-weight:bold;border-left:3px solid #d4a017;padding-left:10px;">${escapeHtml(input.description)}</p>
     <p>${methods}</p>
     ${button}
     <p style="text-align:center;margin:24px 0 8px;">
       <img src="cid:${QR_CID}" alt="Payment QR code" width="220" height="220" style="display:inline-block;border:1px solid #e0e0e0;padding:8px;background:#fff;" />
     </p>
     <p style="text-align:center;font-size:12px;color:#8a8f98;margin:0 0 16px;">Secure payments powered by Razorpay</p>
     ${expiry}
     <p>If you have already paid, please ignore this message.</p>
     <p>Regards,<br/>Editorial Office</p>`
  );

  const replyTo = editorialAddress();
  await getTransporter().sendMail({
    from: getFromAddress(),
    to: input.to,
    subject: `Payment request: ${input.amountLabel} - IJAAC`,
    html,
    ...(replyTo ? { replyTo } : {}),
    attachments: [
      {
        filename: "ijaac-payment-qr.png",
        content: Buffer.from(input.qrPng),
        contentType: "image/png",
        cid: QR_CID,
      },
    ],
  });
}
