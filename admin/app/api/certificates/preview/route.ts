import { NextResponse } from "next/server";
import { authorCredentialUrl, generateCertificatePdf } from "@ijaac/certificate";
import { requireSession } from "@/lib/requireSession";
import { loadCertificateAssets } from "../../submissions/[id]/certificates/_lib";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sampleId = "sample-submission";
  const now = new Date();
  const pdf = await generateCertificatePdf({
    certificateId: `${sampleId}-1`,
    authorName: "Dr. Jane Researcher",
    affiliation: "Department of Computer Science, Example University",
    paperTitle: "A Sample Paper Title for Certificate Preview Purposes",
    volume: "1",
    issueNumber: String(now.getUTCMonth() + 1),
    month: now.getUTCMonth() + 1,
    year: now.getUTCFullYear(),
    articleNumber: "e000",
    issuedDate: now,
    verifyUrl: authorCredentialUrl(sampleId, 0),
    ...(await loadCertificateAssets()),
  });

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="sample-certificate.pdf"',
      "Cache-Control": "private, no-store",
    },
  });
}
