import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Button from "@mui/material/Button";
import PageHero from "@/components/PageHero";
import Link from "next/link";

export const metadata = { title: "Author Guidelines - IJAAC Journal" };

const GUIDELINES = [
  "Manuscripts must be original and not under consideration elsewhere.",
  "Submit as PDF or Word (.doc/.docx), maximum 20 MB.",
  "Include a structured abstract (150-300 words) and 3-10 keywords.",
  "Follow IEEE or APA citation style consistently throughout the manuscript.",
  "Clearly identify the corresponding author with a valid email address.",
  "Figures and tables should be numbered sequentially and referenced in the text.",
  "Declare any conflicts of interest and funding sources.",
  "Ensure all co-authors have approved the final submitted version.",
];

export default function AuthorGuidelinesPage() {
  return (
    <>
      <PageHero
        title="Author Guidelines"
        subtitle="Please review the following requirements before submitting your manuscript."
        image="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1920&q=80"
      />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <List>
          {GUIDELINES.map((item, i) => (
            <ListItem key={i} sx={{ py: 1 }}>
              <ListItemText primary={item} />
            </ListItem>
          ))}
        </List>
        <Button component={Link} href="/submit-paper" variant="contained" size="large" sx={{ mt: 3 }}>
          Proceed to Submission
        </Button>
      </Container>
    </>
  );
}
