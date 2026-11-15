import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import BoltIcon from "@mui/icons-material/Bolt";
import MotionCard from "@/components/MotionCard";
import { JUSTIFIED_SX } from "@/lib/text";

const BENEFITS = [
  {
    icon: <WorkspacePremiumIcon fontSize="large" />,
    title: "Certificate of reviewing",
    text: "Receive an official IJAAC certificate for every review you complete - ideal for appraisals and academic portfolios.",
  },
  {
    icon: <BadgeOutlinedIcon fontSize="large" />,
    title: "Public reviewer profile",
    text: "A verified profile page on ijaac.in showing your expertise and the number of reviews you have completed.",
  },
  {
    icon: <EmojiEventsOutlinedIcon fontSize="large" />,
    title: "Recognition",
    text: "Be listed on our Reviewer Panel alongside experts from leading institutions, with outstanding reviewers acknowledged.",
  },
  {
    icon: <BoltIcon fontSize="large" />,
    title: "Early access",
    text: "Read cutting-edge research in applied AI and computing before it is published, and help shape the field.",
  },
];

const STEPS = [
  { title: "Apply", text: "Tell us about your background and expertise. It takes about 5 minutes." },
  { title: "Editorial review", text: "Our editors review your application and email you the decision." },
  { title: "Profile goes live", text: "Approved reviewers get a verified public profile on our website." },
  { title: "Review papers", text: "Receive invitations for manuscripts that match your expertise." },
];

export function ReviewerBenefits() {
  return (
    <Grid container spacing={3}>
      {BENEFITS.map((b, i) => (
        <Grid item xs={12} sm={6} md={3} key={b.title}>
          <MotionCard delay={i * 0.08}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                height: "100%",
                borderBottom: "3px solid",
                borderBottomColor: "secondary.main",
                transition: "box-shadow 0.2s",
                "&:hover": { boxShadow: 4 },
              }}
            >
              <Box sx={{ color: "primary.main", mb: 1.5 }}>{b.icon}</Box>
              <Typography variant="h6" gutterBottom>
                {b.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" lang="en" sx={{ ...JUSTIFIED_SX, lineHeight: 1.65 }}>
                {b.text}
              </Typography>
            </Paper>
          </MotionCard>
        </Grid>
      ))}
    </Grid>
  );
}

export function ReviewerSteps() {
  return (
    <Stack spacing={0}>
      {STEPS.map((s, i) => (
        <Stack key={s.title} direction="row" spacing={2} sx={{ position: "relative", pb: i < STEPS.length - 1 ? 3 : 0 }}>
          <Box sx={{ position: "relative", flexShrink: 0 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                bgcolor: i === 0 ? "secondary.main" : "primary.main",
                color: i === 0 ? "secondary.contrastText" : "white",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                fontFamily: "var(--font-heading)",
              }}
            >
              {i + 1}
            </Box>
            {i < STEPS.length - 1 && (
              <Box sx={{ position: "absolute", left: 17, top: 36, bottom: -24, width: 2, bgcolor: "divider" }} />
            )}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              {s.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" lang="en" sx={{ ...JUSTIFIED_SX, lineHeight: 1.65 }}>
              {s.text}
            </Typography>
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}
