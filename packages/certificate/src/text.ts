import type { Color, PDFFont, PDFPage } from "pdf-lib";

// ---------------------------------------------------------------------------
// Text helpers shared by every generated PDF (certificate, typeset cover,
// receipt). pdf-lib's StandardFonts only encode WinAnsi (CP1252); drawing or
// even measuring a character outside it throws "WinAnsi cannot encode ...".
// Everything that ends up in a PDF must go through `toWinAnsi` first.
// ---------------------------------------------------------------------------

/** Characters CP1252 maps in the 0x80-0x9F range (beyond Latin-1). */
const CP1252_EXTRAS = new Set(
  "\u20ac\u201a\u0192\u201e\u2026\u2020\u2021\u02c6\u2030\u0160\u2039\u0152\u017d\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u02dc\u2122\u0161\u203a\u0153\u017e\u0178"
);

/**
 * Explicit replacements. Typographic quotes and dashes are mapped to plain
 * ASCII on purpose (house style: no em-dash anywhere), even though CP1252
 * could encode some of them.
 */
const REPLACEMENTS: Record<string, string> = {
  "\u2018": "'", "\u2019": "'", "\u201a": "'", "\u201b": "'", "\u2032": "'", "\u02bc": "'",
  "\u201c": '"', "\u201d": '"', "\u201e": '"', "\u201f": '"', "\u2033": '"', "\u00ab": '"', "\u00bb": '"',
  "\u2039": "'", "\u203a": "'",
  "\u2010": "-", "\u2011": "-", "\u2012": "-", "\u2013": "-", "\u2014": "-", "\u2015": "-", "\u2212": "-",
  "\u2043": "-", "\ufe58": "-", "\ufe63": "-", "\uff0d": "-",
  "\u2026": "...",
  "\u2022": "-", "\u00b7": "-", "\u2219": "-",
  "\u2264": "<=", "\u2265": ">=", "\u2260": "!=", "\u2248": "~", "\u2192": "->", "\u2190": "<-",
  "\u2194": "<->", "\u21d2": "=>", "\u221e": "infinity", "\u2211": "sum", "\u221a": "sqrt",
  "\u03b1": "alpha", "\u03b2": "beta", "\u03b3": "gamma", "\u03b4": "delta", "\u03b5": "epsilon",
  "\u03b8": "theta", "\u03bb": "lambda", "\u03bc": "mu", "\u03c0": "pi", "\u03c3": "sigma", "\u03c9": "omega",
  "\u0394": "Delta", "\u03a3": "Sigma", "\u03a9": "Omega",
  "\ufb00": "ff", "\ufb01": "fi", "\ufb02": "fl", "\ufb03": "ffi", "\ufb04": "ffl", "\ufb05": "st", "\ufb06": "st",
  "\u0131": "i", "\u0141": "L", "\u0142": "l", "\u0110": "D", "\u0111": "d",
  "\u20b9": "INR ", "\u2122": "(TM)",
  "\u00a0": " ", "\u2002": " ", "\u2003": " ", "\u2009": " ", "\u200a": " ", "\u202f": " ", "\u3000": " ",
  "\u200b": "", "\u200c": "", "\u200d": "", "\u2060": "", "\ufeff": "", "\u00ad": "",
};

function isWinAnsi(ch: string): boolean {
  const code = ch.codePointAt(0)!;
  if (code >= 0x20 && code <= 0x7e) return true;
  if (code >= 0xa0 && code <= 0xff) return true;
  return CP1252_EXTRAS.has(ch);
}

/**
 * Converts arbitrary user text into something the standard PDF fonts can
 * encode: typographic punctuation becomes ASCII, accented letters outside
 * Latin-1 lose their accent (e.g. "o with double acute" -> "o"), control
 * characters become spaces, and anything else (CJK, emoji, ...) is dropped.
 * Newlines are preserved as "\n" so callers can split paragraphs.
 */
export function toWinAnsi(input: string | undefined | null): string {
  if (!input) return "";
  let out = "";
  for (const ch of input.normalize("NFC")) {
    if (ch === "\n") {
      out += "\n";
      continue;
    }
    if (ch === "\r") continue;
    const code = ch.codePointAt(0)!;
    if (code < 0x20 || (code >= 0x7f && code < 0xa0)) {
      out += " ";
      continue;
    }
    if (ch in REPLACEMENTS) {
      out += REPLACEMENTS[ch];
      continue;
    }
    if (isWinAnsi(ch)) {
      out += ch;
      continue;
    }
    // Try stripping combining marks (e.g. o-double-acute -> "o").
    const base = ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (base && base !== ch && [...base].every(isWinAnsi)) {
      out += base;
      continue;
    }
    // Unsupported glyph: drop it.
  }
  return out
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
}

