import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";

export interface TypesetCoverInput {
  title: string;
  authors: string[];
  abstract: string;
  keywords: string[];
  volume?: string;
  issueNumber?: string;
  journalName?: string;
}

const JOURNAL_NAME_DEFAULT = "International Journal of Applied AI & Computing (IJAAC)";

/**
 * Builds the journal's standard cover/title page and prepends it to the
 * author's original manuscript PDF - this is the practical "modularize into
 * our own template" step: we don't reflow the author's body content (that
 * needs manual typesetting or a LaTeX template), but every published paper
 * gets a consistent IJAAC title page, running header, and footer with page
 * numbers added over the original pages.
 */
export async function buildTypesetPdf(
  originalPdfBytes: Uint8Array,
  input: TypesetCoverInput
): Promise<Uint8Array> {
  const original = await PDFDocument.load(originalPdfBytes);
  const output = await PDFDocument.create();

  const bold = await output.embedFont(StandardFonts.HelveticaBold);
  const regular = await output.embedFont(StandardFonts.Helvetica);
  const navy = rgb(0.05, 0.17, 0.31);

  const cover = output.addPage([595.28, 841.89]); // A4 portrait
  const { width } = cover.getSize();
  const journalName = input.journalName ?? JOURNAL_NAME_DEFAULT;

  cover.drawText(journalName, { x: 50, y: 760, size: 14, font: bold, color: navy });
  cover.drawLine({ start: { x: 50, y: 750 }, end: { x: width - 50, y: 750 }, thickness: 1, color: navy });

  if (input.volume && input.issueNumber) {
    cover.drawText(`Volume ${input.volume}, Issue ${input.issueNumber}`, {
      x: 50,
      y: 730,
      size: 11,
      font: regular,
      color: navy,
    });
  }

  let y = 670;
  for (const line of wrapText(input.title, bold, 20, width - 100)) {
    cover.drawText(line, { x: 50, y, size: 20, font: bold, color: navy });
    y -= 28;
  }

  y -= 20;
  cover.drawText(input.authors.join(", "), { x: 50, y, size: 12, font: regular, color: navy });

  y -= 40;
  cover.drawText("Abstract", { x: 50, y, size: 12, font: bold, color: navy });
  y -= 20;
  for (const line of wrapText(input.abstract, regular, 11, width - 100).slice(0, 25)) {
    cover.drawText(line, { x: 50, y, size: 11, font: regular, color: navy });
    y -= 15;
  }

  y -= 15;
  cover.drawText(`Keywords: ${input.keywords.join(", ")}`, {
    x: 50,
    y,
    size: 11,
    font: regular,
    color: navy,
  });

  const originalPages = await output.copyPages(original, original.getPageIndices());
  originalPages.forEach((page) => output.addPage(page));

  const total = output.getPageCount();
  for (let i = 0; i < total; i++) {
    const page = output.getPage(i);
    page.drawText(`${journalName} - Page ${i + 1} of ${total}`, {
      x: 50,
      y: 20,
      size: 8,
      font: regular,
      color: navy,
    });
  }

  return output.save();
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
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
