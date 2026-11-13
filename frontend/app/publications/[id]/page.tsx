import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Link from "next/link";
import MuiLink from "@mui/material/Link";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import { cache } from "react";
import { getIssue, getSubmission } from "@ijaac/data-store";
import { isPubliclyVisible } from "@ijaac/shared";
import type { Issue, Submission } from "@ijaac/shared";
import JsonLd from "@/components/JsonLd";
import {
  DEFAULT_OG_IMAGE,
  JOURNAL_NAME,
  JOURNAL_SHORT,
  LICENSE_URL,
  ORGANIZATION_ID,
  absoluteUrl,
  breadcrumbJsonLd,
  clip,
  issuePartOf,
} from "@/lib/seo";
import PageHero from "@/components/PageHero";
import AuthorNames from "@/components/AuthorNames";
import KeywordChips from "@/components/KeywordChips";

export const revalidate = 0;

// cache(): generateMetadata and the page share one data-store read per request.
const getPublishedPaper = cache(async (id: string) => {
  const submission = await getSubmission(id).catch(() => null);
  // Private papers (isPublic === false) are hidden from the public site.
  if (!submission || !isPubliclyVisible(submission)) return null;
  return submission;
});

const getPaperIssue = cache(async (issueId?: string) =>
  issueId ? getIssue(issueId).catch(() => null) : null
);

function publishedIso(paper: Submission): string {
  return paper.publishedAt ?? paper.decidedAt ?? paper.submittedAt;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const paper = await getPublishedPaper(params.id);
  if (!paper) return { title: "Article not found", robots: { index: false } };
  const issue = await getPaperIssue(paper.issueId);

  const path = `/publications/${encodeURIComponent(paper.id)}`;
  const pdfUrl = absoluteUrl(`/article/view/${encodeURIComponent(paper.id)}`);
  const iso = publishedIso(paper);
  // Google Scholar wants YYYY/MM/DD.
  const publicationDate = iso.slice(0, 10).replace(/-/g, "/");
  const volume = issue?.volume ?? paper.volume;
  const issueNumber = issue?.number ?? paper.issueNumber;
  const authors = paper.authors.map((a) => a.name).filter(Boolean);
  const description = clip(paper.abstract, 200);

  return {
    title: paper.title,
    description,
    keywords: paper.keywords,
    authors: authors.map((name) => ({ name })),
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: path,
      title: paper.title,
      description,
      siteName: `${JOURNAL_SHORT} - ${JOURNAL_NAME}`,
      locale: "en_IN",
      publishedTime: iso,
      modifiedTime: paper.updatedAt,
      authors,
      tags: paper.keywords,
      section: "Research",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title: paper.title, description, images: [DEFAULT_OG_IMAGE.url] },
    // Google Scholar / Highwire Press tags. Arrays render one <meta> per value
    // (one citation_author tag per author, in author order).
    other: {
      citation_title: paper.title,
      citation_author: authors,
      citation_publication_date: publicationDate,
      citation_online_date: publicationDate,
      citation_journal_title: JOURNAL_NAME,
      citation_journal_abbrev: JOURNAL_SHORT,
      citation_publisher: JOURNAL_NAME,
      ...(volume ? { citation_volume: volume } : {}),
      ...(issueNumber ? { citation_issue: issueNumber } : {}),
      citation_abstract_html_url: absoluteUrl(path),
      citation_pdf_url: pdfUrl,
      ...(paper.keywords.length ? { citation_keywords: paper.keywords.join("; ") } : {}),
      citation_language: "en",
    },
  };
}

function articleJsonLd(paper: Submission, issue: Issue | null) {
  const url = absoluteUrl(`/publications/${encodeURIComponent(paper.id)}`);
  const volume = issue?.volume ?? paper.volume;
  const issueNumber = issue?.number ?? paper.issueNumber;
  const issueUrl = issue ? absoluteUrl(`/archives/${encodeURIComponent(issue.id)}`) : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    "@id": `${url}#article`,
    headline: paper.title.length > 110 ? `${paper.title.slice(0, 107)}...` : paper.title,
    name: paper.title,
    abstract: paper.abstract,
    description: clip(paper.abstract, 300),
    keywords: paper.keywords.join(", "),
    inLanguage: "en",
    datePublished: publishedIso(paper),
    dateModified: paper.updatedAt,
    url,
    mainEntityOfPage: url,
    ...(paper.articleNumber ? { identifier: { "@type": "PropertyValue", propertyID: "IJAAC article number", value: paper.articleNumber } } : {}),
    author: paper.authors.map((a) => ({
      "@type": "Person",
      name: a.name,
      ...(a.affiliation ? { affiliation: { "@type": "Organization", name: a.affiliation } } : {}),
    })),
    publisher: { "@id": ORGANIZATION_ID },
    isPartOf: issuePartOf(volume, issueNumber, issueUrl),
    license: LICENSE_URL,
    isAccessibleForFree: true,
    encoding: {
      "@type": "MediaObject",
      contentUrl: absoluteUrl(`/article/view/${encodeURIComponent(paper.id)}`),
      encodingFormat: "application/pdf",
    },
    image: absoluteUrl(DEFAULT_OG_IMAGE.url),
  };
}

export default async function PublicationDetailPage({ params }: { params: { id: string } }) {
  const paper = await getPublishedPaper(params.id);
  if (!paper) notFound();
  const issue = await getPaperIssue(paper.issueId);

  return (
    <>
      <JsonLd
        data={[
          articleJsonLd(paper, issue),
          breadcrumbJsonLd([
            { name: "Publications", path: "/publications" },
            { name: paper.title, path: `/publications/${encodeURIComponent(paper.id)}` },
          ]),
        ]}
      />
      <PageHero title={paper.title} icon="publications" />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="overline" color="text.secondary" component="h2">
          Authors
        </Typography>
        <Box sx={{ mb: 2 }}>
          <AuthorNames
            authors={paper.authors}
            correspondingEmail={paper.correspondingEmail}
            variant="full"
            credentialPaperId={paper.id}
          />
        </Box>
        {(issue || paper.volume || paper.issueNumber) && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {issue ? (
              <MuiLink component={Link} href={`/archives/${encodeURIComponent(issue.id)}`} color="inherit">
                Volume {issue.volume}, Issue {issue.number}
              </MuiLink>
            ) : (
              <>
                Volume {paper.volume}, Issue {paper.issueNumber}
              </>
            )}
            {paper.articleNumber ? ` - Article ${paper.articleNumber}` : ""}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          Published{" "}
          {new Date(paper.publishedAt ?? paper.submittedAt).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom fontWeight={600}>
          Abstract
        </Typography>
        <Typography variant="body1" paragraph sx={{ whiteSpace: "pre-wrap" }}>
          {paper.abstract}
        </Typography>

        {paper.keywords.length > 0 && (
          <Box sx={{ my: 3 }}>
            <Typography variant="overline" color="text.secondary" component="h2" sx={{ mb: 0.5 }}>
              Keywords
            </Typography>
            <KeywordChips keywords={paper.keywords} linked />
          </Box>
        )}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
          <Button
            href={`/article/view/${paper.id}`}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            startIcon={<PictureAsPdfOutlinedIcon />}
          >
            Download Full Text (PDF)
          </Button>
          <Button
            component={Link}
            href={`/credentials/publication/${paper.id}`}
            variant="outlined"
            color="secondary"
            startIcon={<VerifiedOutlinedIcon />}
            sx={{ color: "secondary.dark", borderColor: "secondary.main" }}
          >
            Verify this publication
          </Button>
        </Stack>
      </Container>
    </>
  );
}
