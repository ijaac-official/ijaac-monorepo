import { NextRequest, NextResponse } from "next/server";
import { getObjectStream } from "@ijaac/aws";
import { getBookSubmission } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Streams a book submission's cover (`?which=cover`) or, for older requests that
 * uploaded one, the legacy manuscript file (default) through the
 * admin's own domain so the bucket URL never appears. PDFs and images open inline.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getBookSubmission(params.id);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const wantsCover = req.nextUrl.searchParams.get("which") === "cover";
  const key = wantsCover ? sub.coverKey : sub.manuscriptKey;
  if (!key) return NextResponse.json({ error: wantsCover ? "No cover image" : "No manuscript file" }, { status: 404 });

  const obj = await getObjectStream(key);
  if (!obj) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const fileName = wantsCover
    ? (key.split("/").pop() ?? "cover")
    : (sub.manuscriptName ?? key.split("/").pop() ?? "manuscript");
  const contentType = wantsCover
    ? (sub.coverType ?? obj.contentType ?? "image/jpeg")
    : (sub.manuscriptType ?? obj.contentType ?? "application/octet-stream");
  const inline = contentType === "application/pdf" || contentType.startsWith("image/");
  const download = req.nextUrl.searchParams.get("download") === "1";

  return new NextResponse(obj.stream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      ...(obj.contentLength ? { "Content-Length": String(obj.contentLength) } : {}),
      "Content-Disposition": `${inline && !download ? "inline" : "attachment"}; filename="${fileName.replace(/[^\x20-\x7e]|"/g, "_")}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
