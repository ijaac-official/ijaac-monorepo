// Server-only helpers for browser direct-to-S3 uploads.
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { S3_PREFIXES, copyObject, deleteObject, getObjectHead, headObject, presignPutUrl } from "@ijaac/aws";
import { UPLOAD_RULES, sanitizeFileName, type UploadKind } from "@/lib/file-checks";

export const UPLOAD_URL_TTL_SECONDS = 600;

const PENDING_PREFIX: Record<UploadKind, string> = {
  "paper-manuscript": S3_PREFIXES.paperPending,
  "book-cover": S3_PREFIXES.bookPending,
};

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

function signingSecret(): string {
  const secret =
    process.env.UPLOAD_SIGNING_SECRET || process.env.RAZORPAY_KEY_SECRET || process.env.AWS_SECRET_ACCESS_KEY;
  if (!secret) throw new Error("Upload signing secret is not configured");
  return secret;
}

/** HMAC binding a pending key to its upload kind, so only keys this server issued are accepted. */
export function signUploadToken(kind: UploadKind, key: string): string {
  return createHmac("sha256", signingSecret()).update(`ijaac-upload-v1|${kind}|${key}`).digest("base64url");
}

function tokenMatches(kind: UploadKind, key: string, token: string): boolean {
  const expected = Buffer.from(signUploadToken(kind, key));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

function keyShapeOk(kind: UploadKind, key: string): boolean {
  const prefix = PENDING_PREFIX[kind].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${prefix}${UUID}/[A-Za-z0-9._-]{1,150}$`).test(key);
}

export type IssueResult =
  | { ok: true; uploadUrl: string; key: string; token: string; contentType: string; expiresIn: number }
  | { ok: false; error: string };

export async function issueUploadUrl(
  kind: UploadKind,
  file: { name: string; size: number; type: string }
): Promise<IssueResult> {
  const rules = UPLOAD_RULES[kind];
  const metaError = rules.checkMeta(file);
  if (metaError) return { ok: false, error: metaError };
  const contentType = rules.contentType(file.name);
  if (!contentType) return { ok: false, error: "Unsupported file type." };

  const key = `${PENDING_PREFIX[kind]}${randomUUID()}/${sanitizeFileName(file.name)}`;
  const uploadUrl = await presignPutUrl(key, contentType, UPLOAD_URL_TTL_SECONDS);
  return { ok: true, uploadUrl, key, token: signUploadToken(kind, key), contentType, expiresIn: UPLOAD_URL_TTL_SECONDS };
}

export type VerifyResult =
  | { ok: true; key: string; size: number; contentType: string }
  | { ok: false; error: string };

/**
 * Verifies a browser-uploaded object before it is accepted: key issued by us
 * (shape + HMAC token), object exists (HeadObject), size within limits, and the
 * leading bytes (ranged GET) match the file extension.
 */
export async function verifyUpload(kind: UploadKind, key: unknown, token: unknown): Promise<VerifyResult> {
  if (typeof key !== "string" || typeof token !== "string" || !keyShapeOk(kind, key) || !tokenMatches(kind, key, token)) {
    return { ok: false, error: "Invalid upload reference. Please choose the file again." };
  }
  const rules = UPLOAD_RULES[kind];
  const contentType = rules.contentType(key);
  if (!contentType) return { ok: false, error: "Unsupported file type." };

  const head = await headObject(key);
  if (!head) return { ok: false, error: "The uploaded file was not found. Please upload it again." };
  if (head.size <= 0) return { ok: false, error: "The uploaded file is empty." };
  if (head.size > rules.maxBytes) {
    return { ok: false, error: `File must be smaller than ${Math.round(rules.maxBytes / (1024 * 1024))} MB.` };
  }
  const bytes = await getObjectHead(key, 1024);
  if (!bytes) return { ok: false, error: "The uploaded file was not found. Please upload it again." };
  const bytesError = rules.checkBytes(key, bytes);
  if (bytesError) return { ok: false, error: bytesError };

  return { ok: true, key, size: head.size, contentType };
}

/** Moves a verified pending upload to its permanent private key (delete of the pending copy is best-effort). */
export async function promoteUpload(pendingKey: string, destinationKey: string): Promise<void> {
  await copyObject(pendingKey, destinationKey);
  await deleteObject(pendingKey).catch((err) => console.error("Could not delete pending upload", pendingKey, err));
}

/** Original file name's extension must agree with the stored key, else fall back to the key's own name. */
export function displayName(originalName: unknown, key: string): string {
  const keyName = key.split("/").pop() ?? key;
  if (typeof originalName !== "string" || !originalName.trim()) return keyName;
  const ext = (n: string) => n.trim().toLowerCase().split(".").pop();
  return ext(originalName) === ext(keyName) ? originalName.trim().slice(-200) : keyName;
}
