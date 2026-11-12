import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Link from "next/link";
import Image from "next/image";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import {
  getCurrentIssue,
  listEditorialBoard,
  listPublicationsForMonth,
  listPublishedPapersPage,
  listReviewers,
} from "@ijaac/data-store";
import Carousel from "@/components/Carousel";
import HeroCarousel from "@/components/HeroCarousel";
import MotionCard from "@/components/MotionCard";

export const revalidate = 0;

const FEATURES = [
  {
    icon: <RateReviewOutlinedIcon fontSize="large" />,
    title: "Rigorous Peer Review",
    body: "Every submission undergoes a thorough editorial and peer-review process before publication.",
  },
  {
    icon: <SpeedOutlinedIcon fontSize="large" />,
    title: "Fast Turnaround",
    body: "Authors receive an initial decision within weeks of submission.",
  },
  {
    icon: <PublicOutlinedIcon fontSize="large" />,
    title: "Wide Readership",
    body: "Published papers reach a global audience of researchers and practitioners.",
  },
];

export default async function HomePage() {
  const [currentIssue, monthlyPublications, recentPapers, publishedCount, reviewers, board] =
    await Promise.all([
      getCurrentIssue().catch(() => null),
      listPublicationsForMonth().catch(() => []),
      listPublishedPapersPage({ limit: 6 }).then((r) => r.items).catch(() => []),
      listPublishedPapersPage({ limit: 0 }).then((r) => r.total).catch(() => 0),
      listReviewers({ activeOnly: true }).catch(() => []),
      listEditorialBoard({ activeOnly: true }).catch(() => []),
    ]);

  const monthLabel = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const stats = [
    { label: "Published Papers", value: publishedCount },
    { label: "Expert Reviewers", value: reviewers.length },
    { label: "Editorial Board Members", value: board.length },
  ];

  return (
    <Box>
      <HeroCarousel />

      <Box sx={{ bgcolor: "primary.main", color: "white", py: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            {stats.map((stat) => (
              <Grid item xs={4} key={stat.label} sx={{ textAlign: "center" }}>
                <Typography variant="h3" fontWeight={700} color="secondary.light">
                  {stat.value}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  {stat.label}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {currentIssue && (
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Current Issue
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {currentIssue.title ?? `Volume ${currentIssue.volume}, Issue ${currentIssue.number}`}
          </Typography>
          <Button component={Link} href="/current-issue" sx={{ mt: 2 }}>
            Read Issue -&gt;
          </Button>
        </Container>
      )}

      {monthlyPublications.length > 0 && (
        <Box sx={{ bgcolor: "background.paper", py: 6 }}>
          <Container maxWidth="lg">
            <Typography variant="h5" fontWeight={600} gutterBottom>
              This Month's Publications
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Papers published in {monthLabel}
            </Typography>
            <Carousel>
              {monthlyPublications.map((paper, i) => (
                <MotionCard key={paper.id} delay={(i % 4) * 0.08}>
                  <Paper
                    component={Link}
                    href={`/publications/${paper.id}`}
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      height: 220,
                      display: "flex",
                      flexDirection: "column",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                      {paper.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {paper.authors.map((a) => a.name).join(", ")}
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: "auto", gap: 0.5 }}>
                      {paper.keywords.slice(0, 3).map((kw) => (
                        <Chip key={kw} label={kw} size="small" />
                      ))}
                    </Stack>
                  </Paper>
                </MotionCard>
              ))}
            </Carousel>
          </Container>
        </Box>
      )}

      {recentPapers.length > 0 && (
        <Box sx={{ bgcolor: "background.default", py: 6 }}>
          <Container maxWidth="lg">
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Recently Published
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              The latest peer-reviewed papers across all issues
            </Typography>
            <Carousel>
              {recentPapers.map((paper, i) => (
                <MotionCard key={paper.id} delay={(i % 4) * 0.08}>
                  <Paper
                    component={Link}
                    href={`/publications/${paper.id}`}
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      height: 220,
                      display: "flex",
                      flexDirection: "column",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                      {paper.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {paper.authors.map((a) => a.name).join(", ")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: "auto" }}>
                      {new Date(paper.publishedAt ?? paper.submittedAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Typography>
                  </Paper>
                </MotionCard>
              ))}
            </Carousel>
            <Button component={Link} href="/publications" sx={{ mt: 3 }}>
              View All Publications -&gt;
            </Button>
          </Container>
        </Box>
      )}

      <Box sx={{ bgcolor: "background.paper", py: 7 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {FEATURES.map((item, i) => (
              <Grid item xs={12} md={4} key={item.title}>
                <MotionCard delay={i * 0.1}>
                  <Paper variant="outlined" sx={{ p: 3.5, height: "100%" }}>
                    <Box sx={{ color: "primary.main", mb: 1.5 }}>{item.icon}</Box>
                    <Typography variant="h6" gutterBottom>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.body}
                    </Typography>
                  </Paper>
                </MotionCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 7 }}>
        <Grid container spacing={5} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ position: "relative", width: "100%", height: 340 }}>
              <Image
                src="/stock/indian-researcher-2.jpg"
                alt="Researchers collaborating"
                fill
                style={{ objectFit: "cover" }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="overline" color="secondary.dark" fontWeight={700}>
              About IJAAC
            </Typography>
            <Typography variant="h4" fontWeight={700} gutterBottom sx={{ mt: 1 }}>
              Bridging Research and Real-World Application
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              IJAAC is a peer-reviewed, open-access journal dedicated to disseminating original,
              high-quality research in applied artificial intelligence, machine learning, data
              science, and computing technologies - bridging the gap between theoretical research
              and practical application.
            </Typography>
            <Button component={Link} href="/about" variant="contained">
              Learn More About Us
            </Button>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
