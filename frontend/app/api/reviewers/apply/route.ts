import { NextRequest, NextResponse } from "next/server";
import { reviewerApplicationSchema } from "@ijaac/shared";
import { createReviewerApplication } from "@ijaac/data-store";
import {
  sendReviewerApplicationEditorNotification,
  sendReviewerApplicationReceivedEmail,
} from "@ijaac/email";

export const dynamic = "force-dynamic";

// Basic per-IP rate limit. In-memory, so it is per server instance - good
// enough to blunt casual spam; not a security boundary.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? req.ip ?? "unknown";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  // keep the map from growing forever
  if (hits.size > 5000) {
    for (const [key, times] of hits) if (!times.some((t) => now - t < WINDOW_MS)) hits.delete(key);
  }
  return false;
}

export async function POST(req: NextRequest) {
  const json = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!json || typeof json !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Honeypot: real users never see or fill the "website" field. Pretend success.
  if (typeof json.website === "string" && json.website.trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  if (rateLimited(clientIp(req))) {
    return NextResponse.json(
      { error: "Too many applications from this network. Please try again later." },
      { status: 429 }
    );
  }

  const { website: _ignored, ...payload } = json;
  const parsed = reviewerApplicationSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please correct the highlighted fields", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  let result: Awaited<ReturnType<typeof createReviewerApplication>>;
  try {
    result = await createReviewerApplication(parsed.data);
  } catch (err) {
    console.error("[reviewers/apply] failed to save application", err);
    return NextResponse.json({ error: "Could not save your application. Please try again." }, { status: 500 });
  }
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 409 });
  }

  const reviewer = result.reviewer;
  // Email failures must never fail the request - the application is already saved.
  const outcomes = await Promise.allSettled([
    sendReviewerApplicationReceivedEmail(reviewer),
    sendReviewerApplicationEditorNotification(reviewer),
  ]);
  outcomes.forEach((o, i) => {
    if (o.status === "rejected") {
      console.error(
        `[reviewers/apply] ${i === 0 ? "applicant acknowledgement" : "editor notification"} email failed`,
        o.reason
      );
    }
  });

  return NextResponse.json({ ok: true, id: reviewer.id }, { status: 201 });
}
