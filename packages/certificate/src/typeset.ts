import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

export interface TypesetAuthor {
  name: string;
  affiliation?: string;
  email?: string;
}

export interface TypesetCoverInput {
  title: string;
  authors: TypesetAuthor[];
  abstract: string;
  keywords: string[];
  volume?: string;
  issueNumber?: string;
  year?: number;
  articleNumber?: string;
  journalName?: string;
  publisherName?: string;
  receivedDate?: Date;
  acceptedDate?: Date;
}

const JOURNAL_NAME_DEFAULT = "International Journal of Applied AI & Computing (IJAAC)";
const PUBLISHER_DEFAULT = "IJAAC Press";
const MARGIN = 54;

/**
 * Builds the journal's standard header/title page and prepends it to the
 * author's original manuscript PDF, then overlays a running header/footer
 * on every page (including the author's original pages). This is the
 * practical "modularize into our own template" step - we do not reflow the
 * author's body content (that needs manual typesetting or a LaTeX template),
 * but every published paper gets a consistent masthead, article metadata,
 * and copyright/license footer.
 *
 * Deliberately omitted: a DOI or ISSN line. Both require real registration
 * (Crossref, a national ISSN agency) - fabricating either would be
 * misleading, so this only prints an internal "Article ID" instead.
 */
export async function buildTypesetPdf(
  originalPdfBytes: Uint8Array,
  input: TypesetCoverInput
): Promise<Uint8Array> {
  const original = await PDFDocument.load(originalPdfBytes);
  const output = await PDFDocument.create();

  const bold = await output.embedFont(StandardFonts.HelveticaBold);
  const regular = await output.embedFont(StandardFonts.Helvetica);
  const italic = await output.embedFont(StandardFonts.HelveticaOblique);

  const navy = rgb(0.05, 0.17, 0.31);
  const gold = rgb(0.72, 0.53, 0.04);
  const gray = rgb(0.35, 0.35, 0.35);

  const journalName = input.journalName ?? JOURNAL_NAME_DEFAULT;
  const publisherName = input.publisherName ?? PUBLISHER_DEFAULT;
  const year = input.year ?? new Date().getFullYear();

  const cover = output.addPage([595.28, 841.89]); // A4 portrait
  const { width } = cover.getSize();
  let y = 841.89 - MARGIN;

  // --- Masthead -------------------------------------------------------
  cover.drawText(journalName, { x: MARGIN, y, size: 13, font: bold, color: navy });
  y -= 16;
  if (input.volume && input.issueNumber) {
    cover.drawText(`Volume ${input.volume}, Issue ${input.issueNumber} (${year})`, {
      x: MARGIN,
      y,
      size: 9.5,
      font: regular,
      color: gray,
    });
    y -= 13;
  }
  cover.drawText(`© ${year} The Author(s) | Published by - ${publisherName}`, {
    x: MARGIN,
    y,
    size: 9,
    font: regular,
    color: gray,
  });
  y -= 12;
  cover.drawText("Creative Commons Attribution 4.0 International License (CC BY 4.0)", {
    x: MARGIN,
    y,
    size: 9,
    font: italic,
    color: gold,
  });
  y -= 10;
  cover.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 1.2, color: navy });
  y -= 26;

  // --- Article label ----------------------------------------------------
  cover.drawText(`Article - ${input.articleNumber ?? "pending"}`, {
    x: MARGIN,
    y,
    size: 10,
    font: bold,
    color: navy,
  });
  y -= 30;

  // --- Title --------------------------------------------------------------
  for (const line of wrapText(input.title, bold, 18, width - MARGIN * 2)) {
    cover.drawText(line, { x: MARGIN, y, size: 18, font: bold, color: navy });
    y -= 24;
  }
  y -= 10;

  // --- Authors with numbered affiliations --------------------------------
  const affiliations = Array.from(new Set(input.authors.map((a) => a.affiliation).filter(Boolean))) as string[];
  const authorLine = input.authors
    .map((a) => {
      const idx = a.affiliation ? affiliations.indexOf(a.affiliation) + 1 : undefined;
      return idx ? `${a.name} (${idx})` : a.name;
    })
    .join(", ");
  for (const line of wrapText(authorLine, bold, 12, width - MARGIN * 2)) {
    cover.drawText(line, { x: MARGIN, y, size: 12, font: bold, color: navy });
    y -= 16;
  }
  y -= 4;
  affiliations.forEach((aff, i) => {
    cover.drawText(`(${i + 1}) ${aff}`, { x: MARGIN, y, size: 9.5, font: italic, color: gray });
    y -= 13;
  });
  y -= 8;

  const dateParts: string[] = [];
  if (input.receivedDate) dateParts.push(`Received: ${formatDate(input.receivedDate)}`);
  if (input.acceptedDate) dateParts.push(`Accepted: ${formatDate(input.acceptedDate)}`);
  if (dateParts.length) {
    cover.drawText(dateParts.join("     "), { x: MARGIN, y, size: 9.5, font: regular, color: gray });
    y -= 20;
  }

  // --- Abstract -------------------------------------------------------------
  cover.drawText("ABSTRACT", { x: MARGIN, y, size: 11, font: bold, color: navy });
  y -= 16;
  for (const line of wrapText(input.abstract, regular, 10.5, width - MARGIN * 2)) {
    if (y < 110) break; // leave room for keywords + emails; overflow is fine, body continues on original pages
    cover.drawText(line, { x: MARGIN, y, size: 10.5, font: regular, color: rgb(0.1, 0.1, 0.1) });
    y -= 14;
  }
  y -= 10;

  if (y > 70) {
    for (const line of wrapText(`KEYWORDS: ${input.keywords.join(", ")}`, bold, 10, width - MARGIN * 2)) {
      cover.drawText(line, { x: MARGIN, y, size: 10, font: bold, color: navy });
      y -= 13;
    }
  }

  const emails = input.authors.map((a) => a.email).filter(Boolean) as string[];
  if (emails.length && y > 40) {
    cover.drawText(`Email: ${emails.join(", ")}`, { x: MARGIN, y, size: 8.5, font: regular, color: gray });
  }

  // --- Append original manuscript pages --------------------------------------
  const originalPages = await output.copyPages(original, original.getPageIndices());
  originalPages.forEach((page) => output.addPage(page));

  // --- Running footer on every page --------------------------------------
  const total = output.getPageCount();
  for (let i = 0; i < total; i++) {
    const page = output.getPage(i);
    drawFooter(page, regular, italic, navy, gold, journalName, publisherName, year, i + 1, total);
  }

  return output.save();
}

function drawFooter(
  page: PDFPage,
  regular: PDFFont,
  italic: PDFFont,
  navy: ReturnType<typeof rgb>,
  gold: ReturnType<typeof rgb>,
  journalName: string,
  publisherName: string,
  year: number,
  pageNum: number,
  total: number
) {
  const { width } = page.getSize();
  page.drawLine({ start: { x: MARGIN, y: 36 }, end: { x: width - MARGIN, y: 36 }, thickness: 0.5, color: navy });
  page.drawText(`© ${year} The Author(s) | Published by - ${publisherName} | CC BY 4.0`, {
    x: MARGIN,
    y: 24,
    size: 7,
    font: italic,
    color: gold,
  });
  const pageLabel = `${journalName} - Page ${pageNum} of ${total}`;
  const labelWidth = regular.widthOfTextAtSize(pageLabel, 7);
  page.drawText(pageLabel, { x: width - MARGIN - labelWidth, y: 24, size: 7, font: regular, color: navy });
}

function formatDate(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
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
