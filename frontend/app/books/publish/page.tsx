import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { formatInr } from "@ijaac/shared";
import { getSettingsSafe } from "@ijaac/data-store";
import { pageMetadata } from "@/lib/seo";
import PageHero from "@/components/PageHero";
import BookPublishForm from "@/components/BookPublishForm";
import { JUSTIFIED_SX } from "@/lib/text";

export const metadata = pageMetadata({
  title: "Publish Your Book Internationally",
  description:
    "IJAAC supports authors in publishing their books internationally: editorial guidance, formatting and preparation for international publication, and listing on the IJAAC Books page.",
  path: "/books/publish",
});
export const revalidate = 0;

const STEPS = [
  "Fill in your book details and, optionally, upload a cover image. No manuscript upload is needed.",
  "Pay the publication fee securely via Razorpay. A receipt is emailed to you.",
  "Our editorial office contacts you by email to collect your manuscript and discuss the publication.",
  "Your book receives editorial guidance and is formatted and prepared for international publication.",
  "Published books are listed on the IJAAC Books page.",
];

export default async function PublishBookPage() {
  const settings = await getSettingsSafe();
  return (
    <>
      <PageHero
        title="Publish Your Book Internationally"
        subtitle="IJAAC supports authors in publishing their books internationally, with editorial guidance and formatting and preparation for international publication."
        icon="books"
      />
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={5}>
          <Grid item xs={12} md={8} sx={{ minWidth: 0 }}>
            <BookPublishForm initialFeePaise={settings.bookFeeInPaise} />
          </Grid>
          <Grid item xs={12} md={4} sx={{ minWidth: 0 }}>
            <Stack spacing={3} sx={{ position: { md: "sticky" }, top: { md: 100 } }}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Book publication fee
                </Typography>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  {formatInr(settings.bookFeeInPaise)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Non-refundable, regardless of the editorial decision.
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  How It Works
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  {STEPS.map((step) => (
                    <Stack key={step} direction="row" spacing={1} alignItems="flex-start">
                      <CheckCircleOutlineIcon fontSize="small" color="primary" sx={{ mt: 0.2, flexShrink: 0 }} />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        lang="en"
                        sx={{ ...JUSTIFIED_SX, lineHeight: 1.65, minWidth: 0 }}
                      >
                        {step}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
