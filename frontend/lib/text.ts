/**
 * Normalises free-text bios for clean justified display:
 * - blank lines separate paragraphs; single line breaks inside a paragraph
 *   become spaces (a hard break leaves a short, unjustified line)
 * - runs of whitespace collapse to one space, so word gaps stay even
 * - adds the missing space after "," / ";" / ":" and after a "." that is
 *   followed by a capital letter (e.g. "applications,Android", "Dr.Jitendra")
 */
export function bioParagraphs(bio?: string | null): string[] {
  if (!bio) return [];
  return bio
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((p) =>
      p
        .replace(/\s+/g, " ")
        .replace(/([,;:])(?=[A-Za-z])/g, "$1 ")
        .replace(/\.(?=[A-Z][a-z])/g, ". ")
        .trim()
    )
    .filter(Boolean);
}

/** Single-paragraph version for short previews (cards). */
export function bioText(bio?: string | null): string {
  return bioParagraphs(bio).join(" ");
}

/**
 * Body-text setting for the website - left aligned (ragged right), the
 * standard for on-screen reading used by Springer, Nature, IEEE and others
 * and recommended by WCAG 1.4.8:
 * - every word space is the font's normal space, so spacing is always equal
 *   (justified text stretches spaces unevenly, worst on phones)
 * - `text-wrap: pretty` balances line endings so the right edge stays tidy
 *   and no paragraph ends on a single word
 * - readable measure of at most ~72 characters per line
 * - the typeface's designed letter and word spacing, no hyphenation
 * Typeset PDFs (papers, certificates) stay fully justified - print layout.
 * Name kept for compatibility with existing imports.
 */
export const JUSTIFIED_SX = {
  textAlign: "left",
  textWrap: "pretty",
  hyphens: "manual",
  WebkitHyphens: "manual",
  wordSpacing: "normal",
  letterSpacing: "normal",
  overflowWrap: "break-word",
  maxWidth: "72ch",
} as const;

/** Line heights used for long-form text. */
export const PROSE_LINE_HEIGHT = { body1: 1.7, body2: 1.65 } as const;

/**
 * Container styles for long-form pages with mixed content (headings, links
 * inside paragraphs): justifies every body1/body2 paragraph (`<p>`) inside,
 * keeps centred paragraphs centred, and adds the same inner padding as bios.
 * Headings, captions, buttons, chips and list items are not `<p>` body
 * paragraphs, so they keep their own alignment.
 */
export const PROSE_SX = {
  px: { xs: 0.5, md: 1.5 },
  minWidth: 0,
  "& p.MuiTypography-body1:not(.MuiTypography-alignCenter)": {
    ...JUSTIFIED_SX,
    lineHeight: PROSE_LINE_HEIGHT.body1,
  },
  "& p.MuiTypography-body2:not(.MuiTypography-alignCenter)": {
    ...JUSTIFIED_SX,
    lineHeight: PROSE_LINE_HEIGHT.body2,
  },
} as const;
