import Typography from "@mui/material/Typography";
import { isApprovedReviewer } from "@ijaac/shared";
import { listEditorialBoard, listReviewers } from "@ijaac/data-store";
import EditorialBoardManager from "@/components/EditorialBoardManager";

export const revalidate = 0;

export default async function EditorialBoardAdminPage() {
  const [members, reviewers] = await Promise.all([
    listEditorialBoard().catch(() => []),
    listReviewers().catch(() => []),
  ]);
  const emails = new Set(reviewers.filter(isApprovedReviewer).map((r) => r.email?.toLowerCase()).filter(Boolean));
  const reviewerMemberIds = members
    .filter(
      (m) =>
        reviewers.some((r) => r.sourceBoardMemberId === m.id && isApprovedReviewer(r)) ||
        (!!m.email && emails.has(m.email.toLowerCase()))
    )
    .map((m) => m.id);
  return (
    <>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Editorial Board
      </Typography>
      <EditorialBoardManager initialMembers={members} reviewerMemberIds={reviewerMemberIds} />
    </>
  );
}
