import { NextRequest, NextResponse } from "next/server";
import { incrementVisits } from "@ijaac/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOT_UA =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|whatsapp|telegrambot|discordbot|preview|headless|lighthouse|pagespeed|curl|wget|python-requests|httpclient|axios|node-fetch|go-http-client|java\//i;
const COOKIE = "ijaac_v";
const MAX_WAIT_MS = 1500;

/** POST once per browser session (see VisitTracker). Always 204, quickly. */
export async function POST(req: NextRequest) {
  const res = new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  try {
    const ua = req.headers.get("user-agent") ?? "";
    if (!ua || BOT_UA.test(ua)) return res;
    if (req.headers.get("purpose") === "prefetch" || req.headers.get("x-purpose") === "preview") return res;
    if (req.cookies.get(COOKIE)) return res;

    // Session cookie (no Max-Age) - a second guard if sessionStorage is unavailable.
    res.cookies.set(COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" });

    await Promise.race([
      incrementVisits().catch((err) => console.error("Visit increment failed", err)),
      new Promise((resolve) => setTimeout(resolve, MAX_WAIT_MS)),
    ]);
  } catch (err) {
    console.error("Visit tracking failed", err);
  }
  return res;
}
