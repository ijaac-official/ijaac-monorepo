import {
  PDFDocument,
  PDFFont,
  PDFImage,
  PDFPage,
  StandardFonts,
  degrees,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  type Color,
} from "pdf-lib";
import {
  breakLines,
  drawLine,
  formatLongDate,
  monthName,
  paragraphs,
  textToWords,
  toWinAnsiLine,
  truncateToWidth,
  type Word,
} from "./text";
import { hasPdfHeader, inspectPdf } from "./validate";
import { isPng } from "./logo";

export interface TypesetAuthor {
  name: string;
  affiliation?: string;
  email?: string;
  isCorresponding?: boolean;
}

export interface TypesetCoverInput {
  title: string;
  authors: TypesetAuthor[];
  abstract: string;
  keywords: string[];
  volume?: string;
  issueNumber?: string;
  year?: number;
  /** 1-12; with `year` it prints "November 2026" in the masthead */
  month?: number;
  articleNumber?: string;
  journalName?: string;
  publisherName?: string;
  receivedDate?: Date;
  acceptedDate?: Date;
  publishedDate?: Date;
  /** Optional PNG bytes for the masthead logo. Omitted or invalid = no logo. */
  logoPng?: Uint8Array;
}

export type TypesetFailureCode = "not-pdf" | "encrypted" | "unreadable" | "invalid-output" | "error";

export type TypesetResult =
  | { ok: true; pdf: Uint8Array; pageCount: number }
  | { ok: false; code: TypesetFailureCode; reason: string };

export class TypesetError extends Error {
  constructor(public code: TypesetFailureCode, message: string) {
    super(message);
    this.name = "TypesetError";
  }
}

const JOURNAL_NAME_DEFAULT = "International Journal of Applied AI & Computing";
const JOURNAL_ABBR = "IJAAC";
const PUBLISHER_DEFAULT = "IJAAC";

const A4: [number, number] = [595.28, 841.89];
const MARGIN_X = 62;
const TOP = A4[1] - 44;
const BOTTOM = 64; // keep clear of the footer band
const FOOTER_BAND = 30;
const COPYRIGHT = String.fromCharCode(0xa9); // WinAnsi-safe copyright sign

const crimson = rgb(0.478, 0.122, 0.169); // #7a1f2b
const gold = rgb(0.831, 0.627, 0.09); // #d4a017
const gray = rgb(0.38, 0.38, 0.38);
const ink = rgb(0.08, 0.08, 0.08);
const tint = rgb(0.985, 0.965, 0.955);

/**
 * Never-throwing typesetter. Builds the journal front matter, appends the
 * author's original pages, stamps a footer on every page and validates the
 * result. On any problem it returns `{ ok: false }` so the caller publishes
 * the original file unchanged instead of a corrupt one.
 *
 * Deliberately omitted: a DOI or ISSN line. Both require real registration
 * (Crossref, a national ISSN agency) - fabricating either would be
 * misleading, so only the internal article number is printed.
 */
export async function tryTypesetPdf(original: Uint8Array, input: TypesetCoverInput): Promise<TypesetResult> {
  try {
    return { ok: true, ...(await typeset(original, input)) };
  } catch (err) {
    if (err instanceof TypesetError) return { ok: false, code: err.code, reason: err.message };
    return { ok: false, code: "error", reason: (err as Error)?.message ?? String(err) };
  }
}

/** Throwing variant (kept for existing callers). Throws `TypesetError`. */
export async function buildTypesetPdf(original: Uint8Array, input: TypesetCoverInput): Promise<Uint8Array> {
  const result = await tryTypesetPdf(original, input);
  if (!result.ok) throw new TypesetError(result.code, result.reason);
  return result.pdf;
}

