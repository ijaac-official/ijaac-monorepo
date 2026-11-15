import type { MetadataRoute } from "next";
import { listIssues, listPublicPapers, listReviewers, listEditorialBoard } from "@ijaac/data-store";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

function toDate(...values: (string | undefined)[]): Date {
  for (const v of values) {
    if (!v) continue;
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

const STATIC_ROUTES: { path: string; changeFrequency: Entry["changeFrequency"]; priority: number }[] = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/current-issue", changeFrequency: "weekly", priority: 0.9 },
  { path: "/publications", changeFrequency: "daily", priority: 0.9 },
  { path: "/archives", changeFrequency: "weekly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/author-guidelines", changeFrequency: "monthly", priority: 0.8 },
  { path: "/submit-paper", changeFrequency: "monthly", priority: 0.8 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
  { path: "/editorial-board", changeFrequency: "monthly", priority: 0.7 },
  { path: "/reviewers", changeFrequency: "weekly", priority: 0.6 },
  { path: "/become-a-reviewer", changeFrequency: "monthly", priority: 0.6 },
  { path: "/books", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.5 },
  { path: "/publication-ethics", changeFrequency: "yearly", priority: 0.5 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms-and-conditions", changeFrequency: "yearly", priority: 0.3 },
  { path: "/refund-policy", changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // listPublicPapers = published AND not hidden, so private papers never leak into the sitemap.
  const [papers, issues, reviewers, editors] = await Promise.all([
    listPublicPapers().catch(() => []),
    listIssues().catch(() => []),
    listReviewers({ activeOnly: true }).catch(() => []),
    listEditorialBoard({ activeOnly: true }).catch(() => []),
  ]);

  const editorRoutes: MetadataRoute.Sitemap = editors.map((m) => ({
    url: `${SITE_URL}/editorial-board/${encodeURIComponent(m.id)}`,
    lastModified: toDate(m.updatedAt, m.createdAt),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const paperRoutes: MetadataRoute.Sitemap = papers.flatMap((paper) => {
    const lastModified = toDate(paper.updatedAt, paper.publishedAt);
    return [
      {
        url: `${SITE_URL}/publications/${encodeURIComponent(paper.id)}`,
        lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.9,
      },
      {
        url: `${SITE_URL}/credentials/publication/${encodeURIComponent(paper.id)}`,
        lastModified,
        changeFrequency: "yearly" as const,
        priority: 0.4,
      },
    ];
  });

  const issueRoutes: MetadataRoute.Sitemap = issues.map((issue) => ({
    url: `${SITE_URL}/archives/${encodeURIComponent(issue.id)}`,
    lastModified: toDate(issue.publishDate, issue.createdAt),
    changeFrequency: issue.isCurrent ? ("weekly" as const) : ("monthly" as const),
    priority: issue.isCurrent ? 0.8 : 0.7,
  }));

  const reviewerRoutes: MetadataRoute.Sitemap = reviewers.map((r) => ({
    url: `${SITE_URL}/reviewers/${encodeURIComponent(r.id)}`,
    lastModified: toDate(r.updatedAt, r.approvedAt, r.createdAt),
    changeFrequency: "monthly" as const,
    priority: 0.4,
  }));

  return [...staticRoutes, ...paperRoutes, ...issueRoutes, ...reviewerRoutes, ...editorRoutes];
}
