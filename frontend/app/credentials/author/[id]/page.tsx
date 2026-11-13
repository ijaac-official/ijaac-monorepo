import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import MuiLink from "@mui/material/Link";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import CredentialCard, { DetailItem } from "../../CredentialCard";
import ShareActions from "../../ShareActions";
import {
  CREDENTIAL_SITE_URL,
  JOURNAL_NAME,
  authorCredentialPageUrl,
  formatDate,
  loadAuthorCredential,
} from "../../_lib";

export const revalidate = 0;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const credential = await loadAuthorCredential(params.id);
  if (!credential) return { title: "Credential not found - IJAAC", robots: { index: false } };
  const { record, author } = credential;
  const title = `${author.name} - Verified publication credential | IJAAC`;
  const description = `IJAAC certifies that ${author.name} published "${record.title}" in ${JOURNAL_NAME}, ${record.issueLabel}.`;
  const url = authorCredentialPageUrl(author.credentialId);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "IJAAC",
      images: [{ url: `${CREDENTIAL_SITE_URL}/logo.png`, alt: "IJAAC" }],
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function AuthorCredentialPage({ params }: { params: { id: string } }) {
  const credential = await loadAuthorCredential(params.id);
  if (!credential) notFound();
  const { record, author } = credential;
  const url = authorCredentialPageUrl(author.credentialId);
  const coAuthors = record.authors.filter((a) => a.credentialId !== author.credentialId);

  return (
    <CredentialCard kind="Certificate of Publication">
      <Typography variant="overline" color="success.dark" fontWeight={700}>
        Issued to
      </Typography>
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 0.5, wordBreak: "break-word" }}>
        {author.name}
      </Typography>
      {author.affiliation && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {author.affiliation}
        </Typography>
      )}

      <Box
        sx={{
          borderLeft: "4px solid #d4a017",
          bgcolor: "rgba(212,160,23,0.07)",
          borderRadius: 1,
          px: 2.5,
          py: 2,
          mb: 3,
        }}
      >
        <Typography variant="body1" sx={{ lineHeight: 1.75 }}>
          IJAAC certifies that <b>{author.name}</b>
          {author.affiliation ? ` (${author.affiliation})` : ""} has published the paper{" "}
          <Box component="span" sx={{ fontStyle: "italic", fontWeight: 600 }}>
            &quot;{record.title}&quot;
          </Box>{" "}
          in {JOURNAL_NAME}, {record.issueLabel}.
        </Typography>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <DetailItem label="Issued on" value={formatDate(record.publishedAt)} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <DetailItem label="Issued by" value="IJAAC" />
        </Grid>
        {record.articleNumber && (
          <Grid item xs={6} sm={3}>
            <DetailItem label="Article" value={record.articleNumber} />
          </Grid>
        )}
        <Grid item xs={12} sm={record.articleNumber ? 3 : 6}>
          <DetailItem
            label="Credential ID"
            value={<Box component="span" sx={{ fontFamily: "monospace", fontSize: 13 }}>{author.credentialId}</Box>}
          />
        </Grid>
      </Grid>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mb: 3 }}>
        <Button component={Link} href={`/publications/${record.id}`} variant="contained" startIcon={<ArticleOutlinedIcon />}>
          View publication
        </Button>
        <Button
          component={Link}
          href={`/credentials/publication/${encodeURIComponent(record.id)}`}
          variant="outlined"
          startIcon={<VerifiedOutlinedIcon />}
        >
          Publication record
        </Button>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
        Share this credential
      </Typography>
      <ShareActions
        url={url}
        addToProfile={{
          name: `Certificate of Publication - ${JOURNAL_NAME}`,
          issueYear: record.issueYear,
          issueMonth: record.issueMonth,
          certId: author.credentialId,
        }}
      />

      {coAuthors.length > 0 && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Co-authors
          </Typography>
          <Stack spacing={0.75}>
            {coAuthors.map((a) => (
              <Typography key={a.credentialId} variant="body2">
                <MuiLink component={Link} href={`/credentials/author/${encodeURIComponent(a.credentialId)}`} underline="hover" fontWeight={600}>
                  {a.name}
                </MuiLink>
                {a.affiliation ? (
                  <Box component="span" sx={{ color: "text.secondary" }}>
                    {" "}- {a.affiliation}
                  </Box>
                ) : null}
              </Typography>
            ))}
          </Stack>
        </>
      )}
    </CredentialCard>
  );
}