async function typeset(originalBytes: Uint8Array, input: TypesetCoverInput) {
  if (!hasPdfHeader(originalBytes)) {
    throw new TypesetError("not-pdf", "Source file is not a PDF (no %PDF header) - DOC/DOCX cannot be typeset");
  }

  let original: PDFDocument;
  try {
    original = await PDFDocument.load(originalBytes, { ignoreEncryption: true, updateMetadata: false });
  } catch (err) {
    throw new TypesetError("unreadable", `Source PDF could not be parsed: ${(err as Error).message}`);
  }
  // pdf-lib cannot decrypt. Copying pages out of an encrypted file yields
  // still-encrypted streams without the /Encrypt key = blank or garbled pages.
  if (original.isEncrypted) {
    throw new TypesetError("encrypted", "Source PDF is encrypted/password-protected; pages cannot be re-used");
  }
  if (original.getPageCount() < 1) throw new TypesetError("unreadable", "Source PDF has no pages");

  const output = await PDFDocument.create();
  output.setTitle(toWinAnsiLine(input.title) || "Article", { showInWindowTitleBar: true });
  output.setAuthor(input.authors.map((a) => toWinAnsiLine(a.name)).filter(Boolean).join(", "));
  output.setSubject(input.journalName ?? JOURNAL_NAME_DEFAULT);
  output.setKeywords(input.keywords.map(toWinAnsiLine).filter(Boolean));
  output.setProducer("IJAAC typesetting");
  output.setCreator("IJAAC");

  const fonts: Fonts = {
    sans: await output.embedFont(StandardFonts.Helvetica),
    sansBold: await output.embedFont(StandardFonts.HelveticaBold),
    sansItalic: await output.embedFont(StandardFonts.HelveticaOblique),
    serif: await output.embedFont(StandardFonts.TimesRoman),
    serifBold: await output.embedFont(StandardFonts.TimesRomanBold),
    serifItalic: await output.embedFont(StandardFonts.TimesRomanItalic),
  };

  let logo: PDFImage | undefined;
  if (isPng(input.logoPng)) {
    try {
      logo = await output.embedPng(input.logoPng);
    } catch {
      logo = undefined; // a bad logo must never block publishing
    }
  }

  const meta = buildMeta(input);
  drawFrontMatter(output, fonts, logo, meta, input);
  const frontMatterPages = output.getPageCount();

  let copied: PDFPage[];
  try {
    copied = await output.copyPages(original, original.getPageIndices());
  } catch (err) {
    throw new TypesetError("unreadable", `Could not copy pages from source PDF: ${(err as Error).message}`);
  }
  for (const page of copied) {
    output.addPage(page);
    isolateExistingContent(output, page);
  }

  const total = output.getPageCount();
  for (let i = 0; i < total; i++) {
    drawFooter(output.getPage(i), fonts, meta, i + 1, total, i < frontMatterPages);
  }

  const pdf = await output.save({ useObjectStreams: false });
  const check = await inspectPdf(pdf);
  if (!check.ok || check.pageCount !== total) {
    throw new TypesetError("invalid-output", `Typeset output failed validation: ${check.reason ?? "page count mismatch"}`);
  }
  return { pdf, pageCount: total };
}

interface Fonts {
  sans: PDFFont;
  sansBold: PDFFont;
  sansItalic: PDFFont;
  serif: PDFFont;
  serifBold: PDFFont;
  serifItalic: PDFFont;
}

interface Meta {
  journalName: string;
  publisherName: string;
  year: number;
  monthYear?: string;
  articleLabel?: string;
  volumeIssue?: string;
  citation: string;
  shortCitation: string;
}

function buildMeta(input: TypesetCoverInput): Meta {
  const journalName = toWinAnsiLine(input.journalName) || JOURNAL_NAME_DEFAULT;
  const publisherName = toWinAnsiLine(input.publisherName) || PUBLISHER_DEFAULT;
  const ref = input.publishedDate ?? input.acceptedDate ?? new Date();
  const year = input.year ?? ref.getUTCFullYear();
  const month = input.month ?? (input.year ? undefined : ref.getUTCMonth() + 1);
  const monthYear = month ? `${monthName(month)} ${year}` : String(year);
  const article = toWinAnsiLine(input.articleNumber);
  const volume = toWinAnsiLine(input.volume);
  const issue = toWinAnsiLine(input.issueNumber);
  const volumeIssue = volume && issue ? `Volume ${volume}, Issue ${issue}` : volume ? `Volume ${volume}` : undefined;

  const names = input.authors.map((a) => toWinAnsiLine(a.name)).filter(Boolean);
  const title = toWinAnsiLine(input.title);
  const venue = [
    `${journalName} (${JOURNAL_ABBR})`,
    volume && issue ? `${volume}(${issue})` : volume,
    article ? `Article ${article}` : undefined,
    monthYear,
  ]
    .filter(Boolean)
    .join(", ");
  const citation = `${names.join(", ")}. ${title}. ${venue}.`;
  const shortAuthors = names.length > 2 ? `${names[0]} et al.` : names.join(" and ");
  const shortCitation = `${shortAuthors} (${year}). ${title}. ${JOURNAL_ABBR}${
    volume && issue ? ` ${volume}(${issue})` : ""
  }${article ? `, ${article}` : ""}.`;

  return {
    journalName,
    publisherName,
    year,
    monthYear,
    articleLabel: article ? `Article - ${article}` : undefined,
    volumeIssue,
    citation,
    shortCitation,
  };
}

