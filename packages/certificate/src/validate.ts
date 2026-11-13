import { PDFDocument } from "pdf-lib";

const HEADER = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"
const EOF = [0x25, 0x25, 0x45, 0x4f, 0x46]; // "%%EOF"

function indexOfSeq(bytes: Uint8Array, seq: number[], from: number, to: number): number {
  const end = Math.min(to, bytes.length - seq.length);
  outer: for (let i = Math.max(0, from); i <= end; i++) {
    for (let j = 0; j < seq.length; j++) if (bytes[i + j] !== seq[j]) continue outer;
    return i;
  }
  return -1;
}

/** "%PDF-" within the first 1 KB (the spec allows leading junk). */
export function hasPdfHeader(bytes: Uint8Array | undefined | null): boolean {
  return !!bytes && bytes.length > 8 && indexOfSeq(bytes, HEADER, 0, 1024) !== -1;
}

/** "%%EOF" within the last 2 KB. */
export function hasPdfEof(bytes: Uint8Array): boolean {
  return indexOfSeq(bytes, EOF, bytes.length - 2048, bytes.length) !== -1;
}

export interface PdfInspection {
  ok: boolean;
  pageCount: number;
  encrypted: boolean;
  reason?: string;
}

/**
 * Structural sanity check used before anything is written to S3 or attached
 * to an email: header, trailer marker, parseable by pdf-lib, at least one page.
 */
export async function inspectPdf(bytes: Uint8Array | undefined | null): Promise<PdfInspection> {
  if (!bytes || bytes.length < 64) return { ok: false, pageCount: 0, encrypted: false, reason: "empty" };
  if (!hasPdfHeader(bytes)) return { ok: false, pageCount: 0, encrypted: false, reason: "missing %PDF header" };
  if (!hasPdfEof(bytes)) return { ok: false, pageCount: 0, encrypted: false, reason: "missing %%EOF marker" };
  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
    const pageCount = doc.getPageCount();
    if (pageCount < 1) return { ok: false, pageCount, encrypted: doc.isEncrypted, reason: "no pages" };
    return { ok: true, pageCount, encrypted: doc.isEncrypted };
  } catch (err) {
    return { ok: false, pageCount: 0, encrypted: false, reason: `unparseable: ${(err as Error).message}` };
  }
}
