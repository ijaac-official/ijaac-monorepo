import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { listIssues } from "@ijaac/data-store";
import PageHero from "@/components/PageHero";
import Link from "next/link";

export const metadata = { title: "Archives - IJAAC Journal" };
export const revalidate = 0;

export default async function ArchivesPage() {
  const issues = await listIssues().catch(() => []);

  return (
    <>
      <PageHero
        title="Archives"
        subtitle="Browse past issues of the journal."
        image="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1920&q=80"
      />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <List>
          {issues.map((issue) => (
            <ListItemButton
              key={issue.id}
              component={Link}
              href={`/archives/${issue.id}`}
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, mb: 1.5 }}
            >
              <ListItemText
                primary={issue.title ?? `Volume ${issue.volume}, Issue ${issue.number}`}
                secondary={issue.year}
              />
            </ListItemButton>
          ))}
        </List>
        {issues.length === 0 && <Typography color="text.secondary">No past issues yet.</Typography>}
      </Container>
    </>
  );
}