// ---------------------------------------------------------------------------
// Front matter
// ---------------------------------------------------------------------------

class Flow {
  page!: PDFPage;
  y = 0;
  readonly width = A4[0];
  readonly contentWidth = A4[0] - MARGIN_X * 2;

  constructor(private doc: PDFDocument, private fonts: Fonts, private meta: Meta) {
    this.page = doc.addPage(A4);
    this.y = TOP;
  }

  /** Makes sure `height` points are available, starting a continuation page if not. */
  ensure(height: number) {
    if (this.y - height >= BOTTOM) return;
    this.page = this.doc.addPage(A4);
    this.y = TOP;
    const label = [this.meta.journalName, this.meta.articleLabel].filter(Boolean).join("  |  ");
    this.page.drawText(label, { x: MARGIN_X, y: this.y, size: 8, font: this.fonts.sansItalic, color: gray });
    this.y -= 8;
    this.rule(crimson, 0.6);
    this.y -= 18;
  }

  rule(color: Color, thickness: number, inset = 0) {
    this.page.drawLine({
      start: { x: MARGIN_X + inset, y: this.y },
      end: { x: this.width - MARGIN_X - inset, y: this.y },
      thickness,
      color,
    });
  }

  /** Lays out words and draws them line by line with page breaks as needed. */
  words(words: Word[], opts: { leading: number; align: "left" | "center" | "justify"; inset?: number }) {
    const inset = opts.inset ?? 0;
    const maxWidth = this.contentWidth - inset * 2;
    for (const line of breakLines(words, maxWidth)) {
      this.ensure(opts.leading);
      this.y -= opts.leading;
      drawLine(this.page, line, MARGIN_X + inset, this.y + opts.leading * 0.25, maxWidth, opts.align);
    }
  }
}

