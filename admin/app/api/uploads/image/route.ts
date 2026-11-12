import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { putObjectBuffer, publicUrl, S3_PREFIXES } from "@ijaac/aws";
import { requireSession } from "@/lib/requireSession";

export const runtime = "nodejs";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_FOLDERS = ["books", "reviewers", "editorial-board"] as const;

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-100);
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  const folderRaw = formData?.get("folder");

  if (!(file instanceof File) || typeof folderRaw !== "string") {
    return NextResponse.json({ error: "Missing file or folder" }, { status: 400 });
  }

  const folder = ALLOWED_FOLDERS.includes(folderRaw as (typeof ALLOWED_FOLDERS)[number])
    ? folderRaw
    : null;
  if (!folder) {
    return NextResponse.json({ error: "Invalid upload folder" }, { status: 400 });
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WEBP, or GIF images are supported" }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json({ error: "Image must be smaller than 5 MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `${S3_PREFIXES.publicAssets}${folder}/${randomUUID()}-${sanitizeFileName(file.name)}`;

  try {
    await putObjectBuffer(key, buffer, file.type);
  } catch (err) {
    console.error("Image upload failed", err);
    return NextResponse.json({ error: "Upload failed, please try again" }, { status: 502 });
  }

  return NextResponse.json({ url: publicUrl(key) });
}
