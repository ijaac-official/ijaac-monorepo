import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { toWinAnsiLine } from "./text";

export interface ReceiptInput {
  receiptNumber: string;
  paidAt: Date;
  payerName: string;
  payerEmail: string;
  submissionId: string;
  paperTitle: string;
  baseAmountPaise: number;
  discountPercent?: number;
  couponCode?: string;
  amountPaidPaise: number;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  journalName?: string;
  contactEmail?: string;
  /** Line-item description. Defaults to "Manuscript submission & processing fee". */
  itemLabel?: string;
  /** Heading above the title. Defaults to "Manuscript". */
  titleLabel?: string;
}

const crimson = rgb(0.48, 0.12, 0.17);
const gold = rgb(0.83, 0.63, 0.09);
const gray = rgb(0.35, 0.35, 0.35);
const ink = rgb(0.1, 0.1, 0.1);
const M = 54;

// WinAnsi (standard fonts) has no rupee glyph, so amounts print as "INR".
const inr = (paise: number) =>
  `INR ${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export async function generateReceiptPdf(raw: ReceiptInput): Promise<Uint8Array> {
  // Payer names / titles may contain characters the standard fonts cannot encode.
  const input: ReceiptInput = {
    ...raw,
    payerName: toWinAnsiLine(raw.payerName),
    payerEmail: toWinAnsiLine(raw.payerEmail),
    paperTitle: toWinAnsiLine(raw.paperTitle),
    couponCode: raw.couponCode ? toWinAnsiLine(raw.couponCode) : raw.couponCode,
    journalName: raw.journalName ? toWinAnsiLine(raw.journalName) : raw.journalName,
  };
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const { width } = page.getSize();
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  const journalName = input.journalName ?? "International Journal of Applied AI & Computing (IJAAC)";

  page.drawRectangle({ x: 0, y: 841.89 - 8, width, height: 8, color: crimson });

  let y = 841.89 - 70;
  page.drawText(journalName, { x: M, y, size: 13, font: bold, color: crimson });
  y -= 30;
  page.drawText("PAYMENT RECEIPT", { x: M, y, size: 22, font: bold, color: ink });
  y -= 10;
  page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 1.5, color: gold });
  y -= 28;

  const meta: [string, string][] = [
    ["Receipt No.", input.receiptNumber],
    ["Date", input.paidAt.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })],
    ["Billed To", input.payerName],
    ["Email", input.payerEmail],
    ["Submission ID", input.submissionId],
  ];
  for (const [label, value] of meta) {
    row(page, label, value, y, regular, bold);
    y -= 18;
  }

  y -= 6;
  page.drawText(input.titleLabel ?? "Manuscript", { x: M, y, size: 10, font: bold, color: gray });
  y -= 15;
  for (const line of wrap(input.paperTitle, regular, 11, width - M * 2)) {
    page.drawText(line, { x: M, y, size: 11, font: regular, color: ink });
    y -= 15;
  }

  y -= 20;
  page.drawRectangle({ x: M, y: y - 4, width: width - M * 2, height: 22, color: rgb(0.96, 0.94, 0.92) });
  page.drawText("Description", { x: M + 8, y: y + 3, size: 10, font: bold, color: ink });
  drawRight(page, "Amount", width - M - 8, y + 3, bold, 10);
  y -= 26;

  page.drawText(input.itemLabel ?? "Manuscript submission & processing fee", { x: M + 8, y, size: 10.5, font: regular, color: ink });
  drawRight(page, inr(input.baseAmountPaise), width - M - 8, y, regular, 10.5);
  y -= 20;

  if (input.discountPercent && input.couponCode) {
    const discount = input.baseAmountPaise - input.amountPaidPaise;
    page.drawText(`Discount (${input.couponCode}, ${input.discountPercent}%)`, {
      x: M + 8,
      y,
      size: 10.5,
      font: regular,
      color: ink,
    });
    drawRight(page, `- ${inr(discount)}`, width - M - 8, y, regular, 10.5);
    y -= 20;
  }

  page.drawLine({ start: { x: M, y: y + 8 }, end: { x: width - M, y: y + 8 }, thickness: 0.5, color: gray });
  y -= 8;
  page.drawText("Total Paid", { x: M + 8, y, size: 12, font: bold, color: crimson });
  drawRight(page, inr(input.amountPaidPaise), width - M - 8, y, bold, 12);
  y -= 40;

  page.drawText("Payment Details", { x: M, y, size: 10, font: bold, color: gray });
  y -= 16;
  row(page, "Payment Method", "Razorpay", y, regular, bold);
  y -= 16;
  row(page, "Payment ID", input.razorpayPaymentId, y, regular, bold);
  y -= 16;
  row(page, "Order ID", input.razorpayOrderId, y, regular, bold);
  y -= 34;

  for (const line of wrap(
    "This fee is non-refundable once payment is confirmed, regardless of the editorial outcome. See our Refund & Cancellation Policy for details.",
    regular,
    9,
    width - M * 2
  )) {
    page.drawText(line, { x: M, y, size: 9, font: regular, color: gray });
    y -= 12;
  }

  page.drawLine({ start: { x: M, y: 50 }, end: { x: width - M, y: 50 }, thickness: 0.5, color: gray });
  page.drawText(`${journalName} | ${input.contactEmail ?? "ijaac.official@gmail.com"}`, {
    x: M,
    y: 36,
    size: 8,
    font: regular,
    color: gray,
  });
  page.drawText("This is a computer-generated receipt and does not require a signature.", {
    x: M,
    y: 24,
    size: 8,
    font: regular,
    color: gray,
  });

  return doc.save();
}

function row(page: PDFPage, label: string, value: string, y: number, regular: PDFFont, bold: PDFFont) {
  page.drawText(label, { x: M, y, size: 10, font: regular, color: gray });
  page.drawText(value, { x: M + 120, y, size: 10, font: bold, color: ink });
}

function drawRight(page: PDFPage, text: string, rightX: number, y: number, font: PDFFont, size: number) {
  page.drawText(text, { x: rightX - font.widthOfTextAtSize(text, size), y, size, font, color: ink });
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}
