import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import KeywordChips from "@/components/KeywordChips";
import MuiLink from "@mui/material/Link";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import VerifiedIcon from "@mui/icons-material/Verified";
import CredentialCard, { DetailItem } from "../../CredentialCard";
import ShareActions from "../../ShareActions";
import {
  CREDENTIAL_SITE_URL,
  JOURNAL_NAME,
  formatDate,
  loadPublicationRecord,
  publicationCredentialPageUrl,
  safeDecode,
} from "../../_lib";

export const revalidate = 0;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const record = await loadPublicationRecord(safeDecode(params.id));
  if (!record) return { title: "Publication record not found", robots: { index: false } };
  const title = `Verified publication: ${record.title} | IJAAC`;
  const description = `${record.authors.map((a) => a.name).join(", ")}. Published in ${JOURNAL_NAME}, ${record.issueLabel}.`;
  const url = publicationCredentialPageUrl(record.id);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: "IJAAC",
      publishedTime: record.publishedAt,
      authors: record.authors.map((a) => a.name),
      images: [{ url: `${CREDENTIAL_SITE_URL}/logo.png`, alt: "IJAAC" }],
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function PublicationCredentialPage({ params }: { params: { id: string } }) {
  const record = await loadPublicationRecord(safeDecode(params.id));
  if (!record) notFound();
  const url = publicationCredentialPageUrl(record.id);

  return (
    <CredentialCard kind="Verified Publication Record">
      <Typography variant="overline" color="success.dark" fontWeight={700}>
        Published article
      </Typography>
      <Typography variant="h5" component="h1" fontWeight={700} sx={{ mb: 2, lineHeight: 1.35, wordBreak: "break-word" }}>
        {record.title}
      </Typography>

      <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.75 }}>
        This paper was peer reviewed and published in <b>{JOURNAL_NAME}</b>, {record.issueLabel}.
      </Typography>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {record.volume && (
          <Grid item xs={6} sm={3}>
            <DetailItem label="Volume" value={record.volume} />
          </Grid>
        )}
        {record.issueNumber && (
          <Grid item xs={6} sm={3}>
            <DetailItem label="Issue" value={`${record.issueNumber} (${record.monthYear})`} />
          </Grid>
        )}
        {record.articleNumber && (
          <Grid item xs={6} sm={3}>
            <DetailItem label="Article" value={record.articleNumber} />
          </Grid>
        )}
        <Grid item xs={6} sm={3}>
          <DetailItem label="Published" value={formatDate(record.publishedAt)} />
        </Grid>
      </Grid>

      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
        Authors
      </Typography>
      <Stack spacing={1} sx={{ mb: 3 }}>
        {record.authors.map((a) => (
          <Stack key={a.credentialId} direction="row" spacing={1} alignItems="flex-start">
            <VerifiedIcon fontSize="small" sx={{ color: "#1e8e3e", mt: "2px" }} />
            <Box>
              <MuiLink
                component={Link}
                href={`/credentials/author/${encodeURIComponent(a.credentialId)}`}
                underline="hover"
                fontWeight={600}
              >
                {a.name}
              </MuiLink>
              {a.affiliation && (
                <Typography variant="body2" color="text.secondary">
                  {a.affiliation}
                </Typography>
              )}
            </Box>
          </Stack>
        ))}
      </Stack>

      {record.keywords.length > 0 && (
        <>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Keywords
          </Typography>
          <Box sx={{ mb: 3 }}>
            <KeywordChips keywords={record.keywords} />
          </Box>
        </>
      )}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mb: 3 }}>
        <Button component={Link} href={`/publications/${record.id}`} variant="contained" startIcon={<ArticleOutlinedIcon />}>
          View publication
        </Button>
        <Button
          href={`/article/view/${record.id}`}
          target="_blank"
          rel="noopener noreferrer"
          variant="outlined"
          startIcon={<PictureAsPdfOutlinedIcon />}
        >
          Read the paper
        </Button>
      </Stack>

      <Divider sx={{ mb: 3 }} />
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
        Share this record
      </Typography>
      <ShareActions url={url} />
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 2 }}>
        Record ID: <Box component="span" sx={{ fontFamily: "monospace" }}>{record.id}</Box>
      </Typography>
    </CredentialCard>
  );
}
