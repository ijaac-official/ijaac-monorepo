import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Link from "next/link";
import Image from "next/image";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SecurePaymentBadge from "@/components/SecurePaymentBadge";

/** Mirrors every link in the header navigation. */
const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: "Journal",
    links: [
      ["About the Journal", "/about"],
      ["Editorial Board", "/editorial-board"],
      ["Reviewers", "/reviewers"],
      ["Become a Reviewer", "/become-a-reviewer"],
      ["Author Guidelines", "/author-guidelines"],
      ["FAQ", "/faq"],
    ],
  },
  {
    title: "Publications",
    links: [
      ["Current Issue", "/current-issue"],
      ["All Publications", "/publications"],
      ["Archives", "/archives"],
      ["Books", "/books"],
      ["Submit Paper", "/submit-paper"],
    ],
  },
  {
    title: "Policies",
    links: [
      ["Privacy Policy", "/privacy-policy"],
      ["Terms & Conditions", "/terms-and-conditions"],
      ["Refund & Cancellation", "/refund-policy"],
      ["Publication Ethics & Copyright", "/publication-ethics"],
      ["Contact Us", "/contact"],
    ],
  },
];

const linkSx = {
  color: "rgba(255,255,255,0.8)",
  textDecoration: "none",
  fontSize: 14,
  lineHeight: 2,
  transition: "color 0.15s ease",
  "&:hover": { color: "#d4a017" },
} as const;

export default function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: "#4a1017", color: "white", mt: 8 }}>
      <Box sx={{ height: 4, bgcolor: "secondary.main" }} />
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
        <Grid container spacing={{ xs: 4, md: 5 }}>
          <Grid item xs={12} md={4}>
            <Box
              component={Link}
              href="/"
              aria-label="IJAAC home"
              sx={{ display: "inline-flex", bgcolor: "white", px: 2, py: 1.25, mb: 2 }}
            >
              <Image src="/logo.png" alt="IJAAC Journal" width={110} height={74} style={{ height: 52, width: "auto" }} />
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.8, mb: 2.5, maxWidth: 340 }}>
              International Journal of Applied AI &amp; Computing - a peer-reviewed, open-access
              journal for research in applied AI, data science and computing.
            </Typography>
            <Stack spacing={1} sx={{ mb: 2.5 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ opacity: 0.85 }}>
                <MailOutlineIcon sx={{ fontSize: 18 }} />
                <Box component="a" href="mailto:ijaac.official@gmail.com" sx={{ ...linkSx, lineHeight: 1.5 }}>
                  ijaac.official@gmail.com
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ opacity: 0.85 }}>
                <ScheduleIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2">Mon-Fri, 9:00-17:00 IST</Typography>
              </Stack>
            </Stack>
            <Button component={Link} href="/submit-paper" variant="contained" color="secondary" size="small">
              Submit Paper
            </Button>
          </Grid>

          {COLUMNS.map((col) => (
            <Grid item xs={6} sm={4} md={8 / 3} key={col.title}>
              <Typography
                variant="overline"
                sx={{ color: "secondary.main", fontWeight: 700, letterSpacing: 1.2, display: "block", mb: 1 }}
              >
                {col.title}
              </Typography>
              <Stack component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Box component={Link} href={href} sx={linkSx}>
                      {label}
                    </Box>
                  </li>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 1.5, md: 2 }}
            justifyContent="space-between"
            alignItems="center"
            sx={{ py: 2.5, textAlign: { xs: "center", md: "left" } }}
          >
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              © {new Date().getFullYear()} IJAAC Journal. All rights reserved. Published under CC BY 4.0.
            </Typography>
            <SecurePaymentBadge tone="dark" />
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
