import Typography from "@mui/material/Typography";
import { listEditorialBoard } from "@ijaac/data-store";
import EditorialBoardManager from "@/components/EditorialBoardManager";

export const revalidate = 0;

export default async function EditorialBoardAdminPage() {
  const members = await listEditorialBoard().catch(() => []);
  return (
    <>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Editorial Board
      </Typography>
      <EditorialBoardManager initialMembers={members} />
    </>
  );
}
