import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getIssue, listPublicPapers } from "@ijaac/data-store";
import { cache } from "react";
import type { Issue, Submission } from "@ijaac/shared";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import { LICENSE_URL, absoluteUrl, breadcrumbJsonLd, clip, issuePartOf, pageMetadata } from "@/lib/seo";
import IssueDetailView from "../_components/IssueDetailView";

export const revalidate = 0;

function issueTitle(issue: { title?: string; volume: string; number: string }) {
  return issue.title ?? `Volume ${issue.volume}, Issue ${issue.number}`;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const loadIssue = cache(async (id: string) => getIssue(id).catch(() => null));

function periodLabel(issue: Issue): string {
  return issue.month && issue.month >= 1 && issue.month <= 12 ? `${MONTHS[issue.month - 1]} ${issue.year}` : String(issue.year);
}

export async function generateMetadata({ params }: { params: { issueId: string } }): Promise<Metadata> {
  const issue = await loadIssue(params.issueId);
  if (!issue) return { title: "Issue not found", robots: { index: false } };
  const label = `Volume ${issue.volume}, Issue ${issue.number} (${periodLabel(issue)})`;
  const title = issue.title ? `${issue.title} - ${label}` : label;
  const description = clip(
    issue.description
      ? `${label} of the International Journal of Applied AI & Computing. ${issue.description}`
      : `Open-access, peer-reviewed articles published in ${label} of the International Journal of Applied AI & Computing (IJAAC).`
  );
  return pageMetadata({ title, description, path: `/archives/${encodeURIComponent(issue.id)}` });
}

function issueJsonLd(issue: Issue, papers: Submission[]) {
  const url = absoluteUrl(`/archives/${encodeURIComponent(issue.id)}`);
  return {
    "@context": "https://schema.org",
    "@type": "PublicationIssue",
    "@id": `${url}#issue`,
    issueNumber: issue.number,
    name: issueTitle(issue),
    url,
    datePublished: issue.publishDate ?? `${issue.year}-${String(issue.month ?? 1).padStart(2, "0")}`,
    ...(issue.description ? { description: issue.description } : {}),
    ...(issue.coverImageUrl ? { image: issue.coverImageUrl } : {}),
    inLanguage: "en",
    isAccessibleForFree: true,
    license: LICENSE_URL,
    isPartOf: issuePartOf(issue.volume),
    hasPart: papers.map((p) => ({
      "@type": "ScholarlyArticle",
      name: p.title,
      url: absoluteUrl(`/publications/${encodeURIComponent(p.id)}`),
      author: p.authors.map((a) => ({ "@type": "Person", name: a.name })),
    })),
  };
}

export default async function ArchiveIssuePage({ params }: { params: { issueId: string } }) {
  const issue = await loadIssue(params.issueId);
  if (!issue) notFound();

  const papers = await listPublicPapers({ issueId: issue.id }).catch(() => []);

  return (
    <>
      <JsonLd
        data={[
          issueJsonLd(issue, papers),
          breadcrumbJsonLd([
            { name: "Archives", path: "/archives" },
            { name: issueTitle(issue), path: `/archives/${encodeURIComponent(issue.id)}` },
          ]),
        ]}
      />
      <PageHero
        title={issueTitle(issue)}
        subtitle={`Volume ${issue.volume}, Issue ${issue.number}`}
        icon="issue"
      />
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Button component={Link} href="/archives" startIcon={<ArrowBackIcon />} sx={{ mb: 3, px: 1 }}>
          All issues
        </Button>
        <IssueDetailView issue={issue} papers={papers} />
      </Container>
    </>
  );
}
