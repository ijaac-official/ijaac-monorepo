import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Link from "next/link";

export default function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: "primary.main", color: "white", mt: 8, py: 6 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={3}>
            <Typography variant="h6" gutterBottom>
              IJAAC Journal
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              International Journal of Applied AI &amp; Computing - a peer-reviewed platform for
              high-quality research in applied computing, data science, and artificial
              intelligence.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <Typography variant="subtitle1" gutterBottom>
              Quick Links
            </Typography>
            {[
              ["About", "/about"],
              ["Submit Paper", "/submit-paper"],
              ["Author Guidelines", "/author-guidelines"],
              ["Current Issue", "/current-issue"],
              ["Archives", "/archives"],
            ].map(([label, href]) => (
              <Typography key={href} variant="body2" sx={{ opacity: 0.85, mb: 0.5 }}>
                <Link href={href} style={{ color: "inherit", textDecoration: "none" }}>
                  {label}
                </Link>
              </Typography>
            ))}
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <Typography variant="subtitle1" gutterBottom>
              Policies
            </Typography>
            {[
              ["Privacy Policy", "/privacy-policy"],
              ["Terms & Conditions", "/terms-and-conditions"],
              ["Refund & Cancellation", "/refund-policy"],
              ["Publication Ethics & Copyright", "/publication-ethics"],
            ].map(([label, href]) => (
              <Typography key={href} variant="body2" sx={{ opacity: 0.85, mb: 0.5 }}>
                <Link href={href} style={{ color: "inherit", textDecoration: "none" }}>
                  {label}
                </Link>
              </Typography>
            ))}
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <Typography variant="subtitle1" gutterBottom>
              Contact
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              ijaac.official@gmail.com
              <br />
              Mon-Fri, 9:00-17:00 IST
            </Typography>
          </Grid>
        </Grid>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems="center"
          sx={{ mt: 4, pt: 3, borderTop: "1px solid rgba(255,255,255,0.15)" }}
        >
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            © {new Date().getFullYear()} IJAAC Journal. All rights reserved.
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Published under CC BY 4.0
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
