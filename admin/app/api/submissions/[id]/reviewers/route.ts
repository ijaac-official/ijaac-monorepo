import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isApprovedReviewer } from "@ijaac/shared";
import type { Reviewer, Submission } from "@ijaac/shared";
import { assignReviewers, getSubmission, listAllSubmissionsRaw, listReviewers } from "@ijaac/data-store";
import { sendReviewerAssignmentEmail } from "@ijaac/email";
import { requireSession } from "@/lib/requireSession";

const bodySchema = z.object({
  reviewerIds: z.array(z.string().min(1)).min(1, "Pick at least one reviewer").max(20),
  /** Email each newly added reviewer (default true) */
  notify: z.boolean().optional(),
});

const STOPWORDS = new Set(
  "a an and are as at based by for from in into is of on or the to using via with towards toward its their this that new study approach analysis system systems".split(
    " "
  )
);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
    .map((t) => (t.length > 4 && t.endsWith("s") ? t.slice(0, -1) : t));
}

/** Keyword overlap between a paper and a reviewer's areas of interest. */
function scoreMatch(submission: Pick<Submission, "title" | "keywords" | "abstract">, reviewer: Reviewer) {
  const keywordPhrases = submission.keywords.map((k) => k.trim().toLowerCase()).filter(Boolean);
  const keywordTokens = new Set(submission.keywords.flatMap(tokens));
  const titleTokens = new Set(tokens(submission.title));
  const abstractTokens = new Set(tokens(submission.abstract));
  let score = 0;
  const matched: string[] = [];
  for (const area of reviewer.areasOfInterest) {
    const phrase = area.trim().toLowerCase();
    const areaTokens = tokens(area);
    let s = 0;
    if (keywordPhrases.some((k) => k === phrase || k.includes(phrase) || phrase.includes(k))) s += 5;
    for (const t of areaTokens) {
      if (keywordTokens.has(t)) s += 2;
      else if (titleTokens.has(t)) s += 1.5;
      else if (abstractTokens.has(t)) s += 0.5;
    }
    if (s >= 1.5) matched.push(area);
    score += s;
  }
  return { score: Math.round(score * 10) / 10, matched };
}

/** Eligible reviewers for this paper, ranked by expertise match, with workload. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const submission = await getSubmission(params.id);
  if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  const [reviewers, all] = await Promise.all([listReviewers(), listAllSubmissionsRaw()]);
  const completed: Record<string, number> = {};
  const active: Record<string, number> = {};
  for (const s of all)
    for (const a of s.reviewAssignments ?? []) {
      if (a.status === "COMPLETED") completed[a.reviewerId] = (completed[a.reviewerId] ?? 0) + 1;
      if (a.status === "ASSIGNED") active[a.reviewerId] = (active[a.reviewerId] ?? 0) + 1;
    }

  const assignedIds = new Set((submission.reviewAssignments ?? []).map((a) => a.reviewerId));
  const result = reviewers
    .filter((r) => assignedIds.has(r.id) || (r.isActive && isApprovedReviewer(r)))
    .map((r) => {
      const { score, matched } = scoreMatch(submission, r);
      return {
        id: r.id,
        name: r.name,
        email: r.email,
        designation: r.designation,
        affiliation: r.affiliation,
        country: r.country,
        photoUrl: r.photoUrl,
        areasOfInterest: r.areasOfInterest,
        eligible: r.isActive && isApprovedReviewer(r),
        matchScore: score,
        matchedAreas: matched,
        completedReviews: completed[r.id] ?? 0,
        activeAssignments: active[r.id] ?? 0,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore || a.activeAssignments - b.activeAssignments || a.name.localeCompare(b.name));

  return NextResponse.json({ keywords: submission.keywords, reviewers: result });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await getSubmission(params.id);
  if (!existing) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  const reviewers = await listReviewers();
  const byId = new Map(reviewers.map((r) => [r.id, r]));
  const requested = Array.from(new Set(parsed.data.reviewerIds));
  const invalid = requested.filter((rid) => {
    const r = byId.get(rid);
    return !r || !r.isActive || !isApprovedReviewer(r);
  });
  if (invalid.length) {
    return NextResponse.json(
      { error: "Only approved, active reviewers can be assigned", invalid },
      { status: 400 }
    );
  }

  const { submission, added } = await assignReviewers(params.id, requested);

  const notified: string[] = [];
  const failed: { reviewerId: string; name: string; error: string }[] = [];
  if (parsed.data.notify !== false) {
    const results = await Promise.allSettled(
      added.map((rid) => sendReviewerAssignmentEmail(byId.get(rid)!, submission))
    );
    results.forEach((res, i) => {
      const rid = added[i]!;
      if (res.status === "fulfilled") notified.push(rid);
      else {
        console.error(`[submissions/${params.id}/reviewers] invitation email to ${rid} failed`, res.reason);
        failed.push({
          reviewerId: rid,
          name: byId.get(rid)?.name ?? rid,
          error: res.reason instanceof Error ? res.reason.message : "Email failed",
        });
      }
    });
  }

  return NextResponse.json({
    assignments: submission.reviewAssignments ?? [],
    added,
    alreadyAssigned: requested.filter((rid) => !added.includes(rid)),
    notified,
    failed,
  });
}
