import { emailLayout } from "./layout";

export function receiptEmailTemplate(
  paperTitle: string,
  amountLabel: string,
  receiptNumber: string
): { subject: string; html: string } {
  return {
    subject: `Payment receipt ${receiptNumber} - IJAAC submission fee`,
    html: emailLayout(
      "Payment Received",
      `<p>Dear Author,</p>
       <p>We have received your payment of <b>${escapeHtml(amountLabel)}</b> for the manuscript:</p>
       <p style="font-weight:bold;">${escapeHtml(paperTitle)}</p>
       <p>Your receipt (<b>${escapeHtml(receiptNumber)}</b>) is attached to this email as a PDF.</p>
       <p>Please note that submission fees are non-refundable once payment is confirmed.</p>
       <p>Regards,<br/>Editorial Office</p>`
    ),
  };
}

function escapeHtml(input: string): string {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
