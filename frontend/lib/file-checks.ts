// Pure (isomorphic) file checks for paper manuscripts and book cover images, shared
// by the submission forms and the upload / submission API routes.
import { MAX_BOOK_COVER_SIZE_BYTES, MAX_MANUSCRIPT_SIZE_BYTES } from "@ijaac/shared";
import {
  MANUSCRIPT_MIME,
  checkManuscriptBytes,
  checkManuscriptMeta,
  kindFromName,
} from "@/app/submit-paper/manuscript-checks";

export type UploadKind = "paper-manuscript" | "book-cover";
export const UPLOAD_KINDS: UploadKind[] = ["paper-manuscript", "book-cover"];

export type CoverKind = "jpg" | "png";
export const COVER_MIME: Record<CoverKind, string> = { jpg: "image/jpeg", png: "image/png" };
export const MAX_BOOK_COVER_MB = Math.round(MAX_BOOK_COVER_SIZE_BYTES / (1024 * 1024));

const GENERIC_MIME = new Set(["", "application/octet-stream", "binary/octet-stream"]);

export function coverKindFromName(name: string): CoverKind | null {
  const ext = name.trim().toLowerCase().split(".").pop() ?? "";
  if (ext === "jpg" || ext === "jpeg") return "jpg";
  if (ext === "png") return "png";
  return null;
}

/** FF D8 FF = JPEG, 89 50 4E 47 0D 0A 1A 0A = PNG */
export function detectCoverKind(bytes: Uint8Array): CoverKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && png.every((b, i) => bytes[i] === b)) return "png";
  return null;
}

export function checkCoverMeta(file: { name: string; size: number; type: string }): string | null {
  if (!file.name?.trim()) return "Please choose a cover image.";
  const byName = coverKindFromName(file.name);
  if (!byName) return "The cover must be a JPEG or PNG image.";
  const type = (file.type ?? "").trim().toLowerCase();
  if (!GENERIC_MIME.has(type)) {
    const byMime = type === "image/jpeg" || type === "image/jpg" ? "jpg" : type === "image/png" ? "png" : null;
    if (!byMime) return "The cover must be a JPEG or PNG image.";
    if (byMime !== byName) return "The cover image extension does not match its type.";
  }
  if (!Number.isFinite(file.size) || file.size <= 0) return "The cover image is empty.";
  if (file.size > MAX_BOOK_COVER_SIZE_BYTES) return `The cover image must be smaller than ${MAX_BOOK_COVER_MB} MB.`;
  return null;
}

export function checkCoverBytes(name: string, head: Uint8Array): string | null {
  const actual = detectCoverKind(head);
  if (!actual) return "The cover does not look like a valid JPEG or PNG image.";
  if (actual !== coverKindFromName(name)) return "The cover image content does not match its extension.";
  return null;
}

/** Per-kind rules: max size, metadata check, magic-byte check and canonical Content-Type. */
export const UPLOAD_RULES: Record<
  UploadKind,
  {
    maxBytes: number;
    checkMeta: (f: { name: string; size: number; type: string }) => string | null;
    checkBytes: (name: string, head: Uint8Array) => string | null;
    contentType: (name: string) => string | null;
  }
> = {
  "paper-manuscript": {
    maxBytes: MAX_MANUSCRIPT_SIZE_BYTES,
    checkMeta: (f) => checkManuscriptMeta(f),
    checkBytes: checkManuscriptBytes,
    contentType: (n) => {
      const k = kindFromName(n);
      return k ? MANUSCRIPT_MIME[k] : null;
    },
  },
  "book-cover": {
    maxBytes: MAX_BOOK_COVER_SIZE_BYTES,
    checkMeta: checkCoverMeta,
    checkBytes: checkCoverBytes,
    contentType: (n) => {
      const k = coverKindFromName(n);
      return k ? COVER_MIME[k] : null;
    },
  },
};

/** Safe S3 file-name segment. */
export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-150);
}
