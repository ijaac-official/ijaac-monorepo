import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { listReviewers } from "@ijaac/data-store";
import PersonCard from "@/components/PersonCard";
import PageHero from "@/components/PageHero";

export const metadata = { title: "Reviewers - IJAAC Journal" };
export const revalidate = 0;

export default async function ReviewersPage() {
  const reviewers = await listReviewers({ activeOnly: true }).catch(() => []);

  return (
    <>
      <PageHero
        title="Reviewer Panel"
        subtitle="Our papers are reviewed by subject-matter experts from leading institutions worldwide."
        image="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=1920&q=80"
      />
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={3}>
          {reviewers.map((r) => (
            <Grid item xs={12} sm={6} md={4} key={r.id}>
              <PersonCard
                name={r.name}
                designation={r.designation}
                affiliation={r.affiliation}
                country={r.country}
                photoUrl={r.photoUrl}
                bio={r.bio}
                tags={r.areasOfInterest}
                linkedinUrl={r.linkedinUrl}
              />
            </Grid>
          ))}
        </Grid>
        {reviewers.length === 0 && (
          <Typography color="text.secondary">Reviewer list coming soon.</Typography>
        )}
      </Container>
    </>
  );
}
