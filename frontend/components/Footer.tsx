import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Link from "next/link";

export default function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: "primary.main", color: "white", mt: 8, py: 6 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              IJAAC Journal
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              International Journal of Applied AI &amp; Computing - a peer-reviewed platform for
              high-quality research in applied computing, data science, and artificial
              intelligence.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
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
          <Grid item xs={12} sm={6} md={4}>
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
        <Typography variant="body2" align="center" sx={{ opacity: 0.7, mt: 4 }}>
          © {new Date().getFullYear()} IJAAC Journal. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
