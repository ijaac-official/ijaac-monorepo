import Link from "next/link";
import type { Issue, Submission } from "@ijaac/shared";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import AuthorNames from "@/components/AuthorNames";
import KeywordChips from "@/components/KeywordChips";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import IssueCover from "@/components/IssueCover";
import ProseText from "@/components/ProseText";

// Kept local (not imported from IssueCover): IssueCover is a client module, and
// plain functions exported from a client module cannot be called on the server.
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function issuePeriodLabel(issue: Issue): string {
  return issue.month && issue.month >= 1 && issue.month <= 12 ? `${MONTHS[issue.month - 1]} ${issue.year}` : String(issue.year);
}

function issueVolumeLabel(issue: Issue): string {
  return `Vol ${issue.volume}, Issue ${issue.number}`;
}

function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? undefined
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
}

/** Cover beside issue details, followed by the list of papers in the issue. */
export default function IssueDetailView({
  issue,
  papers,
  showArchiveLink = false,
}: {
  issue: Issue;
  papers: Submission[];
  showArchiveLink?: boolean;
}) {
  const published = formatDate(issue.publishDate);

  return (
    <>
      <Grid container spacing={{ xs: 3, md: 5 }} alignItems="flex-start" sx={{ mb: 5 }}>
        <Grid item xs={12} sm={5} md={4}>
          <Box sx={{ display: "flex", justifyContent: { xs: "center", sm: "flex-start" } }}>
            <IssueCover issue={issue} size="lg" />
          </Box>
        </Grid>
        <Grid item xs={12} sm={7} md={8} sx={{ minWidth: 0 }}>
          <Typography variant="overline" color="secondary.dark">
            {issueVolumeLabel(issue)}
          </Typography>
          <Typography variant="h4" component="h2" gutterBottom>
            {issue.title ?? `Volume ${issue.volume}, Issue ${issue.number}`}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            <Chip label={issuePeriodLabel(issue)} size="small" color="primary" />
            {issue.isCurrent && <Chip label="Current Issue" size="small" color="secondary" />}
            <Chip label={`${papers.length} article${papers.length === 1 ? "" : "s"}`} size="small" variant="outlined" />
          </Stack>
          {published && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Published {published}
            </Typography>
          )}
          {issue.description && (
            <ProseText text={issue.description} sx={{ mt: 2 }} />
          )}
          {showArchiveLink && (
            <Button component={Link} href="/archives" variant="outlined" sx={{ mt: 3 }}>
              Browse all issues
            </Button>
          )}
        </Grid>
      </Grid>

      <Typography variant="h5" component="h3" gutterBottom>
        Articles in this issue
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {papers.length === 0 ? (
        <Typography color="text.secondary">No articles have been published in this issue yet.</Typography>
      ) : (
        <Stack spacing={2}>
          {papers.map((paper) => (
            <Paper key={paper.id} variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderLeft: "3px solid", borderLeftColor: "primary.main" }}>
              {paper.articleNumber && (
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Article {paper.articleNumber}
                </Typography>
              )}
              <Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1.35 }}>
                <Box
                  component={Link}
                  href={`/publications/${paper.id}`}
                  sx={{
                    color: "inherit",
                    textDecoration: "none",
                    textUnderlineOffset: "0.18em",
                    transition: "color 0.15s ease",
                    "&:hover, &:focus-visible": { color: "primary.main", textDecoration: "underline" },
                  }}
                >
                  {paper.title}
                </Box>
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <AuthorNames authors={paper.authors} correspondingEmail={paper.correspondingEmail} />
              </Box>
              {paper.keywords.length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                  <KeywordChips keywords={paper.keywords} max={5} />
                </Box>
              )}
            </Paper>
          ))}
        </Stack>
      )}
    </>
  );
}
