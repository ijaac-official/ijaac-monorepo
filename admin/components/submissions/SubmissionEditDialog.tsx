"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import EditIcon from "@mui/icons-material/Edit";
import { SUBMISSION_STATUSES, type Issue, type Submission, type SubmissionStatus } from "@ijaac/shared";
import AuthorsEditor, { fromAuthorDrafts, toAuthorDrafts, type AuthorDraft } from "./AuthorsEditor";
import KeywordsInput from "./KeywordsInput";
import { STATUS_LABELS, issueLabel, readError } from "./meta";

type FormState = {
  title: string;
  abstract: string;
  keywords: string[];
  authors: AuthorDraft[];
  correspondingEmail: string;
  correspondingPhone: string;
  issueId: string;
  volume: string;
  issueNumber: string;
  articleNumber: string;
  publishedAt: string; // YYYY-MM-DD
  reviewComment: string;
  status: SubmissionStatus;
};

function initialState(s: Submission): FormState {
  return {
    title: s.title,
    abstract: s.abstract,
    keywords: [...s.keywords],
    authors: toAuthorDrafts(s.authors),
    correspondingEmail: s.correspondingEmail,
    correspondingPhone: s.correspondingPhone ?? "",
    issueId: s.issueId ?? "",
    volume: s.volume ?? "",
    issueNumber: s.issueNumber ?? "",
    articleNumber: s.articleNumber ?? "",
    publishedAt: s.publishedAt ? s.publishedAt.slice(0, 10) : "",
    reviewComment: s.reviewComment ?? "",
    status: s.status,
  };
}

export default function SubmissionEditDialog({ submission, issues }: { submission: Submission; issues: Issue[] }) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(() => initialState(submission));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const openDialog = () => {
    setForm(initialState(submission));
    setError(null);
    setOpen(true);
  };

  const onIssueChange = (issueId: string) => {
    const issue = issues.find((i) => i.id === issueId);
    setForm((f) => ({
      ...f,
      issueId,
      volume: issue ? issue.volume : f.volume,
      issueNumber: issue ? issue.number : f.issueNumber,
    }));
  };

  const validate = (): string | null => {
    if (form.title.trim().length < 3) return "Title is too short";
    if (form.abstract.trim().length < 10) return "Abstract is too short";
    if (form.authors.length === 0) return "At least one author is required";
    for (const [i, a] of form.authors.entries()) {
      if (a.name.trim().length < 2) return `Author ${i + 1}: name is required`;
      if (!/^\S+@\S+\.\S+$/.test(a.email.trim())) return `Author ${i + 1}: a valid email is required`;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.correspondingEmail.trim())) return "A valid corresponding email is required";
    return null;
  };

  const save = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Empty strings clear the optional field server-side.
      const payload = {
        title: form.title.trim(),
        abstract: form.abstract.trim(),
        keywords: form.keywords,
        authors: fromAuthorDrafts(form.authors),
        correspondingEmail: form.correspondingEmail.trim(),
        correspondingPhone: form.correspondingPhone.trim(),
        issueId: form.issueId,
        volume: form.volume.trim(),
        issueNumber: form.issueNumber.trim(),
        articleNumber: form.articleNumber.trim(),
        publishedAt: form.publishedAt ? new Date(`${form.publishedAt}T00:00:00.000Z`).toISOString() : "",
        reviewComment: form.reviewComment.trim(),
        status: form.status,
      };
      const res = await fetch(`/api/submissions/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await readError(res, "Save failed"));
      enqueueSnackbar("Submission updated", { variant: "success" });
      setOpen(false);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setError(msg);
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const statusChanged = form.status !== submission.status;

  return (
    <>
      <Button variant="outlined" startIcon={<EditIcon />} onClick={openDialog}>
        Edit
      </Button>
      <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="md" scroll="paper">
        <DialogTitle>Edit Submission</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Title" fullWidth required value={form.title} onChange={(e) => set("title", e.target.value)} />
            <TextField
              label="Abstract"
              fullWidth
              required
              multiline
              minRows={5}
              value={form.abstract}
              onChange={(e) => set("abstract", e.target.value)}
              helperText={`${form.abstract.length} characters`}
            />
            <KeywordsInput value={form.keywords} onChange={(v) => set("keywords", v)} />

            <Divider />
            <Typography variant="subtitle2" fontWeight={600}>
              Authors
            </Typography>
            <AuthorsEditor
              value={form.authors}
              onChange={(v) => set("authors", v)}
              onCorrespondingChange={(email) => set("correspondingEmail", email)}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={7}>
                <TextField
                  label="Corresponding Email"
                  type="email"
                  fullWidth
                  required
                  value={form.correspondingEmail}
                  onChange={(e) => set("correspondingEmail", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  label="Corresponding Phone"
                  fullWidth
                  value={form.correspondingPhone}
                  onChange={(e) => set("correspondingPhone", e.target.value)}
                />
              </Grid>
            </Grid>

            <Divider />
            <Typography variant="subtitle2" fontWeight={600}>
              Publication
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Issue"
                  fullWidth
                  value={form.issueId}
                  onChange={(e) => onIssueChange(e.target.value)}
                  helperText="Selecting an issue fills in volume and issue number"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {issues.map((issue) => (
                    <MenuItem key={issue.id} value={issue.id}>
                      {issueLabel(issue)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField label="Volume" fullWidth value={form.volume} onChange={(e) => set("volume", e.target.value)} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  label="Issue No."
                  fullWidth
                  value={form.issueNumber}
                  onChange={(e) => set("issueNumber", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Article Number"
                  fullWidth
                  placeholder="e009"
                  value={form.articleNumber}
                  onChange={(e) => set("articleNumber", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Published Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={form.publishedAt}
                  onChange={(e) => set("publishedAt", e.target.value)}
                />
              </Grid>
            </Grid>

            <Divider />
            <Typography variant="subtitle2" fontWeight={600}>
              Review
            </Typography>
            <TextField
              select
              label="Status"
              fullWidth
              value={form.status}
              onChange={(e) => set("status", e.target.value as SubmissionStatus)}
            >
              {SUBMISSION_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </MenuItem>
              ))}
            </TextField>
            {statusChanged && (
              <Alert severity="warning">
                Changing the status here only updates the record - no emails, certificates or typesetting. Use the
                Editorial Decision panel for the normal workflow.
              </Alert>
            )}
            <TextField
              label="Review Comment"
              fullWidth
              multiline
              minRows={3}
              value={form.reviewComment}
              onChange={(e) => set("reviewComment", e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
