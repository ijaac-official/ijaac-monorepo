import { NextRequest, NextResponse } from "next/server";
import { getSubmission } from "@ijaac/data-store";
import { getObjectBuffer } from "@ijaac/aws";
import { isPubliclyVisible } from "@ijaac/shared";
import { hasPdfHeader, inspectPdf } from "@ijaac/certificate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Streams a published paper through our own domain instead of a raw S3 URL -
 * keeps the bucket name out of the browser address bar and lets the bucket
 * stay fully private.
 *
 * The response type is decided from the actual bytes, not assumed: a paper
 * published from a DOC/DOCX manuscript (which cannot be typeset) is served
 * as that document type and downloaded, instead of being mislabelled as
 * application/pdf (which browsers report as "Failed to load PDF document").
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const submission = await getSubmission(params.id);
  if (!submission || !isPubliclyVisible(submission)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let buffer: Buffer | null = null;
  let isTypeset = false;
  if (submission.publishedFileKey) {
    const typeset = await getObjectBuffer(submission.publishedFileKey).catch(() => null);
    if (typeset && (await inspectPdf(typeset)).ok) {
      buffer = typeset;
      isTypeset = true;
    } else {
      console.error("Typeset PDF missing or invalid, serving the original", submission.id);
    }
  }
  if (!buffer) buffer = await getObjectBuffer(submission.fileKey).catch(() => null);
  if (!buffer || buffer.length === 0) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const isPdf = isTypeset || hasPdfHeader(buffer);
  const baseName = (submission.articleNumber ? `IJAAC-${submission.articleNumber}` : submission.id).replace(/[^\w.-]/g, "_");
  const originalExt = /\.[a-z0-9]{2,5}$/i.exec(submission.fileName)?.[0]?.toLowerCase() ?? "";
  const fileName = isPdf ? `${baseName}.pdf` : `${baseName}${originalExt}`;
  const contentType = isPdf ? "application/pdf" : submission.fileType || "application/octet-stream";

  // Copy into an exact-length ArrayBuffer view (Buffers can be slices of a shared pool).
  const body = new Uint8Array(buffer.byteLength);
  body.set(buffer);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(body.byteLength),
      "Content-Disposition": `${isPdf ? "inline" : "attachment"}; filename="${fileName}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=300",
    },
  });
}
