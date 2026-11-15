import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import { PUBLISHER } from "@ijaac/shared";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Link from "next/link";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";

import { JUSTIFIED_SX } from "@/lib/text";

export const metadata = pageMetadata({
  title: "Contact the Editorial Office",
  description:
    "Contact IJAAC about submissions, peer review, publication or payments. Email ijaac.official@gmail.com or use the contact form.",
  path: "/contact",
});

const FAQS = [
  { q: "How long does review take?", a: "Most authors receive an initial decision within a few weeks." },
  { q: "Can I check my submission status?", a: "Email us with your submission ID for an update." },
  { q: "What's the submission fee for?", a: "See our Refund & Cancellation Policy for details." },
];

export default function ContactPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Contact", path: "/contact" }])} />
      <PageHero
        title="Contact Us"
        subtitle="Questions about submissions, reviews, or publication? Reach out."
        icon="contact"
      />
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={5}>
          <Grid item xs={12} md={7}>
            <ContactForm />
          </Grid>
          <Grid item xs={12} md={5}>
            <Stack spacing={3}>
              <Paper variant="outlined" sx={{ p: 3, borderTop: "3px solid", borderTopColor: "primary.main" }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                  <BusinessOutlinedIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Publisher
                  </Typography>
                </Stack>
                <Box component="address" sx={{ fontStyle: "normal" }}>
                  <Typography variant="body2" fontWeight={600}>
                    {PUBLISHER.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {PUBLISHER.street}
                    <br />
                    {PUBLISHER.city}, {PUBLISHER.state}
                    {PUBLISHER.pin ? ` - ${PUBLISHER.pin}` : ""}
                    <br />
                    {PUBLISHER.country}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mt: 1.5 }}>
                  <b>Place of publication:</b> {PUBLISHER.placeOfPublication}
                </Typography>
                <Typography variant="body2">
                  <b>Publisher type:</b> {PUBLISHER.type}
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                  <EmailOutlinedIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Email
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  ijaac.official@gmail.com
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                  <ScheduleOutlinedIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Office Hours
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Monday - Friday, 9:00 AM - 5:00 PM IST
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                  <HelpOutlineIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Frequently Asked
                  </Typography>
                </Stack>
                <Stack divider={<Divider />} spacing={1.5}>
                  {FAQS.map((faq) => (
                    <Stack key={faq.q} spacing={0.5}>
                      <Typography variant="body2" fontWeight={600}>
                        {faq.q}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" lang="en" sx={{ ...JUSTIFIED_SX, lineHeight: 1.65 }}>
                        {faq.a}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, bgcolor: "primary.main", color: "white" }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Ready to Submit?
                </Typography>
                <Typography variant="body2" sx={{ ...JUSTIFIED_SX, opacity: 0.9, mb: 1.5 }}>
                  Review our author guidelines and submit your manuscript today.
                </Typography>
                <Link href="/submit-paper" style={{ color: "inherit" }}>
                  <Typography variant="body2" fontWeight={600}>
                    Submit a Paper -&gt;
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
