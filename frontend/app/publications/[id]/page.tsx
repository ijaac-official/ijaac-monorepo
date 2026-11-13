import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Link from "next/link";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import { getSubmission } from "@ijaac/data-store";
import { isPubliclyVisible } from "@ijaac/shared";
import PageHero from "@/components/PageHero";
import AuthorNames from "@/components/AuthorNames";
import KeywordChips from "@/components/KeywordChips";

export const revalidate = 0;

async function getPublishedPaper(id: string) {
  const submission = await getSubmission(id);
  // Private papers (isPublic === false) are hidden from the public site.
  if (!submission || !isPubliclyVisible(submission)) return null;
  return submission;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const paper = await getPublishedPaper(params.id);
  if (!paper) return {};

  const baseUrl = process.env.FRONTEND_URL ?? "";
  const pdfUrl = `${baseUrl}/article/view/${paper.id}`;
  const publicationDate = (paper.publishedAt ?? paper.submittedAt).slice(0, 10).replace(/-/g, "/");

  return {
    title: `${paper.title} - IJAAC Journal`,
    description: paper.abstract.slice(0, 200),
    other: {
      citation_title: paper.title,
      citation_author: paper.authors.map((a) => a.name),
      citation_publication_date: publicationDate,
      citation_journal_title: "International Journal of Applied AI & Computing",
      citation_abstract_html_url: `${baseUrl}/publications/${paper.id}`,
      citation_pdf_url: pdfUrl,
      citation_keywords: paper.keywords,
    },
  };
}

export default async function PublicationDetailPage({ params }: { params: { id: string } }) {
  const paper = await getPublishedPaper(params.id);
  if (!paper) notFound();

  return (
    <>
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
        {(paper.volume || paper.issueNumber) && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Volume {paper.volume}, Issue {paper.issueNumber}
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