/** Single-line variant: also folds newlines into spaces. */
export function toWinAnsiLine(input: string | undefined | null): string {
  return toWinAnsi(input).replace(/\s*\n\s*/g, " ").trim();
}

/** Splits sanitized text into paragraphs on blank lines; single newlines become spaces. */
export function paragraphs(text: string): string[] {
  return toWinAnsi(text)
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Rich-text layout: a "word" is an unbreakable run made of one or more parts
// (e.g. an author name followed by a superscript affiliation number).
// ---------------------------------------------------------------------------

export interface TextPart {
  text: string;
  font: PDFFont;
  size: number;
  color: Color;
  /** Baseline shift (positive = up), for superscripts. */
  rise?: number;
}

export interface Word {
  parts: TextPart[];
  /** Join to the next word without a space (used for ", " separators that are their own part). */
  noSpaceAfter?: boolean;
}

export interface Line {
  words: Word[];
  /** True for the final line of a paragraph (never justified). */
  last: boolean;
}

export function wordWidth(w: Word): number {
  return w.parts.reduce((sum, p) => sum + p.font.widthOfTextAtSize(p.text, p.size), 0);
}

function spaceWidth(w: Word): number {
  const p = w.parts[0];
  return p.font.widthOfTextAtSize(" ", p.size);
}

function naturalWidth(words: Word[]): number {
  let width = 0;
  words.forEach((w, i) => {
    width += wordWidth(w);
    if (i < words.length - 1 && !w.noSpaceAfter) width += spaceWidth(w);
  });
  return width;
}

/** Turns plain text into single-part words. Over-long words are hard-broken. */
export function textToWords(text: string, font: PDFFont, size: number, color: Color, maxWidth: number): Word[] {
  const words: Word[] = [];
  for (const raw of text.split(/\s+/).filter(Boolean)) {
    if (font.widthOfTextAtSize(raw, size) <= maxWidth) {
      words.push({ parts: [{ text: raw, font, size, color }] });
      continue;
    }
    let chunk = "";
    for (const ch of raw) {
      if (chunk && font.widthOfTextAtSize(chunk + ch, size) > maxWidth) {
        words.push({ parts: [{ text: chunk, font, size, color }], noSpaceAfter: true });
        chunk = "";
      }
      chunk += ch;
    }
    if (chunk) words.push({ parts: [{ text: chunk, font, size, color }] });
  }
  return words;
}

/** Greedy line breaking. */
export function breakLines(words: Word[], maxWidth: number): Line[] {
  const lines: Line[] = [];
  let current: Word[] = [];
  for (const word of words) {
    const candidate = [...current, word];
    if (current.length && naturalWidth(candidate) > maxWidth) {
      lines.push({ words: current, last: false });
      current = [word];
    } else {
      current = candidate;
    }
  }
  if (current.length) lines.push({ words: current, last: true });
  return lines;
}

export type Align = "left" | "center" | "justify";

/** Draws one laid-out line. `x` is the left edge of the text column. */
export function drawLine(page: PDFPage, line: Line, x: number, y: number, maxWidth: number, align: Align) {
  const { words } = line;
  if (!words.length) return;
  const natural = naturalWidth(words);
  let cursor = x;
  let extraPerGap = 0;

  if (align === "center") {
    cursor = x + (maxWidth - natural) / 2;
  } else if (align === "justify" && !line.last) {
    const gaps = words.slice(0, -1).filter((w) => !w.noSpaceAfter).length;
    if (gaps > 0) extraPerGap = Math.max(0, maxWidth - natural) / gaps;
  }

  words.forEach((word, i) => {
    for (const part of word.parts) {
      page.drawText(part.text, {
        x: cursor,
        y: y + (part.rise ?? 0),
        size: part.size,
        font: part.font,
        color: part.color,
      });
      cursor += part.font.widthOfTextAtSize(part.text, part.size);
    }
    if (i < words.length - 1 && !word.noSpaceAfter) cursor += spaceWidth(word) + extraPerGap;
  });
}

/** Simple wrap for plain single-font text, returning strings. */
export function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Shortens text with "..." until it fits in maxWidth. */
export function truncateToWidth(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (font.widthOfTextAtSize(text.slice(0, mid).trimEnd() + "...", size) <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, lo).trimEnd() + "...";
}

export function centerText(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  y: number,
  color: Color,
  centerX = page.getWidth() / 2
) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: centerX - width / 2, y, size, font, color });
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function monthName(month: number): string {
  return MONTHS[(month - 1 + 12) % 12];
}

/** "13 November 2026" (UTC, locale-independent so server output is stable). */
export function formatLongDate(date: Date): string {
  return `${date.getUTCDate()} ${monthName(date.getUTCMonth() + 1)} ${date.getUTCFullYear()}`;
}
