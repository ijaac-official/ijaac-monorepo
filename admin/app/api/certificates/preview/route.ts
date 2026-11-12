import { NextResponse } from "next/server";
import { generateCertificatePdf } from "@ijaac/certificate";
import { requireSession } from "@/lib/requireSession";

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pdf = await generateCertificatePdf({
    certificateId: "IJAAC/CERT/2026/SAMPLE-1",
    authorName: "Dr. Jane Researcher",
    paperTitle: "A Sample Paper Title for Certificate Preview Purposes",
    volume: "5",
    issueNumber: "2",
  });

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=\"sample-certificate.pdf\"",
    },
  });
}