function drawFrontMatter(doc: PDFDocument, f: Fonts, logo: PDFImage | undefined, meta: Meta, input: TypesetCoverInput) {
  const flow = new Flow(doc, f, meta);
  const page = flow.page;
  const cx = flow.width / 2;

  // --- Masthead (centered) ------------------------------------------------
  if (logo) {
    const h = 52;
    const w = (logo.width / logo.height) * h;
    page.drawImage(logo, { x: cx - w / 2, y: flow.y - h, width: w, height: h });
    flow.y -= h + 14;
  } else {
    flow.y -= 4;
  }
  flow.words(textToWords(meta.journalName, f.sansBold, 15, crimson, flow.contentWidth), { leading: 18, align: "center" });
  flow.y -= 2;
  const metaLine = [meta.articleLabel, meta.volumeIssue, meta.monthYear].filter(Boolean).join("   |   ");
  flow.words(textToWords(metaLine, f.sans, 9, gray, flow.contentWidth), { leading: 13, align: "center" });
  flow.words(textToWords("Open Access - Licensed under CC BY 4.0", f.sansItalic, 8, gold, flow.contentWidth), {
    leading: 11,
    align: "center",
  });
  flow.y -= 8;
  flow.rule(crimson, 1.4);
  flow.y -= 2.5;
  flow.rule(gold, 0.7);
  flow.y -= 18;

  // --- Title ----------------------------------------------------------------
  const title = toWinAnsiLine(input.title) || "Untitled";
  flow.words(textToWords(title, f.serifBold, 18, ink, flow.contentWidth - 40), { leading: 23, align: "center", inset: 20 });
  flow.y -= 10;

  // --- Authors + numbered affiliations ---------------------------------------
  const authors = input.authors
    .map((a) => ({ ...a, name: toWinAnsiLine(a.name), affiliation: toWinAnsiLine(a.affiliation) }))
    .filter((a) => a.name);
  const affiliations = Array.from(new Set(authors.map((a) => a.affiliation).filter(Boolean)));
  const corresponding = authors.find((a) => a.isCorresponding && a.email);

  const authorWords: Word[] = [];
  authors.forEach((a, i) => {
    const nameParts = a.name.split(/\s+/);
    const sup = [
      a.affiliation ? String(affiliations.indexOf(a.affiliation) + 1) : "",
      a === corresponding ? "*" : "",
    ].join("");
    nameParts.forEach((part, j) => {
      const lastPart = j === nameParts.length - 1;
      const word: Word = { parts: [{ text: part, font: f.serif, size: 12, color: ink }] };
      if (lastPart && sup) word.parts.push({ text: sup, font: f.serif, size: 7.5, color: crimson, rise: 4.5 });
      if (lastPart && i < authors.length - 1) word.parts.push({ text: ",", font: f.serif, size: 12, color: ink });
      authorWords.push(word);
    });
  });
  if (authorWords.length) flow.words(authorWords, { leading: 16, align: "center" });
  flow.y -= 4;

  affiliations.forEach((aff, i) => {
    const words = textToWords(aff, f.serifItalic, 9.5, gray, flow.contentWidth - 40);
    words.unshift({ parts: [{ text: String(i + 1), font: f.serif, size: 6.5, color: crimson, rise: 3.5 }], noSpaceAfter: true });
    flow.words(words, { leading: 12.5, align: "center", inset: 20 });
  });
  if (corresponding?.email) {
    const email = toWinAnsiLine(corresponding.email);
    flow.words(textToWords(`* Corresponding author: ${email}`, f.serifItalic, 9, gray, flow.contentWidth), {
      leading: 12.5,
      align: "center",
    });
  }
  flow.y -= 8;

  // --- Dates -------------------------------------------------------------------
  const dates = [
    input.receivedDate && `Received: ${formatLongDate(input.receivedDate)}`,
    input.acceptedDate && `Accepted: ${formatLongDate(input.acceptedDate)}`,
    input.publishedDate && `Published: ${formatLongDate(input.publishedDate)}`,
  ].filter(Boolean) as string[];
  if (dates.length) {
    flow.words(textToWords(dates.join("   |   "), f.sans, 8.5, gray, flow.contentWidth), { leading: 12, align: "center" });
    flow.y -= 8;
  }
  flow.rule(rgb(0.8, 0.8, 0.8), 0.5);
  flow.y -= 18;

  // --- Abstract (fully justified) -------------------------------------------------
  flow.ensure(40);
  flow.page.drawText("ABSTRACT", { x: MARGIN_X, y: flow.y, size: 10, font: f.sansBold, color: crimson });
  flow.y -= 4;
  const paras = paragraphs(input.abstract);
  for (const para of paras.length ? paras : ["(No abstract provided.)"]) {
    flow.words(textToWords(para, f.serif, 10.5, ink, flow.contentWidth), { leading: 14, align: "justify" });
    flow.y -= 5;
  }
  flow.y -= 6;

  // --- Keywords ----------------------------------------------------------------------
  const keywords = input.keywords.map(toWinAnsiLine).filter(Boolean);
  if (keywords.length) {
    const words: Word[] = [{ parts: [{ text: "KEYWORDS:", font: f.sansBold, size: 9, color: crimson }] }];
    words.push(...textToWords(keywords.join("; "), f.serifItalic, 10, ink, flow.contentWidth));
    flow.words(words, { leading: 14, align: "left" });
    flow.y -= 14;
  }

  // --- How to cite box ----------------------------------------------------------
  const citeWords = textToWords(meta.citation, f.serif, 9, ink, flow.contentWidth - 24);
  const citeLines = breakLines(citeWords, flow.contentWidth - 24);
  const boxHeight = 24 + citeLines.length * 12;
  flow.ensure(boxHeight + 6);
  const boxTop = flow.y;
  flow.page.drawRectangle({
    x: MARGIN_X,
    y: boxTop - boxHeight,
    width: flow.contentWidth,
    height: boxHeight,
    color: tint,
    borderColor: gold,
    borderWidth: 0.6,
  });
  flow.page.drawText("HOW TO CITE", { x: MARGIN_X + 12, y: boxTop - 14, size: 8, font: f.sansBold, color: crimson });
  let y = boxTop - 26;
  for (const line of citeLines) {
    drawLine(flow.page, line, MARGIN_X + 12, y, flow.contentWidth - 24, "left");
    y -= 12;
  }
  flow.y = boxTop - boxHeight - 14;

  if (flow.y > BOTTOM + 14) {
    const note = "The full text of the article follows.";
    const w = f.sansItalic.widthOfTextAtSize(note, 8);
    flow.page.drawText(note, { x: cx - w / 2, y: flow.y, size: 8, font: f.sansItalic, color: gray });
  }
}

