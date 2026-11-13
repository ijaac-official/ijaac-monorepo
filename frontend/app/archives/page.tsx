import { Suspense } from "react";
import CardGridSkeleton from "@/components/CardGridSkeleton";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import type { Issue } from "@ijaac/shared";
import { listIssues } from "@ijaac/data-store";
import PageHero from "@/components/PageHero";
import IssueCover from "@/components/IssueCover";

export const metadata = { title: "Archives - IJAAC Journal" };
export const revalidate = 0;

/** Groups issues (already sorted newest first) by year + volume. */
function groupByVolume(issues: Issue[]): { key: string; year: number; volume: string; issues: Issue[] }[] {
  const groups: { key: string; year: number; volume: string; issues: Issue[] }[] = [];
  for (const issue of issues) {
    const key = `${issue.year}-${issue.volume}`;
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, year: issue.year, volume: issue.volume, issues: [] };
      groups.push(group);
    }
    group.issues.push(issue);
  }
  return groups;
}

async function ArchivesContent() {
  const issues = await listIssues().catch(() => []);
  const groups = groupByVolume(issues);

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {groups.map((group) => (
          <Box component="section" key={group.key} sx={{ mb: 6 }} aria-labelledby={`vol-${group.key}`}>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, mb: 1 }}>
              <Typography id={`vol-${group.key}`} variant="h5" component="h2">
                Volume {group.volume}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {group.year}
              </Typography>
            </Box>
            <Divider sx={{ mb: 3, borderColor: "secondary.main", borderBottomWidth: 2, width: 64 }} />
            <Grid container spacing={{ xs: 2, md: 3 }}>
              {group.issues.map((issue) => (
                <Grid item xs={6} sm={4} md={3} lg={2.4} key={issue.id}>
                  <IssueCover issue={issue} size="md" href={`/archives/${issue.id}`} />
                  <Typography variant="body2" fontWeight={600} sx={{ mt: 1.25, lineHeight: 1.3 }}>
                    {issue.title ?? `Volume ${issue.volume}, Issue ${issue.number}`}
                  </Typography>
                  {issue.isCurrent && (
                    <Typography variant="caption" color="primary" fontWeight={600}>
                      Current issue
                    </Typography>
                  )}
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
        {issues.length === 0 && <Typography color="text.secondary">No past issues yet.</Typography>}
      </Container>
    </>
  );
}

/** Banner renders immediately; only the S3-backed content waits behind a skeleton. */
export default function ArchivesPage() {
  return (
    <>
      <PageHero
        title="Archives"
        subtitle="Browse past issues of the journal - one volume per year, a new issue every month."
        icon="archives"
      />
      <Suspense fallback={<CardGridSkeleton bare count={6} />}>
        <ArchivesContent />
      </Suspense>
    </>
  );
}
