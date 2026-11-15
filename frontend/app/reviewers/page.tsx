import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { JUSTIFIED_SX } from "@/lib/text";
import JsonLd from "@/components/JsonLd";
import { Suspense } from "react";
import CardGridSkeleton from "@/components/CardGridSkeleton";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import { countCompletedReviews, listReviewers } from "@ijaac/data-store";
import PersonCard from "@/components/PersonCard";
import PageHero from "@/components/PageHero";
import MotionCard from "@/components/MotionCard";

export const metadata = pageMetadata({
  title: "Reviewer Panel",
  description:
    "The IJAAC reviewer panel: verified experts in AI, machine learning, data science and computing who carry out double-blind peer review for the journal.",
  path: "/reviewers",
});
export const revalidate = 0;

function BecomeReviewerCta() {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 3, md: 4 },
        mb: 5,
        borderLeft: "4px solid",
        borderLeftColor: "secondary.main",
        background: "linear-gradient(100deg, rgba(122,31,43,0.06) 0%, rgba(212,160,23,0.08) 100%)",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={3}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" gutterBottom>
            Share your expertise - become a reviewer
          </Typography>
          <Typography variant="body1" color="text.secondary" lang="en" sx={{ ...JUSTIFIED_SX, maxWidth: 680, lineHeight: 1.75 }}>
            Earn a certificate for every review, get a verified public reviewer profile and early access to new
            research in applied AI and computing.
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/become-a-reviewer"
          variant="contained"
          size="large"
          startIcon={<HowToRegIcon />}
          sx={{ flexShrink: 0 }}
        >
          Become a Reviewer
        </Button>
      </Stack>
    </Paper>
  );
}

async function ReviewersContent() {
  const [reviewers, counts] = await Promise.all([
    listReviewers({ activeOnly: true }).catch(() => []),
    countCompletedReviews().catch(() => ({}) as Record<string, number>),
  ]);

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <BecomeReviewerCta />
        <Grid container spacing={3}>
          {reviewers.map((r, i) => {
            const count = counts[r.id] ?? 0;
            return (
              <Grid item xs={12} sm={6} md={4} key={r.id}>
                <MotionCard delay={(i % 3) * 0.08}>
                  <PersonCard
                    name={r.name}
                    designation={r.designation}
                    affiliation={r.affiliation}
                    country={r.country}
                    photoUrl={r.photoUrl}
                    bio={r.bio}
                    tags={r.areasOfInterest}
                    linkedinUrl={r.linkedinUrl}
                    href={`/reviewers/${r.id}`}
                    stat={`${count} ${count === 1 ? "review" : "reviews"}`}
                  />
                </MotionCard>
              </Grid>
            );
          })}
        </Grid>
        {reviewers.length === 0 && (
          <Typography color="text.secondary">Reviewer list coming soon.</Typography>
        )}
      </Container>
    </>
  );
}

/** Banner renders immediately; only the S3-backed content waits behind a skeleton. */
export default function ReviewersPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Reviewers", path: "/reviewers" }])} />
      <PageHero
        title="Reviewer Panel"
        subtitle="Our papers are reviewed by subject-matter experts from leading institutions worldwide."
        icon="reviewers"
      />
      <Suspense fallback={<CardGridSkeleton bare count={6} />}>
        <ReviewersContent />
      </Suspense>
    </>
  );
}
