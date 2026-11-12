import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import { notFound } from "next/navigation";
import { getSubmission, listIssues } from "@ijaac/data-store";
import { presignGetUrl } from "@ijaac/aws";
import DecisionPanel from "@/components/DecisionPanel";

export const revalidate = 0;

export default async function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const submission = await getSubmission(params.id);
  if (!submission) notFound();

  const [fileUrl, issues] = await Promise.all([
    presignGetUrl(submission.fileKey).catch(() => null),
    listIssues().catch(() => []),
  ]);

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          {submission.title}
        </Typography>
        <Chip label={submission.status.replace("_", " ")} color="primary" />
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Abstract
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {submission.abstract}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Keywords
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
              {submission.keywords.map((kw) => (
                <Chip key={kw} label={kw} size="small" />
              ))}
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Authors
            </Typography>
            {submission.authors.map((a) => (
              <Typography key={a.email} variant="body2">
                {a.name} ({a.email}){a.affiliation ? ` - ${a.affiliation}` : ""}
                {a.isCorresponding ? " · Corresponding" : ""}
              </Typography>
            ))}
          </Paper>

          <DecisionPanel submissionId={submission.id} currentStatus={submission.status} issues={issues} />
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Manuscript File
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {submission.fileName}
            </Typography>
            {fileUrl ? (
              <Button href={fileUrl} target="_blank" rel="noopener noreferrer" variant="contained" fullWidth>
                View / Download
              </Button>
            ) : (
              <Typography variant="body2" color="error">
                Could not generate file link.
              </Typography>
            )}
          </Paper>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Submission Details
            </Typography>
            <Typography variant="body2">
              <b>Corresponding Email:</b> {submission.correspondingEmail}
            </Typography>
            {submission.correspondingPhone && (
              <Typography variant="body2">
                <b>Phone:</b> {submission.correspondingPhone}
              </Typography>
            )}
            <Typography variant="body2">
              <b>Submitted:</b> {new Date(submission.submittedAt).toLocaleString()}
            </Typography>
            {submission.reviewComment && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <b>Last Comment:</b> {submission.reviewComment}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
