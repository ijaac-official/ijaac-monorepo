import { Suspense } from "react";
import CardGridSkeleton from "@/components/CardGridSkeleton";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { getCurrentIssue, listPublicPapers } from "@ijaac/data-store";
import PageHero from "@/components/PageHero";
import IssueDetailView from "../archives/_components/IssueDetailView";

export const metadata = { title: "Current Issue - IJAAC Journal" };
export const revalidate = 0;

async function CurrentIssueContent() {
  const issue = await getCurrentIssue().catch(() => null);
  const papers = issue ? await listPublicPapers({ issueId: issue.id }).catch(() => []) : [];

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {issue ? (
          <IssueDetailView issue={issue} papers={papers} showArchiveLink />
        ) : (
          <Typography color="text.secondary">
            The current issue has not been published yet. Please check back soon.
          </Typography>
        )}
      </Container>
    </>
  );
}

/** Banner renders immediately; only the S3-backed content waits behind a skeleton. */
export default function CurrentIssuePage() {
  return (
    <>
      <PageHero
        title="Current Issue"
        subtitle="The latest monthly issue of IJAAC"
        icon="issue"
      />
      <Suspense fallback={<CardGridSkeleton bare count={6} />}>
        <CurrentIssueContent />
      </Suspense>
    </>
  );
}
