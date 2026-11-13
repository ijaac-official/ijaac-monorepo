import {
  PDFDocument,
  PDFFont,
  PDFImage,
  PDFPage,
  StandardFonts,
  concatTransformationMatrix,
  degrees,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  type Color,
} from "pdf-lib";
import { centerText, formatLongDate, monthName, toWinAnsiLine, truncateToWidth, wrapText } from "./text";
import { isPng } from "./logo";

export interface CertificateInput {
  /** Credential id printed on the certificate, e.g. "<submissionId>-1" (see authorCredentialId). */
  certificateId: string;
  authorName: string;
  affiliation?: string;
  paperTitle: string;
  journalName?: string;
  volume?: string;
  issueNumber?: string;
  /** 1-12 */
  month?: number;
  year?: number;
  articleNumber?: string;
  issuedDate?: Date;
  /** Full verification URL; printed as "Verify at <url>". */
  verifyUrl?: string;
  /** Optional PNG logo bytes (top center). */
  logoPng?: Uint8Array;
  /**
   * Optional PNG of the Editor-in-Chief seal (square, transparent). When
   * absent a vector seal is drawn instead.
   */
  stampPng?: Uint8Array;
  /**
   * Optional full-bleed background artwork (landscape PNG). Drawn at
   * `backgroundOpacity`; when absent a procedural AI motif is drawn.
   */
  backgroundPng?: Uint8Array;
  /** Opacity for `backgroundPng` (0-1). Default 0.12. */
  backgroundOpacity?: number;
  /** Editor-in-Chief name. Printed under the signature line (or above it when there is no signature image). */
  editorInChiefName?: string;
  /** Optional transparent PNG of the Editor-in-Chief's handwritten signature, drawn above the line. */
  signaturePng?: Uint8Array;
}

const JOURNAL_NAME_DEFAULT = "International Journal of Applied AI & Computing";

const crimson = rgb(0.478, 0.122, 0.169);
const gold = rgb(0.831, 0.627, 0.09);
const ink = rgb(0.12, 0.12, 0.12);
const gray = rgb(0.4, 0.4, 0.4);
const cream = rgb(0.995, 0.985, 0.965);

const PAGE_W = 841.89;
const PAGE_H = 595.28;
/** Inner (gold) frame inset. */
const FRAME = 32;

