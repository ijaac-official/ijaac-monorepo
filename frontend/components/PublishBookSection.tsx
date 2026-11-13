import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import NextLink from "next/link";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import FormatAlignLeftOutlinedIcon from "@mui/icons-material/FormatAlignLeftOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import { formatInr } from "@ijaac/shared";
import { getSettingsSafe } from "@ijaac/data-store";

const POINTS = [
  {
    icon: FactCheckOutlinedIcon,
    title: "Editorial guidance",
    text: "Our editorial office reviews your request and guides you through preparing your book for publication.",
  },
  {
    icon: FormatAlignLeftOutlinedIcon,
    title: "Formatting and preparation",
    text: "Accepted books are formatted and prepared for international publication.",
  },
  {
    icon: PublicOutlinedIcon,
    title: "International publication support",
    text: "We support authors from any country in publishing their books for an international readership.",
  },
  {
    icon: MenuBookOutlinedIcon,
    title: "Listed on IJAAC Books",
    text: "Published titles appear on the IJAAC Books page with cover, synopsis and author details.",
  },
];

/** International book publication support call-to-action with the live fee from Fees & Charges. */
export default async function PublishBookSection() {
  const settings = await getSettingsSafe();
  return (
    <Box component="section" sx={{ bgcolor: "grey.50", borderTop: 1, borderColor: "divider" }}>
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={5} sx={{ minWidth: 0 }}>
            <Typography variant="overline" color="secondary.dark" fontWeight={700}>
              For authors
            </Typography>
            <Typography variant="h4" component="h2" fontWeight={700} gutterBottom sx={{ overflowWrap: "anywhere" }}>
              Publish Your Book with IJAAC
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              IJAAC supports authors in publishing their books internationally, with editorial guidance and
              formatting and preparation for international publication. Send a book publication request online -
              no manuscript upload is needed. Our editorial office will contact you by email to collect your
              manuscript and discuss the publication.
            </Typography>
            <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderColor: "primary.main", borderWidth: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Book publication fee
              </Typography>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                {formatInr(settings.bookFeeInPaise)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                One-time, non-refundable, paid securely via Razorpay at submission. Coupons apply at checkout.
              </Typography>
            </Paper>
            <Button component={NextLink} href="/books/publish" variant="contained" size="large">
              Request Book Publication
            </Button>
          </Grid>
          <Grid item xs={12} md={7} sx={{ minWidth: 0 }}>
            <Grid container spacing={2}>
              {POINTS.map(({ icon: Icon, title, text }) => (
                <Grid item xs={12} sm={6} key={title} sx={{ minWidth: 0 }}>
                  <Paper variant="outlined" sx={{ p: 2.5, height: "100%" }}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Icon color="primary" sx={{ mt: 0.25, flexShrink: 0 }} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={600}>{title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {text}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