// ---------------------------------------------------------------------------
// Original pages + footer
// ---------------------------------------------------------------------------

/**
 * Wraps the author's existing content streams in q ... Q so a transformation
 * matrix left dangling by the source PDF cannot move or scale our footer.
 */
function isolateExistingContent(doc: PDFDocument, page: PDFPage) {
  try {
    page.node.normalize();
    const start = doc.context.register(doc.context.contentStream([pushGraphicsState()]));
    const end = doc.context.register(doc.context.contentStream([popGraphicsState()]));
    page.node.wrapContentStreams(start, end);
  } catch {
    // page without a Contents entry - nothing to isolate
  }
}

/**
 * Draws in "visual" coordinates (what the reader sees, after /Rotate and
 * relative to the CropBox), so landscape/rotated author pages get an upright
 * footer along their visible bottom edge.
 */
function visualPainter(page: PDFPage) {
  const box = page.getCropBox();
  const r = (((page.getRotation().angle ?? 0) % 360) + 360) % 360;
  const { x: x0, y: y0, width: w, height: h } = box;
  const W = r === 90 || r === 270 ? h : w;
  const map = (u: number, v: number): { x: number; y: number } => {
    switch (r) {
      case 90:
        return { x: x0 + w - v, y: y0 + u };
      case 180:
        return { x: x0 + w - u, y: y0 + h - v };
      case 270:
        return { x: x0 + v, y: y0 + h - u };
      default:
        return { x: x0 + u, y: y0 + v };
    }
  };
  const rotate = degrees(r === 90 || r === 180 || r === 270 ? r : 0);
  return {
    width: W,
    text(text: string, u: number, v: number, font: PDFFont, size: number, color: Color) {
      const p = map(u, v);
      page.drawText(text, { x: p.x, y: p.y, size, font, color, rotate });
    },
    rect(u: number, v: number, rw: number, rh: number, color: Color) {
      const p = map(u, v);
      page.drawRectangle({ x: p.x, y: p.y, width: rw, height: rh, color, rotate });
    },
    line(u1: number, v1: number, u2: number, v2: number, thickness: number, color: Color) {
      page.drawLine({ start: map(u1, v1), end: map(u2, v2), thickness, color });
    },
  };
}

function drawFooter(page: PDFPage, f: Fonts, meta: Meta, pageNum: number, total: number, isFrontMatter: boolean) {
  const v = visualPainter(page);
  const margin = Math.min(MARGIN_X, v.width * 0.08);
  const right = v.width - margin;

  // White band so the footer stays legible over author content that runs low.
  if (!isFrontMatter) v.rect(0, 0, v.width, FOOTER_BAND, rgb(1, 1, 1));
  v.line(margin, FOOTER_BAND, right, FOOTER_BAND, 0.5, crimson);

  const pageLabel = `Page ${pageNum} of ${total}`;
  const pageLabelWidth = f.sansBold.widthOfTextAtSize(pageLabel, 7);
  v.text(pageLabel, right - pageLabelWidth, 19, f.sansBold, 7, crimson);

  const citation = truncateToWidth(meta.shortCitation, f.sans, 7, right - margin - pageLabelWidth - 14);
  v.text(citation, margin, 19, f.sans, 7, gray);

  const license = `${COPYRIGHT} ${meta.year} The Author(s). Open access under CC BY 4.0. Published by ${meta.publisherName}.`;
  v.text(truncateToWidth(license, f.sansItalic, 6.5, right - margin - 70), margin, 9.5, f.sansItalic, 6.5, gold);
  const site = "www.ijaac.in";
  v.text(site, right - f.sans.widthOfTextAtSize(site, 6.5), 9.5, f.sans, 6.5, gray);
}
