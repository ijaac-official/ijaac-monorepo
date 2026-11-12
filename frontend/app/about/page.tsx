import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import PageHero from "@/components/PageHero";

export const metadata = { title: "About - IJAAC Journal" };

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="About the Journal"
        subtitle="Learn about our mission, scope, and the peer-review process behind every publication."
        image="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80"
      />
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Typography variant="h5" gutterBottom fontWeight={600}>
              Our Mission
            </Typography>
            <Typography variant="body1" paragraph>
              The International Journal of Applied AI &amp; Computing (IJAAC) is a peer-reviewed,
              open-access journal dedicated to disseminating original, high-quality research in
              applied artificial intelligence, machine learning, data science, and computing
              technologies. We aim to bridge the gap between theoretical research and real-world
              application.
            </Typography>
            <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
              Scope
            </Typography>
            <Typography variant="body1" paragraph>
              IJAAC welcomes original research articles, review papers, and case studies across -
              but not limited to - machine learning, deep learning, natural language processing,
              computer vision, cloud computing, data engineering, cybersecurity, and AI ethics.
            </Typography>
            <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mt: 4 }}>
              Peer Review Process
            </Typography>
            <Typography variant="body1" paragraph>
              Every submission undergoes an initial editorial screening, followed by a
              double-blind peer review by at least two subject-matter reviewers from our{" "}
              <a href="/reviewers">reviewer panel</a>. Final publication decisions rest with the
              editorial board.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Journal Facts
              </Typography>
              <Typography variant="body2" paragraph>
                <b>Frequency:</b> Bi-monthly
              </Typography>
              <Typography variant="body2" paragraph>
                <b>Access Model:</b> Open Access
              </Typography>
              <Typography variant="body2" paragraph>
                <b>Review Type:</b> Double-blind peer review
              </Typography>
              <Typography variant="body2">
                <b>Languages:</b> English
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
