import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  ACCEPTED_MANUSCRIPT_MIME_TYPES,
  MAX_MANUSCRIPT_SIZE_BYTES,
  adminSubmissionSchema,
} from "@ijaac/shared";
import { S3_PREFIXES, putObjectBuffer } from "@ijaac/aws";
import { createSubmission, getIssue } from "@ijaac/data-store";
import { requireSession } from "@/lib/requireSession";

export const runtime = "nodejs";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-150);
}

const fail = (error: unknown, status = 400) => NextResponse.json({ error }, { status });

/**
 * Editor "bypass" submission - same fields as the public form, no checkout,
 * no author emails. Created as APPROVED + public. Publishing (typesetting) is
 * a separate call the client makes to /api/submissions/[id]/decision.
 *
 * multipart/form-data: payload (JSON string), file (PDF/DOC/DOCX)
 */
export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return fail("Unauthorized", 401);

  const formData = await req.formData().catch(() => null);
  if (!formData) return fail("Invalid form data");

  const payloadRaw = formData.get("payload");
  const file = formData.get("file");
  if (typeof payloadRaw !== "string" || !(file instanceof File)) return fail("Missing form fields");

  let payloadJson: unknown;
  try {
    payloadJson = JSON.parse(payloadRaw);
  } catch {
    return fail("Malformed payload");
  }

  const parsed = adminSubmissionSchema.safeParse(payloadJson);
  if (!parsed.success) return fail(parsed.error.flatten());

  if (!ACCEPTED_MANUSCRIPT_MIME_TYPES.includes(file.type)) {
    return fail("Only PDF, DOC, or DOCX files are supported");
  }
  if (file.size > MAX_MANUSCRIPT_SIZE_BYTES) return fail("File exceeds the 20 MB limit");

  const { publishImmediately: _publish, issueId, correspondingPhone, ...fields } = parsed.data;

  let volume: string | undefined;
  let issueNumber: string | undefined;
  if (issueId) {
    const issue = await getIssue(issueId);
    if (!issue) return fail("Issue not found");
    volume = issue.volume;
    issueNumber = issue.number;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0) return fail("The file is empty");
  // Check the real bytes, not just the browser-reported type
  const head = buffer.subarray(0, 8);
  const isPdf = head.subarray(0, 4).toString("latin1") === "%PDF";
  const isDoc = head.equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  const isDocx = head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04;
  const expected =
    file.type === "application/pdf" ? isPdf : file.type === "application/msword" ? isDoc : isDocx;
  if (!expected) return fail("The file content does not match its type - upload a valid PDF, DOC or DOCX");
  const fileKey = `${S3_PREFIXES.manuscripts}${randomUUID()}/${sanitizeFileName(file.name)}`;
  try {
    await putObjectBuffer(fileKey, buffer, file.type);
  } catch (err) {
    console.error("S3 upload failed", err);
    return fail("File upload failed, please try again", 502);
  }

  const submission = await createSubmission({
    ...fields,
    correspondingPhone: correspondingPhone?.trim() || undefined,
    issueId: issueId || undefined,
    volume,
    issueNumber,
    fileKey,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    source: "ADMIN",
    status: "APPROVED",
    isPublic: true,
  });

  return NextResponse.json({ id: submission.id }, { status: 201 });
}
