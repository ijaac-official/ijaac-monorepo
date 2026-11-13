import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { listReviewers } from "@ijaac/data-store";
import ApplicationsBoard from "./ApplicationsBoard";

export const revalidate = 0;

export default async function ReviewerApplicationsPage() {
  const all = await listReviewers().catch(() => []);
  // Applications = anything that came in through the public form, plus any record
  // explicitly in a non-approved state.
  const applications = all
    .filter((r) => !!r.appliedAt || (r.status !== undefined && r.status !== "APPROVED"))
    .sort((a, b) => (b.appliedAt ?? b.createdAt).localeCompare(a.appliedAt ?? a.createdAt));
  const frontendUrl = (process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, "");

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
        <div>
          <Typography variant="h5" fontWeight={600}>
            Reviewer Applications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Applications submitted through the public &quot;Become a Reviewer&quot; page.
          </Typography>
        </div>
        <Button component={Link} href="/reviewers" startIcon={<ArrowBackIcon />}>
          All reviewers
        </Button>
      </Stack>
      <ApplicationsBoard applications={applications} frontendUrl={frontendUrl} />
    </>
  );
}
