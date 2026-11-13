import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getIssue, listPublicPapers } from "@ijaac/data-store";
import PageHero from "@/components/PageHero";
import IssueDetailView from "../_components/IssueDetailView";

export const revalidate = 0;

function issueTitle(issue: { title?: string; volume: string; number: string }) {
  return issue.title ?? `Volume ${issue.volume}, Issue ${issue.number}`;
}

export async function generateMetadata({ params }: { params: { issueId: string } }): Promise<Metadata> {
  const issue = await getIssue(params.issueId).catch(() => null);
  return { title: issue ? `${issueTitle(issue)} - IJAAC Journal` : "Issue - IJAAC Journal" };
}

export default async function ArchiveIssuePage({ params }: { params: { issueId: string } }) {
  const issue = await getIssue(params.issueId).catch(() => null);
  if (!issue) notFound();

  const papers = await listPublicPapers({ issueId: issue.id }).catch(() => []);

  return (
    <>
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
