import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import { listIssues } from "@ijaac/data-store";
import ManualSubmissionForm from "@/components/submissions/ManualSubmissionForm";

export const revalidate = 0;

export default async function NewSubmissionPage() {
  const issues = await listIssues().catch(() => []);

  return (
    <>
      <Button component={Link} href="/submissions" startIcon={<ArrowBackIcon />} size="small" sx={{ mb: 1 }}>
        All submissions
      </Button>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Add Paper
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter a paper directly, bypassing the public submission form and checkout. Use this for invited papers or
        manuscripts received by email.
      </Typography>
      <ManualSubmissionForm issues={issues} />
    </>
  );
}
