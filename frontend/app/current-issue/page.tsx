import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { getCurrentIssue, listSubmissions } from "@ijaac/data-store";
import PageHero from "@/components/PageHero";
import Link from "next/link";

export const metadata = { title: "Current Issue - IJAAC Journal" };
export const revalidate = 0;

export default async function CurrentIssuePage() {
  const issue = await getCurrentIssue().catch(() => null);
  const published = issue
    ? (await listSubmissions({ status: "PUBLISHED" }).catch(() => [])).filter(
        (s) => s.issueId === issue.id
      )
    : [];

  return (
    <>
      <PageHero
        title="Current Issue"
        subtitle={issue ? issue.title ?? `Volume ${issue.volume}, Issue ${issue.number}` : undefined}
        image="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920&q=80"
      />
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {!issue && (
          <Typography color="text.secondary">
            The current issue has not been published yet. Please check back soon.
          </Typography>
        )}
        {issue && (
          <>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {published.length} article{published.length === 1 ? "" : "s"} in this issue
            </Typography>
            <Divider sx={{ my: 2 }} />
            <List>
              {published.map((paper) => (
                <ListItem key={paper.id} sx={{ py: 2, display: "block" }}>
                  <ListItemText
                    primary={
                      <Link href={`/publications/${paper.id}`} style={{ color: "inherit" }}>
                        {paper.title}
                      </Link>
                    }
                    secondary={paper.authors.map((a) => a.name).join(", ")}
                  />
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    {paper.keywords.slice(0, 4).map((kw) => (
                      <Chip key={kw} label={kw} size="small" />
                    ))}
                  </Stack>
                </ListItem>
              ))}
              {published.length === 0 && (
                <Typography color="text.secondary">
                  No articles have been published in this issue yet.
                </Typography>
              )}
            </List>
          </>
        )}
      </Container>
    </>
  );
}
