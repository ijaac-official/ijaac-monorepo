import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Link from "next/link";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PageHero from "@/components/PageHero";
import SubmissionForm from "@/components/SubmissionForm";

export const metadata = pageMetadata({
  title: "Submit a Paper",
  description:
    "Submit your manuscript to IJAAC online: PDF, DOC or DOCX up to 20 MB, 3-10 keywords, and an INR 1,200 publication fee paid securely at submission.",
  path: "/submit-paper",
});

const CHECKLIST = [
  "Manuscript is original and not under review elsewhere",
  "Abstract is 100-5000 characters, with 3-10 keywords",
  "All co-authors have reviewed and approved the submission",
  "File is PDF, DOC, or DOCX, under 20 MB",
];

export default function SubmitPaperPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Submit Paper", path: "/submit-paper" }])} />
      <PageHero
        title="Submit Your Manuscript"
        subtitle="Please complete all fields accurately. See our Author Guidelines before submitting."
        icon="submit"
      />
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={5}>
          <Grid item xs={12} md={8}>
            <SubmissionForm />
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack spacing={3} sx={{ position: { md: "sticky" }, top: { md: 100 } }}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Before You Submit
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  {CHECKLIST.map((item) => (
                    <Stack key={item} direction="row" spacing={1} alignItems="flex-start">
                      <CheckCircleOutlineIcon fontSize="small" color="primary" sx={{ mt: 0.2 }} />
                      <Typography variant="body2" color="text.secondary">
                        {item}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Link href="/author-guidelines" style={{ color: "inherit" }}>
                  <Typography variant="body2" fontWeight={600} color="primary.main">
                    Read Full Author Guidelines -&gt;
                  </Typography>
                </Link>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  What Happens Next
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    1. Editorial screening within a few days of submission
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    2. Double-blind peer review by subject-matter reviewers
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    3. Editorial decision emailed to the corresponding author
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    4. Approved papers receive a certificate of publication
                  </Typography>
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, bgcolor: "primary.main", color: "white" }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Need Help?
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 1.5 }}>
                  Questions about formatting, scope, or the review process?
                </Typography>
                <Link href="/contact" style={{ color: "inherit" }}>
                  <Typography variant="body2" fontWeight={600}>
                    Contact the Editorial Office -&gt;
                  </Typography>
                </Link>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
