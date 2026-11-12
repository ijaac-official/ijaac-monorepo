import Typography from "@mui/material/Typography";
import { listReviewers } from "@ijaac/data-store";
import ReviewersManager from "@/components/ReviewersManager";

export const revalidate = 0;

export default async function ReviewersAdminPage() {
  const reviewers = await listReviewers().catch(() => []);
  return (
    <>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Reviewers
      </Typography>
      <ReviewersManager initialReviewers={reviewers} />
    </>
  );
}
