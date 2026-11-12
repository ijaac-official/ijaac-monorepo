import { NextRequest, NextResponse } from "next/server";
import { getSubmission } from "@ijaac/data-store";
import { getObjectBuffer } from "@ijaac/aws";

export const runtime = "nodejs";

/**
 * Streams a published paper's PDF through our own domain instead of a raw S3
 * URL - keeps the bucket name out of the browser address bar and lets the
 * bucket stay fully private (no public/ copy needed for papers).
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const submission = await getSubmission(params.id);
  if (!submission || submission.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const key = submission.publishedFileKey ?? submission.fileKey;
  const buffer = await getObjectBuffer(key);
  if (!buffer) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${submission.id}.pdf"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
