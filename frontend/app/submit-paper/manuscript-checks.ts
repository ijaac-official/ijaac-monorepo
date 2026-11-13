// Pure (isomorphic) manuscript file checks shared by the submission form and
// the payment/submission API routes. No Node or browser-only imports here.
import { z } from "zod";
import { MAX_MANUSCRIPT_SIZE_BYTES, submissionFormSchema } from "@ijaac/shared";

export type ManuscriptKind = "pdf" | "doc" | "docx";

export const MANUSCRIPT_MIME: Record<ManuscriptKind, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/** MIME types browsers sometimes report when they do not know the type. */
const GENERIC_MIME = new Set(["", "application/octet-stream", "binary/octet-stream"]);

export const MAX_MANUSCRIPT_MB = Math.round(MAX_MANUSCRIPT_SIZE_BYTES / (1024 * 1024));

export function kindFromName(name: string): ManuscriptKind | null {
  const ext = name.trim().toLowerCase().split(".").pop() ?? "";
  if (ext === "pdf" || ext === "doc" || ext === "docx") return ext;
  return null;
}

export function kindFromMime(mime: string): ManuscriptKind | null {
  const m = mime.trim().toLowerCase();
  for (const [kind, value] of Object.entries(MANUSCRIPT_MIME) as [ManuscriptKind, string][]) {
    if (m === value) return kind;
  }
  return null;
}

/**
 * Detects the real file type from its leading bytes:
 * %PDF (PDF, allowed anywhere in the first 1 KB per the spec), D0 CF 11 E0 A1 B1 1A E1
 * (OLE2 compound file, legacy .doc), 50 4B 03 04 (zip container, .docx).
 */
export function detectKindFromBytes(bytes: Uint8Array): ManuscriptKind | null {
  if (bytes.length >= 8) {
    const ole = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
    if (ole.every((b, i) => bytes[i] === b)) return "doc";
  }
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    return "docx";
  }
  const limit = Math.min(bytes.length, 1024) - 4;
  for (let i = 0; i <= limit; i++) {
    if (bytes[i] === 0x25 && bytes[i + 1] === 0x50 && bytes[i + 2] === 0x44 && bytes[i + 3] === 0x46) {
      return "pdf";
    }
  }
  return null;
}

/**
 * Checks file metadata (name/size/type) without reading contents.
 * Returns an error message, or null if the metadata is acceptable.
 */
export function checkManuscriptMeta(file: { name: string; size: number; type: string }): string | null {
  if (!file.name?.trim()) return "Please attach your manuscript file.";
  const byName = kindFromName(file.name);
  if (!byName) return "Only PDF, DOC, or DOCX files are supported.";
  const type = (file.type ?? "").trim().toLowerCase();
  if (!GENERIC_MIME.has(type)) {
    const byMime = kindFromMime(type);
    if (!byMime) return "Only PDF, DOC, or DOCX files are supported.";
    if (byMime !== byName) return "The file extension does not match its type.";
  }
  if (!Number.isFinite(file.size) || file.size <= 0) return "The selected file is empty.";
  if (file.size > MAX_MANUSCRIPT_SIZE_BYTES) {
    return `File must be smaller than ${MAX_MANUSCRIPT_MB} MB.`;
  }
  return null;
}

/** Content check: the leading bytes must match the extension. */
export function checkManuscriptBytes(name: string, head: Uint8Array): string | null {
  const byName = kindFromName(name);
  const actual = detectKindFromBytes(head);
  if (!actual) return "The file does not look like a valid PDF or Word document.";
  if (actual !== byName) {
    return `The file content is ${actual.toUpperCase()} but its extension is .${byName ?? "unknown"}.`;
  }
  return null;
}

/** Metadata sent to create-order before checkout (no file contents). */
export const checkoutPrevalidationSchema = z.object({
  couponCode: z.string().trim().max(64).optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Please accept the terms and the non-refundable fee policy" }),
  }),
  submission: submissionFormSchema,
  file: z.object({
    name: z.string().min(1, "Please attach your manuscript file."),
    size: z.number(),
    type: z.string(),
  }),
});

export type CheckoutPrevalidation = z.infer<typeof checkoutPrevalidationSchema>;

const trimStr = (v: unknown) => (typeof v === "string" ? v.trim() : v);

/**
 * Trims every string field and de-duplicates keywords (case-insensitive) so that
 * whitespace-only values cannot satisfy the schema's minimum lengths.
 * Unknown shapes are passed through untouched for the schema to reject.
 */
export function normalizeSubmissionInput(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const r = raw as Record<string, unknown>;
  const keywords = Array.isArray(r.keywords)
    ? r.keywords
        .map(trimStr)
        .filter((k) => typeof k !== "string" || k.length > 0)
        .filter((k, i, arr) =>
          typeof k !== "string"
            ? true
            : arr.findIndex((x) => typeof x === "string" && x.toLowerCase() === k.toLowerCase()) === i
        )
    : r.keywords;
  const authors = Array.isArray(r.authors)
    ? r.authors.map((a) => {
        if (!a || typeof a !== "object") return a;
        const x = a as Record<string, unknown>;
        const affiliation = trimStr(x.affiliation);
        return {
          ...x,
          name: trimStr(x.name),
          email: trimStr(x.email),
          affiliation: affiliation === "" ? undefined : affiliation,
        };
      })
    : r.authors;
  return {
    ...r,
    title: trimStr(r.title),
    abstract: trimStr(r.abstract),
    keywords,
    authors,
    correspondingEmail: trimStr(r.correspondingEmail),
    correspondingPhone: trimStr(r.correspondingPhone),
  };
}

/** First human-readable message from a zod error. */
export function firstIssueMessage(error: z.ZodError, fallback = "Please check the form for errors."): string {
  const issue = error.issues[0];
  return issue?.message ?? fallback;
}
