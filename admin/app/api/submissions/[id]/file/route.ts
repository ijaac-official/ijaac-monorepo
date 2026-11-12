import { NextRequest, NextResponse } from "next/server";
import { getSubmission } from "@ijaac/data-store";
import { getObjectBuffer } from "@ijaac/aws";
import { requireSession } from "@/lib/requireSession";

export const runtime = "nodejs";

/**
 * Streams a submission's file through the admin's own domain so the S3
 * bucket URL never appears. `?version=published` serves the typeset PDF.
 * PDFs open inline in the browser; DOC/DOCX download.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const submission = await getSubmission(params.id);
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const wantsPublished = req.nextUrl.searchParams.get("version") === "published";
  const key = wantsPublished && submission.publishedFileKey ? submission.publishedFileKey : submission.fileKey;
  const isTypeset = key === submission.publishedFileKey;

  const buffer = await getObjectBuffer(key);
  if (!buffer) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const contentType = isTypeset ? "application/pdf" : submission.fileType;
  const fileName = isTypeset ? `${submission.articleNumber ?? submission.id}.pdf` : submission.fileName;
  const disposition = contentType === "application/pdf" ? "inline" : "attachment";

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `${disposition}; filename="${fileName.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
