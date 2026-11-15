import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import MuiLink from "@mui/material/Link";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { PROSE_SX, JUSTIFIED_SX } from "@/lib/text";
import { ARTICLE_TYPES, PUBLICATION_FEE_INR, REVIEW_STEPS, SCOPE_AREAS } from "@/lib/journal-content";

export const metadata = pageMetadata({
  title: "About the Journal - Aims, Scope & Peer Review",
  description:
    "Aims and scope of the International Journal of Applied AI & Computing (IJAAC): subject areas, article types, double-blind peer review, open access under CC BY 4.0 and monthly publication.",
  path: "/about",
});

const FACTS: [string, string][] = [
  ["Full title", "International Journal of Applied AI & Computing"],
  ["Abbreviation", "IJAAC"],
  ["Frequency", "Monthly (12 issues per volume)"],
  ["First volume", "Volume 1, 2026"],
  ["Access", "Open access - free to read"],
  ["Licence", "CC BY 4.0"],
  ["Review", "Double-blind, at least two reviewers"],
  ["Language", "English"],
  ["Publication fee", `INR ${PUBLICATION_FEE_INR} (non-refundable)`],
  ["Editorial office", "India"],
  ["Email", "ijaac.official@gmail.com"],
];

function SectionTitle({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <Typography
      id={id}
      variant="h5"
      component="h2"
      fontWeight={600}
      gutterBottom
      sx={{ mt: 6, scrollMarginTop: 96, "&:first-of-type": { mt: 0 } }}
    >
      {children}
    </Typography>
  );
}

