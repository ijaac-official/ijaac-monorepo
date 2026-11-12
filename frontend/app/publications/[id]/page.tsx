import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import { getSubmission } from "@ijaac/data-store";
import PageHero from "@/components/PageHero";

export const revalidate = 0;

async function getPublishedPaper(id: string) {
  const submission = await getSubmission(id);
  if (!submission || submission.status !== "PUBLISHED") return null;
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
      <PageHero title={paper.title} />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {paper.authors.map((a) => a.name).join(", ")}
        </Typography>
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

        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ my: 2 }}>
          {paper.keywords.map((kw) => (
            <Chip key={kw} label={kw} size="small" />
          ))}
        </Stack>

        <Button
          href={`/article/view/${paper.id}`}
          target="_blank"
          rel="noopener noreferrer"
          variant="contained"
          sx={{ mt: 2 }}
        >
          Download Full Text (PDF)
        </Button>
      </Container>
    </>
  );
}
