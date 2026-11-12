import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

export interface CertificateInput {
  certificateId: string;
  authorName: string;
  paperTitle: string;
  journalName?: string;
  volume?: string;
  issueNumber?: string;
  issuedDate?: Date;
}

const JOURNAL_NAME_DEFAULT = "International Journal of Applied AI & Computing (IJAAC)";

/** Generates a one-page landscape certificate of publication as PDF bytes. */
export async function generateCertificatePdf(input: CertificateInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([841.89, 595.28]); // landscape A4
  const { width, height } = page.getSize();

  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

  const navy = rgb(0.05, 0.17, 0.31);
  const gold = rgb(0.72, 0.53, 0.04);

  // Outer border
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: navy,
    borderWidth: 3,
  });
  page.drawRectangle({
    x: 36,
    y: 36,
    width: width - 72,
    height: height - 72,
    borderColor: gold,
    borderWidth: 1,
  });

  const journalName = input.journalName ?? JOURNAL_NAME_DEFAULT;
  centerText(page, journalName, bold, 22, height - 110, navy);
  centerText(page, "CERTIFICATE OF PUBLICATION", bold, 30, height - 160, gold);

  centerText(page, "This is to certify that", regular, 14, height - 220, navy);
  centerText(page, input.authorName, bold, 24, height - 255, navy);
  centerText(page, "has successfully published the research paper titled", regular, 14, height - 295, navy);

  const titleLines = wrapText(input.paperTitle, italic, 16, width - 160);
  let y = height - 330;
  for (const line of titleLines) {
    centerText(page, line, italic, 16, y, navy);
    y -= 22;
  }

  const issueLine =
    input.volume && input.issueNumber
      ? `in ${journalName}, Volume ${input.volume}, Issue ${input.issueNumber}.`
      : `in ${journalName}.`;
  centerText(page, issueLine, regular, 14, y - 14, navy);

  const issuedDate = input.issuedDate ?? new Date();
  const dateStr = issuedDate.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  page.drawText(`Date of Issue: ${dateStr}`, { x: 70, y: 90, size: 11, font: regular, color: navy });
  page.drawText(`Certificate ID: ${input.certificateId}`, {
    x: 70,
    y: 72,
    size: 11,
    font: regular,
    color: navy,
  });

  const signatureX = width - 260;
  page.drawLine({
    start: { x: signatureX, y: 100 },
    end: { x: width - 70, y: 100 },
    thickness: 1,
    color: navy,
  });
  page.drawText("Editor-in-Chief", { x: signatureX + 55, y: 82, size: 12, font: bold, color: navy });

  return doc.save();
}

function centerText(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  y: number,
  color: ReturnType<typeof rgb>
) {
  const width = font.widthOfTextAtSize(text, size);
  const pageWidth = page.getWidth();
  page.drawText(text, { x: (pageWidth - width) / 2, y, size, font, color });
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
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
