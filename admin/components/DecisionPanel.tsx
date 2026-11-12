"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import type { Issue, SubmissionStatus } from "@ijaac/shared";

export default function DecisionPanel({
  submissionId,
  currentStatus,
  issues,
}: {
  submissionId: string;
  currentStatus: SubmissionStatus;
  issues: Issue[];
}) {
  const router = useRouter();
  const [comment, setComment] = React.useState("");
  const [issueId, setIssueId] = React.useState("");
  const [loading, setLoading] = React.useState<SubmissionStatus | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const decide = async (status: "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "PUBLISHED") => {
    setLoading(status);
    setError(null);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reviewComment: comment || undefined,
          issueId: status === "PUBLISHED" ? issueId || undefined : undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to update submission");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update submission");
    } finally {
      setLoading(null);
    }
  };

  if (currentStatus === "PUBLISHED") {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Alert severity="success">This paper has been published.</Alert>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Editorial Decision
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <TextField
        label="Review comment (sent to author on approve/reject)"
        multiline
        rows={4}
        fullWidth
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Stack direction="row" spacing={1.5} flexWrap="wrap">
        <Button
          variant="outlined"
          disabled={!!loading || currentStatus === "UNDER_REVIEW"}
          onClick={() => decide("UNDER_REVIEW")}
          startIcon={loading === "UNDER_REVIEW" ? <CircularProgress size={16} /> : undefined}
        >
          Mark Under Review
        </Button>
        <Button
          variant="contained"
          color="success"
          disabled={!!loading}
          onClick={() => decide("APPROVED")}
          startIcon={loading === "APPROVED" ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          Approve
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={!!loading}
          onClick={() => decide("REJECTED")}
          startIcon={loading === "REJECTED" ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          Reject
        </Button>
      </Stack>

      {currentStatus === "APPROVED" && (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: "divider" }}>
          <TextField
            select
            label="Publish to issue"
            size="small"
            value={issueId}
            onChange={(e) => setIssueId(e.target.value)}
            sx={{ minWidth: 260 }}
          >
            {issues.map((issue) => (
              <MenuItem key={issue.id} value={issue.id}>
                {issue.title ?? `Vol. ${issue.volume}, Issue ${issue.number}`}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            disabled={!!loading || !issueId}
            onClick={() => decide("PUBLISHED")}
            startIcon={loading === "PUBLISHED" ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            Publish
          </Button>
        </Stack>
      )}
    </Paper>
  );
}
