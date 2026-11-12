import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { getIssue, listSubmissions } from "@ijaac/data-store";
import PageHero from "@/components/PageHero";
import { notFound } from "next/navigation";
import Link from "next/link";

export const revalidate = 0;

export default async function ArchiveIssuePage({ params }: { params: { issueId: string } }) {
  const issue = await getIssue(params.issueId).catch(() => null);
  if (!issue) notFound();

  const papers = (await listSubmissions({ status: "PUBLISHED" }).catch(() => [])).filter(
    (s) => s.issueId === issue.id
  );

  return (
    <>
      <PageHero
        title={issue.title ?? `Volume ${issue.volume}, Issue ${issue.number}`}
        image="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1920&q=80"
      />
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <List>
          {papers.map((paper) => (
            <ListItem key={paper.id} sx={{ py: 2 }}>
              <ListItemText
                primary={
                  <Link href={`/publications/${paper.id}`} style={{ color: "inherit" }}>
                    {paper.title}
                  </Link>
                }
                secondary={paper.authors.map((a) => a.name).join(", ")}
              />
            </ListItem>
          ))}
          {papers.length === 0 && (
            <Typography color="text.secondary">No articles in this issue.</Typography>
          )}
        </List>
      </Container>
    </>
  );
}
