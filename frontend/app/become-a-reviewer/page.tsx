import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import VerifiedIcon from "@mui/icons-material/Verified";
import PageHero from "@/components/PageHero";
import MuiLink from "@mui/material/Link";
import Link from "next/link";
import ReviewerApplicationForm from "@/components/reviewers/ReviewerApplicationForm";
import { ReviewerBenefits, ReviewerSteps } from "@/components/reviewers/ReviewerBenefits";
import { JUSTIFIED_SX } from "@/lib/text";

const LIST_SX = { pl: 3, pr: { xs: 0.5, md: 1.5 }, m: 0, "& li": { ...JUSTIFIED_SX, mb: 1, lineHeight: 1.75 } } as const;

export const metadata = pageMetadata({
  title: "Become a Reviewer",
  description:
    "Join the IJAAC reviewer panel. Get a certificate for every review, a verified public reviewer profile and early access to research in applied AI and computing.",
  path: "/become-a-reviewer",
});

export default function BecomeAReviewerPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Become a Reviewer", path: "/become-a-reviewer" }])} />
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
          <Typography variant="h4" component="h2" sx={{ mb: 4 }}>
            Your expertise, recognised
          </Typography>
          <ReviewerBenefits />
        </Container>
      </Box>

      <Box sx={{ pb: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 3, md: 5 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" component="h2" gutterBottom>
                Who we are looking for
              </Typography>
              <Box component="ul" lang="en" sx={LIST_SX}>
                {[
                  "Researchers, faculty members and experienced practitioners in AI, machine learning, data science or computing.",
                  "A postgraduate degree or a record of peer-reviewed publications or substantial industry work in your area.",
                  "Expertise in at least one of the journal's subject areas, from computer vision and NLP to AI in healthcare, agriculture or finance.",
                  "Researchers at every career stage are welcome - early-career reviewers are matched to papers that fit their expertise.",
                ].map((t) => (
                  <Typography component="li" variant="body1" key={t}>
                    {t}
                  </Typography>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" component="h2" gutterBottom>
                What reviewing involves
              </Typography>
              <Box component="ul" lang="en" sx={LIST_SX}>
                {[
                  "Reviews are double-blind: you will not know the authors, and they will not know you.",
                  "You assess originality, technical soundness, clarity and relevance, and recommend accept, revise or reject with constructive comments.",
                  "You can decline any invitation - for example if you are busy, lack the expertise, or have a conflict of interest.",
                  "Manuscripts are confidential: do not share them or upload them to public AI tools.",
                ].map((t) => (
                  <Typography component="li" variant="body1" key={t}>
                    {t}
                  </Typography>
                ))}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ ...JUSTIFIED_SX, mt: 1.5 }}>
                See our{" "}
                <MuiLink component={Link} href="/publication-ethics">
                  publication ethics policy
                </MuiLink>{" "}
                for the full responsibilities of reviewers.
              </Typography>
            </Grid>
          </Grid>
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
                <Typography variant="h4" component="h2" sx={{ mb: 3 }}>
                  Four simple steps
                </Typography>
                <ReviewerSteps />
                <Divider sx={{ my: 4 }} />
                <Paper variant="outlined" sx={{ p: 2.5, bgcolor: "background.default" }}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <VerifiedIcon color="primary" />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Your privacy matters
                      </Typography>
                      <Typography variant="body2" color="text.secondary" lang="en" sx={{ ...JUSTIFIED_SX, lineHeight: 1.65 }}>
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
              <Typography variant="h4" component="h2" sx={{ mb: 1 }}>
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
