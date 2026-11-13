import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Badge from "@mui/material/Badge";
import Link from "next/link";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import { countCompletedReviews, listReviewers } from "@ijaac/data-store";
import ReviewersManager from "@/components/ReviewersManager";

export const revalidate = 0;

export default async function ReviewersAdminPage() {
  const [all, completed] = await Promise.all([
    listReviewers().catch(() => []),
    countCompletedReviews().catch(() => ({}) as Record<string, number>),
  ]);
  // Pending / rejected applicants are managed on the Applications page.
  const reviewers = all.filter((r) => (r.status ?? "APPROVED") === "APPROVED");
  const pending = all.filter((r) => r.status === "PENDING").length;
  const frontendUrl = (process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, "");

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
        <Typography variant="h5" fontWeight={600}>
          Reviewers
        </Typography>
        <Badge badgeContent={pending} color="warning">
          <Button component={Link} href="/reviewers/applications" variant="outlined" startIcon={<HowToRegIcon />}>
            Applications
          </Button>
        </Badge>
      </Stack>
      <ReviewersManager initialReviewers={reviewers} completedCounts={completed} frontendUrl={frontendUrl} />
    </>
  );
}
