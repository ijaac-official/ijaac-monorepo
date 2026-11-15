import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import MuiLink from "@mui/material/Link";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";
import { FAQS } from "@/lib/journal-content";
import { JUSTIFIED_SX } from "@/lib/text";

export const metadata = pageMetadata({
  title: "Frequently Asked Questions",
  description:
    "Answers for authors and readers of IJAAC: scope, peer review and timelines, open access and CC BY 4.0, the INR 1,200 publication fee, file formats, reference style, AI-tool use and certificates.",
  path: "/faq",
});

/**
 * Questions are rendered as native <details> elements: open/close works
 * without client JavaScript and every answer stays in the HTML for crawlers.
 */
export default function FaqPage() {
  return (
    <>
      <JsonLd data={[faqJsonLd(FAQS), breadcrumbJsonLd([{ name: "FAQ", path: "/faq" }])]} />
      <PageHero
        title="Frequently Asked Questions"
        subtitle="Quick answers about submitting to, publishing in and reading IJAAC."
        icon="guidelines"
      />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Stack spacing={1.5}>
          {FAQS.map((faq) => (
            <Paper
              key={faq.q}
              variant="outlined"
              component="details"
              sx={{
                "& > summary": {
                  listStyle: "none",
                  cursor: "pointer",
                  p: { xs: 2, md: 2.5 },
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                  transition: "color 0.15s ease",
                  "&::-webkit-details-marker": { display: "none" },
                  "&::after": {
                    content: '"+"',
                    flexShrink: 0,
                    fontSize: 22,
                    lineHeight: 1,
                    color: "secondary.dark",
                    fontWeight: 700,
                  },
                  "&:hover": { color: "primary.main" },
                  "&:focus-visible": { outline: "2px solid", outlineColor: "secondary.main", outlineOffset: -2 },
                },
                "&[open] > summary": { color: "primary.main" },
                "&[open] > summary::after": { content: '"-"' },
                "&[open]": { borderLeft: "3px solid", borderLeftColor: "secondary.main" },
              }}
            >
              <Box component="summary">
                <Typography component="h2" variant="subtitle1" fontWeight={600} sx={{ color: "inherit" }}>
                  {faq.q}
                </Typography>
              </Box>
              <Box lang="en" sx={{ px: { xs: 2.5, md: 3.5 }, pb: 2.5, minWidth: 0 }}>
                <Typography variant="body1" color="text.secondary" sx={{ ...JUSTIFIED_SX, lineHeight: 1.7 }}>
                  {faq.a}
                </Typography>
                {faq.link && (
                  <MuiLink component={Link} href={faq.link.href} variant="body2" fontWeight={600} sx={{ mt: 1, display: "inline-block" }}>
                    {faq.link.label} -&gt;
                  </MuiLink>
                )}
              </Box>
            </Paper>
          ))}
        </Stack>

        <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, mt: 5, bgcolor: "background.default" }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Still have a question?
          </Typography>
          <Typography variant="body2" color="text.secondary" lang="en" sx={{ ...JUSTIFIED_SX, lineHeight: 1.7, mb: 2 }}>
            Email the editorial office at ijaac.official@gmail.com or send us a message. Include
            your submission ID if your question is about a manuscript you have already submitted.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button component={Link} href="/contact" variant="contained">
              Contact us
            </Button>
            <Button component={Link} href="/author-guidelines" variant="outlined">
              Author guidelines
            </Button>
          </Stack>
        </Paper>
      </Container>
    </>
  );
}
