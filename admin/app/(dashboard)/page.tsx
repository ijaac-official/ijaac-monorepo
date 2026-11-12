import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import Link from "next/link";
import { listSubmissions } from "@ijaac/data-store";
import type { SubmissionStatus } from "@ijaac/shared";

export const revalidate = 0;

const STAT_LABELS: { status: SubmissionStatus; label: string; color: string }[] = [
  { status: "PENDING", label: "Pending Review", color: "#b8860b" },
  { status: "UNDER_REVIEW", label: "Under Review", color: "#1976d2" },
  { status: "APPROVED", label: "Approved", color: "#2e7d32" },
  { status: "PUBLISHED", label: "Published", color: "#0d2b4e" },
  { status: "REJECTED", label: "Rejected", color: "#c62828" },
];

export default async function DashboardHomePage() {
  const submissions = await listSubmissions().catch(() => []);
  const counts = submissions.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});
  const recent = submissions.slice(0, 8);

  return (
    <>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {STAT_LABELS.map((stat) => (
          <Grid item xs={12} sm={6} md={2.4} key={stat.status}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": { transform: "translateY(-3px)", boxShadow: 3 },
              }}
            >
              <Typography variant="h4" fontWeight={700} sx={{ color: stat.color }}>
                {counts[stat.status] ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stat.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper variant="outlined">
        <Typography variant="subtitle1" fontWeight={600} sx={{ p: 2 }}>
          Recent Submissions
        </Typography>
        <List disablePadding>
          {recent.map((s) => (
            <ListItemButton
              key={s.id}
              component={Link}
              href={`/submissions/${s.id}`}
              divider
            >
              <ListItemText
                primary={s.title}
                secondary={`${s.correspondingEmail} · ${new Date(s.submittedAt).toLocaleDateString()}`}
              />
              <Chip label={s.status.replace("_", " ")} size="small" />
            </ListItemButton>
          ))}
          {recent.length === 0 && (
            <Typography color="text.secondary" sx={{ p: 2 }}>
              No submissions yet.
            </Typography>
          )}
        </List>
      </Paper>
    </>
  );
}