/** One-page landscape A4 certificate of publication for a single author. */
export async function generateCertificatePdf(input: CertificateInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const { width, height } = page.getSize();
  const cx = width / 2;

  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const serifBoldItalic = await doc.embedFont(StandardFonts.TimesRomanBoldItalic);

  const journalName = toWinAnsiLine(input.journalName) || JOURNAL_NAME_DEFAULT;
  const authorName = toWinAnsiLine(input.authorName) || "Author";
  const affiliation = toWinAnsiLine(input.affiliation);
  const title = toWinAnsiLine(input.paperTitle) || "Untitled";
  const certificateId = toWinAnsiLine(input.certificateId);
  const editorName = toWinAnsiLine(input.editorInChiefName);
  doc.setTitle(`Certificate of Publication - ${authorName}`);
  doc.setAuthor(journalName);
  doc.setProducer("IJAAC");
  doc.setCreator("IJAAC");

  // ---- Background -------------------------------------------------------
  page.drawRectangle({ x: 0, y: 0, width, height, color: cream });
  const bg = await embedPngSafe(doc, input.backgroundPng);
  if (bg) {
    page.drawImage(bg, { x: 0, y: 0, width, height, opacity: clamp01(input.backgroundOpacity ?? 0.12) });
  } else {
    drawAiArtwork(page);
  }

  // ---- Frames -----------------------------------------------------------
  page.drawRectangle({ x: 22, y: 22, width: width - 44, height: height - 44, borderColor: crimson, borderWidth: 4 });
  page.drawRectangle({
    x: FRAME,
    y: FRAME,
    width: width - 2 * FRAME,
    height: height - 2 * FRAME,
    borderColor: gold,
    borderWidth: 1.2,
  });
  for (const [x, y] of [
    [FRAME, FRAME],
    [width - FRAME, FRAME],
    [FRAME, height - FRAME],
    [width - FRAME, height - FRAME],
  ]) {
    page.drawRectangle({ x: x - 5, y: y - 5, width: 10, height: 10, color: gold });
    page.drawRectangle({ x: x - 2, y: y - 2, width: 4, height: 4, color: crimson });
  }

  // ---- Header -----------------------------------------------------------
  let y = height - 48;
  const logo = await embedPngSafe(doc, input.logoPng);
  if (logo) {
    const h = 60;
    const w = (logo.width / logo.height) * h;
    page.drawImage(logo, { x: cx - w / 2, y: y - h, width: w, height: h });
    y -= h + 20;
  } else {
    y -= 28;
  }

  centerText(page, journalName.toUpperCase(), sansBold, fitSize(journalName.toUpperCase(), sansBold, 13, width - 200), y, crimson);
  y -= 36;
  centerText(page, "CERTIFICATE OF PUBLICATION", serifBold, 30, y, gold);
  y -= 13;
  drawOrnamentRule(page, cx, y, 130);
  y -= 12;

  // ---- Body (vertically centered between header and signature row) ----
  type Row =
    | { kind: "text"; text: string; font: PDFFont; size: number; color: Color; before: number }
    | { kind: "rule"; width: number; before: number };
  const rows: Row[] = [];
  const text = (t: string, font: PDFFont, size: number, color: Color, before: number) =>
    rows.push({ kind: "text", text: t, font, size, color, before });

  text("This is to certify that", serifItalic, 14, ink, 0);
  const nameSize = fitSize(authorName, serifBoldItalic, 30, width - 220, 14);
  const nameLine = truncateToWidth(authorName, serifBoldItalic, nameSize, width - 220);
  text(nameLine, serifBoldItalic, nameSize, crimson, nameSize + 8);
  rows.push({
    kind: "rule",
    width: Math.min(width - 260, Math.max(220, serifBoldItalic.widthOfTextAtSize(nameLine, nameSize) + 60)),
    before: 8,
  });
  if (affiliation) text(truncateToWidth(affiliation, serifItalic, 11, width - 260), serifItalic, 11, gray, 15);
  text("has authored the research paper titled", serif, 13, ink, affiliation ? 22 : 21);

  // Title: up to 3 lines, shrinking the font if necessary
  const titleWidth = width - 220;
  let titleSize = 16;
  let titleLines = wrapText(`"${title}"`, serifBoldItalic, titleSize, titleWidth);
  while (titleLines.length > 3 && titleSize > 11) {
    titleSize -= 0.5;
    titleLines = wrapText(`"${title}"`, serifBoldItalic, titleSize, titleWidth);
  }
  if (titleLines.length > 3) {
    titleLines = titleLines.slice(0, 3);
    titleLines[2] = truncateToWidth(titleLines[2].replace(/"$/, "") + " ...", serifBoldItalic, titleSize, titleWidth - 10)
      .replace(/(\.\.\.)?$/, '..."');
  }
  titleLines.forEach((line, i) => text(line, serifBoldItalic, titleSize, ink, i === 0 ? 25 : titleSize + 5));

  text("published in", serif, 12, ink, 26);
  const volume = toWinAnsiLine(input.volume);
  const issue = toWinAnsiLine(input.issueNumber);
  const article = toWinAnsiLine(input.articleNumber);
  const when = input.month && input.year ? `${monthName(input.month)} ${input.year}` : input.year ? String(input.year) : "";
  const venue = [volume && `Volume ${volume}`, issue && `Issue ${issue}`, when, article && `Article ${article}`]
    .filter(Boolean)
    .join("   \u00b7   ");
  text(journalName, serifBold, fitSize(journalName, serifBold, 13, width - 220), crimson, 17);
  if (venue) text(venue, sansBold, fitSize(venue, sansBold, 10, width - 220), gray, 17);

  // Rows are positioned by baseline; the block spans from the first cap height to the last baseline.
  const blockH = rows.reduce((h, r) => h + r.before, 0) + 14 * 0.7;
  const bodyTop = y; // baseline area below the header
  const bodyBottom = 172; // keep clear of the signature row
  let by = bodyTop - Math.max(0, (bodyTop - bodyBottom - blockH) / 2) - 14 * 0.7;
  for (const r of rows) {
    by -= r.before;
    if (r.kind === "text") centerText(page, r.text, r.font, r.size, by, r.color);
    else page.drawLine({ start: { x: cx - r.width / 2, y: by }, end: { x: cx + r.width / 2, y: by }, thickness: 0.6, color: gold });
  }

  // ---- Bottom: date (left), seal (center-right), signature (right) ------
  const lineY = 104;
  const blockW = 190;
  const leftC = 80 + blockW / 2;
  const rightC = width - 80 - blockW / 2;

  const issuedDate = input.issuedDate ?? new Date();
  centerText(page, formatLongDate(issuedDate), serif, 13, lineY + 7, ink, leftC);
  page.drawLine({ start: { x: leftC - blockW / 2, y: lineY }, end: { x: leftC + blockW / 2, y: lineY }, thickness: 0.8, color: ink });
  centerText(page, "Date of Issue", sansBold, 10.5, lineY - 15, crimson, leftC);

  const signature = await embedPngSafe(doc, input.signaturePng);
  if (signature) {
    // Handwritten signature sitting on the line, shifted right to clear the seal.
    const sigH = 40;
    const sigW = Math.min((signature.width / signature.height) * sigH, blockW - 50);
    const h = (sigW / signature.width) * signature.height;
    page.drawImage(signature, { x: rightC + 18 - sigW / 2, y: lineY - 4, width: sigW, height: h });
  } else if (editorName) {
    // Keep clear of the seal's right edge.
    const maxW = 2 * (blockW / 2 + 36 - 50 - 6);
    const s = fitSize(editorName, serifItalic, 13, maxW, 9);
    centerText(page, truncateToWidth(editorName, serifItalic, s, maxW), serifItalic, s, lineY + 7, ink, rightC);
  }
  page.drawLine({ start: { x: rightC - blockW / 2, y: lineY }, end: { x: rightC + blockW / 2, y: lineY }, thickness: 0.8, color: ink });
  if (signature && editorName) {
    const nameS = fitSize(editorName, sansBold, 10.5, blockW, 8);
    centerText(page, truncateToWidth(editorName, sansBold, nameS, blockW), sansBold, nameS, lineY - 15, crimson, rightC);
    centerText(page, "Editor-in-Chief, IJAAC", sans, 8.5, lineY - 27, gray, rightC);
  } else {
    centerText(page, "Editor-in-Chief", sansBold, 10.5, lineY - 15, crimson, rightC);
    centerText(page, "IJAAC", sans, 8, lineY - 27, gray, rightC);
  }

  // Seal just left of the signature line, overlapping its start like a real
  // stamp; drawn after the line so it sits on top.
  const sealC = { x: rightC - blockW / 2 - 36, y: lineY + 12 };
  const stamp = await embedPngSafe(doc, input.stampPng);
  if (stamp) {
    drawRasterStamp(page, stamp, sealC.x, sealC.y, 110, -8, 0.9);
  } else {
    drawVectorSeal(page, sealC.x, sealC.y, 50, -8, 0.85, { sansBold, serifBold });
  }

  // ---- Verification footer ---------------------------------------------
  const idLine = `Credential ID: ${certificateId}`;
  centerText(page, idLine, sans, fitSize(idLine, sans, 8.5, width - 200), 54, gray);
  if (input.verifyUrl) {
    const verify = `Verify at ${toWinAnsiLine(input.verifyUrl)}`;
    centerText(page, verify, sans, fitSize(verify, sans, 8.5, width - 160), 42, crimson);
  }

  return doc.save();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Measurable = { widthOfTextAtSize(t: string, s: number): number };

function fitSize(text: string, font: Measurable, size: number, maxWidth: number, min = 6) {
  let s = size;
  while (s > min && font.widthOfTextAtSize(text, s) > maxWidth) s -= 0.5;
  return s;
}

function clamp01(n: number) {
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.12;
}

async function embedPngSafe(doc: PDFDocument, bytes: Uint8Array | undefined): Promise<PDFImage | undefined> {
  if (!isPng(bytes)) return undefined;
  try {
    return await doc.embedPng(bytes);
  } catch {
    return undefined;
  }
}

/** Thin gold rule with a small crimson diamond in the middle. */
function drawOrnamentRule(page: PDFPage, cx: number, y: number, half: number) {
  page.drawLine({ start: { x: cx - half, y }, end: { x: cx - 9, y }, thickness: 0.8, color: crimson });
  page.drawLine({ start: { x: cx + 9, y }, end: { x: cx + half, y }, thickness: 0.8, color: crimson });
  page.drawSvgPath(`M ${cx - 6} ${-y} L ${cx} ${-(y + 4)} L ${cx + 6} ${-y} L ${cx} ${-(y - 4)} Z`, {
    x: 0,
    y: 0,
    color: gold,
  });
}

/** Deterministic PRNG so every certificate gets the identical artwork. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Procedural "applied AI" motif at low opacity: neural-network clusters in two
 * corners, circuit traces with pads in the other two, and a fading dot grid,
 * all kept toward the edges so the text area stays clean.
 */
function drawAiArtwork(page: PDFPage) {
  const W = page.getWidth();
  const H = page.getHeight();
  const rand = mulberry32(20261113);
  const corners: { x: number; y: number; sx: 1 | -1; sy: 1 | -1 }[] = [
    { x: FRAME, y: H - FRAME, sx: 1, sy: -1 }, // top-left
    { x: W - FRAME, y: H - FRAME, sx: -1, sy: -1 }, // top-right
    { x: FRAME, y: FRAME, sx: 1, sy: 1 }, // bottom-left
    { x: W - FRAME, y: FRAME, sx: -1, sy: 1 }, // bottom-right
  ];

  // Dot grid fading out from each corner.
  const step = 13;
  for (let gx = FRAME + 8; gx < W - FRAME - 4; gx += step) {
    for (let gy = FRAME + 8; gy < H - FRAME - 4; gy += step) {
      const d = Math.min(...corners.map((c) => Math.hypot(gx - c.x, gy - c.y)));
      if (d > 190) continue;
      const o = 0.12 * (1 - d / 190);
      page.drawCircle({ x: gx, y: gy, size: 0.75, color: gold, opacity: o });
    }
  }

  // Neural networks: top-left and bottom-right.
  for (const c of [corners[0], corners[3]]) {
    const layers = [5, 4, 4, 3, 2];
    const nodes: { x: number; y: number }[][] = layers.map((n, i) =>
      Array.from({ length: n }, (_, j) => ({
        x: c.x + c.sx * (26 + i * 40 + j * 6),
        y: c.y + c.sy * (24 + j * 30 + i * 9),
      }))
    );
    for (let i = 0; i < nodes.length - 1; i++) {
      for (const a of nodes[i]) {
        for (const b of nodes[i + 1]) {
          page.drawLine({ start: a, end: b, thickness: 0.55, color: crimson, opacity: 0.08 });
        }
      }
    }
    nodes.forEach((layer, i) =>
      layer.forEach((n) => {
        const r = i === 0 ? 3.2 : 4 - i * 0.3;
        page.drawCircle({ x: n.x, y: n.y, size: r + 2.2, borderColor: gold, borderWidth: 0.7, borderOpacity: 0.16 });
        page.drawCircle({ x: n.x, y: n.y, size: r, color: crimson, opacity: 0.1 });
      })
    );
  }

  // Circuit traces with pads: top-right and bottom-left.
  for (const c of [corners[1], corners[2]]) {
    const P = (u: number, v: number) => ({ x: c.x + c.sx * u, y: c.y + c.sy * v });
    const traces = 7;
    for (let k = 0; k < traces; k++) {
      const v0 = 18 + k * 14;
      const run1 = 24 + k * 10 + rand() * 10;
      const diag = 14 + rand() * 18;
      const run2 = 18 + rand() * 34;
      const pts = [P(4, v0), P(run1, v0), P(run1 + diag, v0 + diag), P(run1 + diag + run2, v0 + diag)];
      for (let i = 0; i < pts.length - 1; i++) {
        page.drawLine({ start: pts[i], end: pts[i + 1], thickness: 0.9, color: crimson, opacity: 0.1 });
      }
      const end = pts[pts.length - 1];
      page.drawCircle({ x: end.x, y: end.y, size: 2.8, borderColor: gold, borderWidth: 1, borderOpacity: 0.3 });
      page.drawCircle({ x: end.x, y: end.y, size: 1, color: gold, opacity: 0.3 });
      if (k % 2 === 0) {
        const via = pts[1];
        page.drawCircle({ x: via.x, y: via.y, size: 1.6, color: crimson, opacity: 0.16 });
      }
    }
    // Vertical traces from the other edge.
    for (let k = 0; k < 5; k++) {
      const u0 = 18 + k * 14;
      const run1 = 70 + k * 8 + rand() * 10;
      const diag = 12 + rand() * 14;
      const run2 = 20 + rand() * 30;
      const pts = [P(u0, 4), P(u0, 0 + run1), P(u0 + diag, run1 + diag), P(u0 + diag, run1 + diag + run2)];
      for (let i = 0; i < pts.length - 1; i++) {
        page.drawLine({ start: pts[i], end: pts[i + 1], thickness: 0.9, color: crimson, opacity: 0.09 });
      }
      const end = pts[pts.length - 1];
      page.drawCircle({ x: end.x, y: end.y, size: 2.6, borderColor: gold, borderWidth: 1, borderOpacity: 0.28 });
    }
    // A small "chip" with pins.
    const chip = P(178, 20);
    const cw = 34;
    const ch = 22;
    const cxl = c.sx > 0 ? chip.x : chip.x - cw;
    const cyl = c.sy > 0 ? chip.y : chip.y - ch;
    page.drawRectangle({ x: cxl, y: cyl, width: cw, height: ch, borderColor: crimson, borderWidth: 0.9, borderOpacity: 0.16, color: gold, opacity: 0.05 });
    for (let p = 0; p < 4; p++) {
      const px = cxl + 5 + p * 8;
      page.drawLine({ start: { x: px, y: cyl - 5 }, end: { x: px, y: cyl }, thickness: 0.9, color: crimson, opacity: 0.14 });
      page.drawLine({ start: { x: px, y: cyl + ch }, end: { x: px, y: cyl + ch + 5 }, thickness: 0.9, color: crimson, opacity: 0.14 });
    }
  }
}

/** Draws `img` (square) centered at (cx, cy), `size` wide, rotated by `angle` degrees. */
function drawRasterStamp(page: PDFPage, img: PDFImage, cx: number, cy: number, size: number, angle: number, opacity: number) {
  const w = size;
  const h = (img.height / img.width) * size;
  const t = (angle * Math.PI) / 180;
  // pdf-lib rotates around the image's bottom-left corner.
  const x = cx - ((w / 2) * Math.cos(t) - (h / 2) * Math.sin(t));
  const y = cy - ((w / 2) * Math.sin(t) + (h / 2) * Math.cos(t));
  page.drawImage(img, { x, y, width: w, height: h, rotate: degrees(angle), opacity });
}

/** Five-point star path (SVG coordinates; pdf-lib flips y for drawSvgPath). */
function starPath(x: number, y: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.42;
    pts.push(`${(x + rr * Math.cos(a)).toFixed(2)} ${(-(y + rr * Math.sin(a))).toFixed(2)}`);
  }
  return `M ${pts.join(" L ")} Z`;
}

/** Characters laid along a circle, centered on `centerAngle`, reading clockwise. */
function drawCircularText(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  radius: number,
  centerAngle: number,
  tracking: number,
  color: Color,
  opacity: number
) {
  const widths = [...text].map((ch) => font.widthOfTextAtSize(ch, size));
  const total = widths.reduce((s, w) => s + w, 0) + tracking * (widths.length - 1);
  let a = centerAngle + total / radius / 2; // radians, start at the left end
  [...text].forEach((ch, i) => {
    const w = widths[i];
    const mid = a - w / 2 / radius;
    const rot = mid - Math.PI / 2;
    const px = radius * Math.cos(mid) - (w / 2) * Math.cos(rot);
    const py = radius * Math.sin(mid) - (w / 2) * Math.sin(rot);
    if (ch !== " ") {
      page.drawText(ch, { x: px, y: py, size, font, color, opacity, rotate: degrees((rot * 180) / Math.PI) });
    }
    a -= (w + tracking) / radius;
  });
}

/**
 * Vector Editor-in-Chief seal: double ring, journal name around the band,
 * "IJAAC" / "EDITOR-IN-CHIEF" and a star row in the center.
 */
function drawVectorSeal(
  page: PDFPage,
  cx: number,
  cy: number,
  R: number,
  angle: number,
  opacity: number,
  fonts: { sansBold: PDFFont; serifBold: PDFFont }
) {
  const t = (angle * Math.PI) / 180;
  page.pushOperators(
    pushGraphicsState(),
    concatTransformationMatrix(Math.cos(t), Math.sin(t), -Math.sin(t), Math.cos(t), cx, cy)
  );
  const o = opacity;
  page.drawCircle({ x: 0, y: 0, size: R, color: rgb(1, 1, 1), opacity: 0.55 });
  page.drawCircle({ x: 0, y: 0, size: R, borderColor: crimson, borderWidth: 2.4, borderOpacity: o });
  page.drawCircle({ x: 0, y: 0, size: R - 4, borderColor: crimson, borderWidth: 0.7, borderOpacity: o });
  const inner = R * 0.64;
  page.drawCircle({ x: 0, y: 0, size: inner, borderColor: crimson, borderWidth: 1, borderOpacity: o });
  page.drawCircle({ x: 0, y: 0, size: inner - 2.5, borderColor: crimson, borderWidth: 0.4, borderOpacity: o });

  // Ring text: fill most of the band, leave a gap at the bottom for a star.
  const ring = "INTERNATIONAL JOURNAL OF APPLIED AI & COMPUTING";
  const band = (R - 4 + inner) / 2;
  const capH = 0.72;
  let size = 7.5;
  const tracking = 0.6;
  const arcLen = (s: number) =>
    [...ring].reduce((sum, ch) => sum + fonts.sansBold.widthOfTextAtSize(ch, s), 0) + tracking * (ring.length - 1);
  while (size > 4 && arcLen(size) > 2 * Math.PI * (band - (size * capH) / 2) * 0.84) size -= 0.1;
  const baseR = band - (size * capH) / 2;
  drawCircularText(page, ring, fonts.sansBold, size, baseR, Math.PI / 2, tracking, crimson, o);
  page.drawSvgPath(starPath(0, -band, 3.4), { x: 0, y: 0, color: crimson, opacity: o });

  // Center
  const ij = "IJAAC";
  const ijSize = R * 0.3;
  page.drawText(ij, {
    x: -fonts.serifBold.widthOfTextAtSize(ij, ijSize) / 2,
    y: -ijSize * 0.18,
    size: ijSize,
    font: fonts.serifBold,
    color: crimson,
    opacity: o,
  });
  const eic = "EDITOR-IN-CHIEF";
  const eicSize = fitSize(eic, fonts.sansBold, R * 0.11, inner * 1.5);
  page.drawText(eic, {
    x: -fonts.sansBold.widthOfTextAtSize(eic, eicSize) / 2,
    y: -ijSize * 0.18 - eicSize - 3.5,
    size: eicSize,
    font: fonts.sansBold,
    color: crimson,
    opacity: o,
  });
  page.drawLine({ start: { x: -inner * 0.62, y: ijSize * 0.86 }, end: { x: inner * 0.62, y: ijSize * 0.86 }, thickness: 0.5, color: crimson, opacity: o });
  for (let i = -2; i <= 2; i++) {
    page.drawSvgPath(starPath(i * 6.2, ijSize * 0.86 + 6, i === 0 ? 2.6 : 2), { x: 0, y: 0, color: crimson, opacity: o });
  }
  page.drawLine({ start: { x: -inner * 0.62, y: -ijSize * 0.18 - eicSize - 7.5 }, end: { x: inner * 0.62, y: -ijSize * 0.18 - eicSize - 7.5 }, thickness: 0.5, color: crimson, opacity: o });

  page.pushOperators(popGraphicsState());
}
