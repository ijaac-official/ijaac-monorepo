import type { MetadataRoute } from "next";
import { listIssues, listSubmissions } from "@ijaac/data-store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

  const staticRoutes = [
    "",
    "/about",
    "/editorial-board",
    "/current-issue",
    "/archives",
    "/books",
    "/reviewers",
    "/author-guidelines",
    "/submit-paper",
    "/contact",
  ].map((path) => ({ url: `${baseUrl}${path}`, lastModified: new Date() }));

  const [published, issues] = await Promise.all([
    listSubmissions({ status: "PUBLISHED" }).catch(() => []),
    listIssues().catch(() => []),
  ]);

  const paperRoutes = published.map((paper) => ({
    url: `${baseUrl}/publications/${paper.id}`,
    lastModified: new Date(paper.publishedAt ?? paper.updatedAt),
  }));

  const issueRoutes = issues.map((issue) => ({
    url: `${baseUrl}/archives/${issue.id}`,
    lastModified: new Date(issue.createdAt),
  }));

  return [...staticRoutes, ...paperRoutes, ...issueRoutes];
}
