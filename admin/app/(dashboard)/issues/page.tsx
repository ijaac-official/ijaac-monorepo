import Typography from "@mui/material/Typography";
import { listIssues } from "@ijaac/data-store";
import IssuesManager from "@/components/IssuesManager";

export const revalidate = 0;

export default async function IssuesAdminPage() {
  const issues = await listIssues().catch(() => []);
  return (
    <>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Issues
      </Typography>
      <IssuesManager initialIssues={issues} />
    </>
  );
}
