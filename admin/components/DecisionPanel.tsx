"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import type { Issue, SubmissionStatus } from "@ijaac/shared";
import { issueLabel, readError } from "./submissions/meta";

type Action = "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "PUBLISHED" | "UNPUBLISH";

export default function DecisionPanel({
  submissionId,
  currentStatus,
  issues,
  issueId: currentIssueId,
  publishedAt,
  articleNumber,
  decidedAt,
}: {
  submissionId: string;
  currentStatus: SubmissionStatus;
  issues: Issue[];
  issueId?: string;
  publishedAt?: string;
  articleNumber?: string;
  decidedAt?: string;
}) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const defaultIssue = currentIssueId ?? issues.find((i) => i.isCurrent)?.id ?? "";
  const [comment, setComment] = React.useState("");
  const [issueId, setIssueId] = React.useState(defaultIssue);
  const [loading, setLoading] = React.useState<Action | null>(null);
  const [confirm, setConfirm] = React.useState<Action | null>(null);

  React.useEffect(() => setIssueId(defaultIssue), [defaultIssue]);

  const run = async (action: Action) => {
    setLoading(action);
    try {
      let res: Response;
      if (action === "UNPUBLISH") {
        // A plain status patch - posting APPROVED to /decision would re-send
        // the approval email and certificates.
        res = await fetch(`/api/submissions/${submissionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "APPROVED" }),
        });
      } else {
        res = await fetch(`/api/submissions/${submissionId}/decision`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: action,
            reviewComment: comment.trim() || undefined,
            issueId: action === "PUBLISHED" ? issueId || undefined : undefined,
          }),
        });
      }
      if (!res.ok) throw new Error(await readError(res, "Failed to update submission"));
      const messages: Record<Action, string> = {
        UNDER_REVIEW: "Marked as under review",
        APPROVED: "Submission approved - authors notified",
        REJECTED: "Submission rejected - author notified",
        PUBLISHED: "Paper published",
        UNPUBLISH: "Paper unpublished - back to approved",
      };
      enqueueSnackbar(messages[action], { variant: "success" });
      const body = await res.clone().json().catch(() => null);
      const ts = body?.typesetting;
      if (action === "PUBLISHED" && ts && ts.result === "original") {
        enqueueSnackbar(`Published the original file (typesetting skipped: ${ts.reason ?? ts.result})`, { variant: "warning" });
      }
      setComment("");
      setConfirm(null);
      router.refresh();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : "Failed to update submission", { variant: "error" });
    } finally {
      setLoading(null);
    }
  };

  const spinner = (a: Action, inherit = true) =>
    loading === a ? <CircularProgress size={16} color={inherit ? "inherit" : "primary"} /> : undefined;

  const commentField = (
    <TextField
      label="Review comment (sent to the author on approve/reject)"
      multiline
      rows={4}
      fullWidth
      value={comment}
      onChange={(e) => setComment(e.target.value)}
      sx={{ mb: 2 }}
    />
  );

  const issueSelect = (
    <TextField
      select
      label="Publish to issue"
      size="small"
      value={issueId}
      onChange={(e) => setIssueId(e.target.value)}
      sx={{ minWidth: 260 }}
      fullWidth
    >
      {issues.map((issue) => (
        <MenuItem key={issue.id} value={issue.id}>
          {issueLabel(issue)}
          {issue.isCurrent ? " (current)" : ""}
        </MenuItem>
      ))}
    </TextField>
  );

  const selectedIssue = issues.find((i) => i.id === issueId);
  const publishedIssue = issues.find((i) => i.id === currentIssueId);

  let body: React.ReactNode;
  switch (currentStatus) {
    case "PENDING":
    case "UNDER_REVIEW":
      body = (
        <>
          {commentField}
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            {currentStatus === "PENDING" && (
              <Button variant="outlined" disabled={!!loading} onClick={() => run("UNDER_REVIEW")} startIcon={spinner("UNDER_REVIEW", false)}>
                Mark Under Review
              </Button>
            )}
            <Button variant="contained" color="success" disabled={!!loading} onClick={() => setConfirm("APPROVED")}>
              Approve
            </Button>
            <Button variant="contained" color="error" disabled={!!loading} onClick={() => setConfirm("REJECTED")}>
              Reject
            </Button>
          </Stack>
        </>
      );
      break;
    case "APPROVED":
      body = (
        <>
          <Alert severity="success" sx={{ mb: 2 }}>
            Approved{decidedAt ? ` on ${new Date(decidedAt).toLocaleDateString()}` : ""}. Ready to publish.
          </Alert>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
            {issueSelect}
            <Button
              variant="contained"
              disabled={!!loading || !issueId}
              onClick={() => setConfirm("PUBLISHED")}
              sx={{ flexShrink: 0 }}
            >
              Publish
            </Button>
          </Stack>
          {issues.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Create an issue first under Issues.
            </Typography>
          )}
          <Stack direction="row" sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: "divider" }}>
            <Button color="inherit" disabled={!!loading} onClick={() => run("UNDER_REVIEW")} startIcon={spinner("UNDER_REVIEW", false)}>
              Revert to Under Review
            </Button>
          </Stack>
        </>
      );
      break;
    case "REJECTED":
      body = (
        <>
          <Alert severity="error" sx={{ mb: 2 }}>
            This submission was rejected{decidedAt ? ` on ${new Date(decidedAt).toLocaleDateString()}` : ""}.
          </Alert>
          <Button variant="outlined" disabled={!!loading} onClick={() => run("UNDER_REVIEW")} startIcon={spinner("UNDER_REVIEW", false)}>
            Reopen (Under Review)
          </Button>
        </>
      );
      break;
    case "PUBLISHED":
      body = (
        <>
          <Alert severity="success" sx={{ mb: 2 }}>
            Published
            {publishedAt ? ` on ${new Date(publishedAt).toLocaleDateString()}` : ""}
            {publishedIssue ? ` in ${issueLabel(publishedIssue)}` : ""}
            {articleNumber ? ` - article ${articleNumber}` : ""}.
          </Alert>
          <Button color="warning" disabled={!!loading} onClick={() => setConfirm("UNPUBLISH")}>
            Unpublish
          </Button>
        </>
      );
      break;
  }

  const confirmCopy: Partial<Record<Action, { title: string; text: React.ReactNode; label: string; color: "success" | "error" | "primary" | "warning" }>> = {
    APPROVED: {
      title: "Approve this submission?",
      text: "The authors will be emailed the decision and their acceptance certificates.",
      label: "Approve",
      color: "success",
    },
    REJECTED: {
      title: "Reject this submission?",
      text: "The corresponding author will be emailed the rejection along with your review comment.",
      label: "Reject",
      color: "error",
    },
    PUBLISHED: {
      title: "Publish this paper?",
      text: (
        <>
          The paper will be typeset and published{selectedIssue ? <> in <b>{issueLabel(selectedIssue)}</b></> : null}.
          It becomes visible on the public site unless it is set to private.
        </>
      ),
      label: "Publish",
      color: "primary",
    },
    UNPUBLISH: {
      title: "Unpublish this paper?",
      text: "It will move back to Approved and disappear from the public site. No emails are sent.",
      label: "Unpublish",
      color: "warning",
    },
  };
  const c = confirm ? confirmCopy[confirm] : undefined;

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Editorial Decision
      </Typography>
      {body}

      <Dialog open={!!c} onClose={() => !loading && setConfirm(null)} maxWidth="xs" fullWidth>
        {c && (
          <>
            <DialogTitle>{c.title}</DialogTitle>
            <DialogContent>
              <DialogContentText component="div">{c.text}</DialogContentText>
              {confirm === "REJECTED" && !comment.trim() && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No review comment entered - the author will receive the decision without feedback.
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirm(null)} disabled={!!loading}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color={c.color}
                disabled={!!loading}
                onClick={() => confirm && run(confirm)}
                startIcon={confirm ? spinner(confirm) : undefined}
              >
                {c.label}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Paper>
  );
}
