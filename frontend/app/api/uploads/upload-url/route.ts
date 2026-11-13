import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { UPLOAD_KINDS, type UploadKind } from "@/lib/file-checks";
import { issueUploadUrl } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  kind: z.enum(UPLOAD_KINDS as [UploadKind, ...UploadKind[]]),
  fileName: z.string().trim().min(1, "File name is required").max(255),
  fileType: z.string().max(200).default(""),
  fileSize: z.number().int().positive("The selected file is empty."),
});

/**
 * Returns a short-lived presigned S3 PUT URL under a pending/<uuid>/ prefix, plus a
 * token binding that key to this upload kind. The submit routes verify the object
 * (exists, size, magic bytes) before accepting it.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { kind, fileName, fileType, fileSize } = parsed.data;
  try {
    const result = await issueUploadUrl(kind, { name: fileName, type: fileType, size: fileSize });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    const { ok: _ok, ...body } = result;
    return NextResponse.json(body);
  } catch (err) {
    console.error("Could not create upload URL", err);
    return NextResponse.json({ error: "Could not prepare the upload" }, { status: 502 });
  }
}