export default function AboutPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "About", path: "/about" }])} />
      <PageHero
        title="About the Journal"
        subtitle="Our mission, aims and scope, and the peer-review process behind every publication."
        icon="about"
      />
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={{ xs: 4, md: 6 }}>
          <Grid item xs={12} md={8} sx={{ minWidth: 0 }}>
            <Box lang="en" sx={PROSE_SX}>
            <SectionTitle id="mission">Our mission</SectionTitle>
            <Typography variant="body1" paragraph>
              The International Journal of Applied AI &amp; Computing (IJAAC) is a peer-reviewed,
              open-access journal for research that puts artificial intelligence and computing to
              work on real problems. We publish studies that move beyond a new model or a benchmark
              score to show how a method performs on real data, under real constraints, and what it
              takes to deploy it.
            </Typography>
            <Typography variant="body1" paragraph>
              The journal is edited from India and welcomes submissions from researchers, students
              and practitioners everywhere. We particularly value work that is reproducible, that
              reports limitations honestly, and that is useful to readers in industry and the public
              sector as well as in academia.
            </Typography>

            <SectionTitle id="scope">Aims and scope</SectionTitle>
            <Typography variant="body1" paragraph>
              IJAAC covers the application, engineering and evaluation of AI and computing systems.
              Theoretical contributions are welcome when they are tied to a practical question.
              Typical subject areas include:
            </Typography>
            {/* Full-width rows (topic | description) so each justified line holds enough words for even spacing. */}
            <Stack spacing={1.5} sx={{ mb: 2 }}>
              {SCOPE_AREAS.map((area) => (
                <Paper
                  key={area.title}
                  variant="outlined"
                  sx={{
                    p: { xs: 2, sm: 2.25 },
                    borderLeft: "3px solid",
                    borderLeftColor: "secondary.main",
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "200px minmax(0, 1fr)" },
                    columnGap: 2.5,
                    rowGap: 0.75,
                    alignItems: "baseline",
                  }}
                >
                  <Typography variant="subtitle2" component="h3" fontWeight={700}>
                    {area.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ...JUSTIFIED_SX, maxWidth: "none" }}>
                    {area.description}
                  </Typography>
                </Paper>
              ))}
            </Stack>
            <Typography variant="body2" color="text.secondary" paragraph>
              Not sure whether your topic fits? Email the editorial office with your title and
              abstract before submitting and we will let you know.
            </Typography>

            <SectionTitle id="article-types">Article types</SectionTitle>
            <Stack spacing={2}>
              {ARTICLE_TYPES.map((t) => (
                <Box key={t.title}>
                  <Typography variant="subtitle1" component="h3" fontWeight={700}>
                    {t.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {t.description}
                  </Typography>
                </Box>
              ))}
            </Stack>

            <SectionTitle id="peer-review">Peer-review process</SectionTitle>
            <Typography variant="body1" paragraph>
              IJAAC uses double-blind peer review: reviewers do not know who the authors are, and
              authors do not know who reviewed their paper. Reviewers are drawn from our{" "}
              <MuiLink component={Link} href="/reviewers">
                reviewer panel
              </MuiLink>{" "}
              and final decisions rest with the{" "}
              <MuiLink component={Link} href="/editorial-board">
                editorial board
              </MuiLink>
              .
            </Typography>
            <Box component="ol" sx={{ listStyle: "none", p: 0, m: 0 }}>
              {REVIEW_STEPS.map((step, i) => (
                <Box component="li" key={step.title} sx={{ display: "flex", gap: 2, pb: 2.5 }}>
                  <Box
                    aria-hidden
                    sx={{
                      flexShrink: 0,
                      width: 32,
                      height: 32,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "primary.main",
                      color: "white",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {i + 1}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" component="h3" fontWeight={700}>
                      {step.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {step.description}
                    </Typography>
                    {step.target && (
                      <Typography variant="caption" sx={{ color: "secondary.dark", fontWeight: 600 }}>
                        {step.target}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Timelines are targets, not guarantees. They depend on reviewer availability and on how
              quickly authors return revisions.
            </Typography>

            <SectionTitle id="open-access">Open access and licensing</SectionTitle>
            <Typography variant="body1" paragraph>
              Every article is free to read, download and share from the day it is published, with no
              subscription or registration. Articles are published under the{" "}
              <MuiLink href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
                Creative Commons Attribution 4.0 International licence (CC BY 4.0)
              </MuiLink>
              . Authors keep the copyright, and anyone may reuse the work as long as they credit the
              original authors and the journal.
            </Typography>

            <SectionTitle id="frequency">Publication frequency</SectionTitle>
            <Typography variant="body1" paragraph>
              IJAAC is published monthly. Each calendar year forms one volume of twelve issues, and
              the issue number matches the month. Volume 1 is 2026. Accepted papers are placed in the
              next available issue. Past issues are listed in the{" "}
              <MuiLink component={Link} href="/archives">
                archives
              </MuiLink>
              .
            </Typography>

            <SectionTitle id="ethics">Publication ethics</SectionTitle>
            <Typography variant="body1" paragraph>
              We expect original work, honest reporting and proper credit. In brief: manuscripts
              must not be published or under review elsewhere; plagiarism, data fabrication and
              duplicate publication lead to rejection or retraction; every listed author must have
              contributed and agreed to submission; conflicts of interest and use of AI tools must be
              disclosed; and reviewers keep manuscripts confidential. Errors found after publication
              are corrected openly.
            </Typography>
            <Typography variant="body1" paragraph>
              Read the full{" "}
              <MuiLink component={Link} href="/publication-ethics">
                publication ethics &amp; copyright policy
              </MuiLink>
              .
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 4 }}>
              <Button component={Link} href="/author-guidelines" variant="contained">
                Read the author guidelines
              </Button>
              <Button component={Link} href="/faq" variant="outlined">
                Frequently asked questions
              </Button>
            </Stack>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ position: { md: "sticky" }, top: { md: 96 } }}>
              <Paper variant="outlined" sx={{ p: 3, borderTop: "3px solid", borderTopColor: "primary.main" }}>
                <Typography variant="subtitle1" component="h2" fontWeight={700} gutterBottom>
                  Journal facts
                </Typography>
                <Box component="dl" sx={{ m: 0 }}>
                  {FACTS.map(([label, value]) => (
                    <Box key={label} sx={{ py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}>
                      <Typography component="dt" variant="caption" color="text.secondary" fontWeight={600}>
                        {label}
                      </Typography>
                      <Typography component="dd" variant="body2" sx={{ m: 0, wordBreak: "break-word" }}>
                        {value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
                <Typography variant="subtitle1" component="h2" fontWeight={700} gutterBottom>
                  Policies &amp; guidance
                </Typography>
                <Stack spacing={1} component="nav" aria-label="Journal policies">
                  {[
                    ["Author Guidelines", "/author-guidelines"],
                    ["Frequently Asked Questions", "/faq"],
                    ["Publication Ethics & Copyright", "/publication-ethics"],
                    ["Privacy Policy", "/privacy-policy"],
                    ["Terms & Conditions", "/terms-and-conditions"],
                    ["Refund & Cancellation Policy", "/refund-policy"],
                  ].map(([label, href]) => (
                    <MuiLink key={href} component={Link} href={href} variant="body2">
                      {label}
                    </MuiLink>
                  ))}
                </Stack>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
