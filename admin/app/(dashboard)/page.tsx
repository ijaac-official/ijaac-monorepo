import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import Link from "next/link";
import { listAllSubmissionsRaw } from "@ijaac/data-store";
import type { Submission } from "@ijaac/shared";
import DashboardStats from "@/components/stats/DashboardStats";
import { addDays, istDate } from "@/components/stats/types";
import { computeStats } from "@/app/api/stats/compute";

export const revalidate = 0;

export default async function DashboardHomePage() {
  const submissions: Submission[] = await listAllSubmissionsRaw().catch(() => []);
  const today = istDate(Date.now());
  const initialStats = computeStats(submissions, { from: addDays(today, -27), to: today });
  const recent = [...submissions].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).slice(0, 8);

  return (
    <>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Dashboard
      </Typography>

      <DashboardStats initial={initialStats} initialPreset="28d" />

      <Paper variant="outlined">
        <Typography variant="subtitle1" fontWeight={600} sx={{ p: 2 }}>
          Recent Submissions
        </Typography>
        <List disablePadding>
          {recent.map((s) => (
            <ListItemButton key={s.id} component={Link} href={`/submissions/${s.id}`} divider>
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
