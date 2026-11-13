"use client";

import { MULTIPART_FALLBACK_MAX_BYTES } from "@ijaac/shared";
import type { UploadKind } from "@/lib/file-checks";

export interface UploadedRef {
  key: string;
  token: string;
  name: string;
  size: number;
  type: string;
}

export type DirectUploadResult =
  | { mode: "direct"; ref: UploadedRef }
  /** The direct PUT failed but the file is small enough to send in the request body. */
  | { mode: "fallback" };

/** A real validation error from the server - do not fall back, show it. */
export class UploadRejectedError extends Error {}

function putWithProgress(url: string, file: File, contentType: string, onProgress?: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Upload failed (network or CORS)"));
    xhr.onabort = () => reject(new Error("Upload aborted"));
    xhr.send(file);
  });
}

/**
 * Uploads a file straight to S3 through a presigned PUT URL (avoids the ~4.5 MB
 * serverless body limit). If that fails and the file is <= 4 MB, returns
 * `fallback` so the caller sends it in the multipart body instead; larger files throw.
 */
export async function directUpload(
  kind: UploadKind,
  file: File,
  onProgress?: (pct: number) => void
): Promise<DirectUploadResult> {
  let issued: { uploadUrl: string; key: string; token: string; contentType: string } | null = null;
  try {
    const res = await fetch("/api/uploads/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, fileName: file.name, fileType: file.type, fileSize: file.size }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 400) {
      throw new UploadRejectedError(typeof body?.error === "string" ? body.error : "This file cannot be uploaded");
    }
    if (res.ok) issued = body;
  } catch (err) {
    if (err instanceof UploadRejectedError) throw err;
  }

  if (issued) {
    try {
      await putWithProgress(issued.uploadUrl, file, issued.contentType, onProgress);
      return {
        mode: "direct",
        ref: { key: issued.key, token: issued.token, name: file.name, size: file.size, type: file.type },
      };
    } catch (err) {
      console.warn("Direct upload failed", err);
    }
  }

  if (file.size <= MULTIPART_FALLBACK_MAX_BYTES) return { mode: "fallback" };
  throw new Error(
    `Could not upload "${file.name}". Please check your connection and try again. ` +
      "If this keeps happening, email the file size and title to the editorial office."
  );
}
