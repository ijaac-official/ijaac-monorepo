"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import type { BookSubmissionStatus } from "@ijaac/shared";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Link from "next/link";

type Action = "UNDER_REVIEW" | "ACCEPTED" | "REJECTED" | "PUBLISH";

const CONFIRM: Record<Action, { title: string; text: string; button: string; color: "primary" | "error" | "success" | "secondary" }> = {
  UNDER_REVIEW: {
    title: "Mark as under review?",
    text: "The status changes to Under Review. No email is sent.",
    button: "Mark Under Review",
    color: "primary",
  },
  ACCEPTED: {
    title: "Accept this book?",
    text: "The author is told the book has been accepted (if notify is ticked). You can then publish it to the Books page.",
    button: "Accept",
    color: "success",
  },
  REJECTED: {
    title: "Reject this book?",
    text: "This is final. The author is told the publication request was not accepted (if notify is ticked).",
    button: "Reject",
    color: "error",
  },
  PUBLISH: {
    title: "Publish to the Books page?",
    text: "A public Book listing is created with this title, the authors, the synopsis and the cover (copied to public storage). You can edit it later on the Books page.",
    button: "Publish",
    color: "secondary",
  },
};

export default function BookSubmissionActions({
  id,
  status,
  publishedBookId,
  reviewComment,
}: {
  id: string;
  status: BookSubmissionStatus;
  publishedBookId?: string;
  reviewComment?: string;
}) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [comment, setComment] = React.useState("");
  const [purchaseLink, setPurchaseLink] = React.useState("");
  const [notify, setNotify] = React.useState(true);
  const [confirm, setConfirm] = React.useState<Action | null>(null);
  const [loading, setLoading] = React.useState<Action | null>(null);

  const run = async (action: Action) => {
    setLoading(action);
    try {
      const res =
        action === "PUBLISH"
          ? await fetch(`/api/book-submissions/${id}/publish`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ purchaseLink: purchaseLink.trim() || undefined, notify }),
            })
          : await fetch(`/api/book-submissions/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: action, reviewComment: comment.trim() || undefined, notify }),
            });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof body?.error === "string" ? body.error : "Update failed");
      const base: Record<Action, string> = {
        UNDER_REVIEW: "Marked as under review",
        ACCEPTED: "Book accepted",
        REJECTED: "Book rejected",
        PUBLISH: "Published to the Books page",
      };
      const mailNote = action === "UNDER_REVIEW" || !notify ? "" : body.emailed ? " - author notified" : " - email could not be sent";
      enqueueSnackbar(base[action] + mailNote, { variant: body.emailed === false && notify && action !== "UNDER_REVIEW" ? "warning" : "success" });
      setConfirm(null);
      setComment("");
      router.refresh();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : "Update failed", { variant: "error" });
    } finally {
      setLoading(null);
    }
  };

  const readOnly = status === "REJECTED" || status === "PUBLISHED";

  return (
    <Paper variant="outlined" sx={{ p: 2.5, minWidth: 0 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Editorial Decision
      </Typography>

      {readOnly ? (
        <Stack spacing={1.5}>
          <Alert severity={status === "PUBLISHED" ? "success" : "info"}>
            {status === "PUBLISHED"
              ? "This book is published on the Books page. This submission is now read-only."
              : "This submission was rejected and is read-only."}
          </Alert>
          {status === "PUBLISHED" && publishedBookId && (
            <Button component={Link} href="/books" variant="outlined">
              Edit listing on Books page
            </Button>
          )}
          {reviewComment && (
            <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>
              <b>Editor comment:</b> {reviewComment}
            </Typography>
          )}
        </Stack>
      ) : (
        <Stack spacing={2}>
          {status !== "ACCEPTED" && (
            <TextField
              label="Comment to the author (optional)"
              multiline
              minRows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              inputProps={{ maxLength: 3000 }}
              fullWidth
            />
          )}
          {status === "ACCEPTED" && (
            <TextField
              label="Purchase / details link (optional)"
              value={purchaseLink}
              onChange={(e) => setPurchaseLink(e.target.value)}
              helperText="Leave empty to use the IJAAC Books page as a placeholder - editable later"
              fullWidth
            />
          )}
          <FormControlLabel
            control={<Checkbox checked={notify} onChange={(e) => setNotify(e.target.checked)} />}
            label="Email the author"
          />
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {status === "PENDING" && (
              <Button variant="outlined" disabled={!!loading} onClick={() => setConfirm("UNDER_REVIEW")}>
                Under Review
              </Button>
            )}
            {(status === "PENDING" || status === "UNDER_REVIEW") && (
              <>
                <Button variant="contained" color="success" disabled={!!loading} onClick={() => setConfirm("ACCEPTED")}>
                  Accept
                </Button>
                <Button variant="outlined" color="error" disabled={!!loading} onClick={() => setConfirm("REJECTED")}>
                  Reject
                </Button>
              </>
            )}
            {status === "ACCEPTED" && (
              <Button variant="contained" color="secondary" disabled={!!loading} onClick={() => setConfirm("PUBLISH")}>
                Publish to Books page
              </Button>
            )}
          </Stack>
        </Stack>
      )}

      <Dialog open={!!confirm} onClose={() => !loading && setConfirm(null)} maxWidth="xs" fullWidth>
        {confirm && (
          <>
            <DialogTitle>{CONFIRM[confirm].title}</DialogTitle>
            <DialogContent>
              <DialogContentText>{CONFIRM[confirm].text}</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirm(null)} disabled={!!loading}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color={CONFIRM[confirm].color}
                onClick={() => run(confirm)}
                disabled={!!loading}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                {CONFIRM[confirm].button}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Paper>
  );
}
