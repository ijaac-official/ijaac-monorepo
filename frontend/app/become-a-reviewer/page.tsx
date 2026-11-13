import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import VerifiedIcon from "@mui/icons-material/Verified";
import PageHero from "@/components/PageHero";
import ReviewerApplicationForm from "@/components/reviewers/ReviewerApplicationForm";
import { ReviewerBenefits, ReviewerSteps } from "@/components/reviewers/ReviewerBenefits";

export const metadata = {
  title: "Become a Reviewer - IJAAC Journal",
  description:
    "Join the IJAAC reviewer panel. Earn certificates of reviewing, a verified public reviewer profile and early access to cutting-edge research in applied AI and computing.",
};

export default function BecomeAReviewerPage() {
  return (
    <>
      <PageHero
        title="Become a Reviewer"
        subtitle="Join a global panel of experts who uphold the quality of research in applied AI and computing. Review on your schedule, get recognised for every review."
        icon="review"
      />

      <Box sx={{ py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Typography variant="overline" color="secondary.dark">
            Why review for IJAAC
          </Typography>
          <Typography variant="h4" sx={{ mb: 4 }}>
            Your expertise, recognised
          </Typography>
          <ReviewerBenefits />
        </Container>
      </Box>

      <Box sx={{ bgcolor: "background.paper", py: { xs: 6, md: 8 }, borderTop: 1, borderColor: "divider" }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 4, md: 6 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ position: { md: "sticky" }, top: { md: 96 } }}>
                <Typography variant="overline" color="secondary.dark">
                  How it works
                </Typography>
                <Typography variant="h4" sx={{ mb: 3 }}>
                  Four simple steps
                </Typography>
                <ReviewerSteps />
                <Divider sx={{ my: 4 }} />
                <Paper variant="outlined" sx={{ p: 2.5, bgcolor: "background.default" }}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <VerifiedIcon color="primary" />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Your privacy matters
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Your email and mobile number are only used by the editorial office. Peer review is
                        confidential - your profile only ever shows how many reviews you have completed.
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Box>
            </Grid>
            <Grid item xs={12} md={8} id="apply">
              <Typography variant="overline" color="secondary.dark">
                Application form
              </Typography>
              <Typography variant="h4" sx={{ mb: 1 }}>
                Apply to the reviewer panel
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Fields marked * are required.
              </Typography>
              <ReviewerApplicationForm />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
}
