"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import CircularProgress from "@mui/material/CircularProgress";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import {
  ACCEPTED_MANUSCRIPT_MIME_TYPES,
  MAX_MANUSCRIPT_SIZE_BYTES,
  adminSubmissionSchema,
  type Issue,
} from "@ijaac/shared";
import AuthorsEditor, { EMPTY_AUTHOR, fromAuthorDrafts, type AuthorDraft } from "./AuthorsEditor";
import KeywordsInput from "./KeywordsInput";
import { issueLabel, readError } from "./meta";

export default function ManualSubmissionForm({ issues }: { issues: Issue[] }) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const defaultIssue = issues.find((i) => i.isCurrent)?.id ?? "";

  const [title, setTitle] = React.useState("");
  const [abstract, setAbstract] = React.useState("");
  const [keywords, setKeywords] = React.useState<string[]>([]);
  const [authors, setAuthors] = React.useState<AuthorDraft[]>([{ ...EMPTY_AUTHOR, isCorresponding: true }]);
  const [correspondingEmail, setCorrespondingEmail] = React.useState("");
  const [correspondingPhone, setCorrespondingPhone] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [publishImmediately, setPublishImmediately] = React.useState(false);
  const [issueId, setIssueId] = React.useState(defaultIssue);
  const [saving, setSaving] = React.useState<null | "create" | "publish">(null);
  const [error, setError] = React.useState<string | null>(null);

  const onFile = (f: File | null) => {
    setError(null);
    if (!f) return setFile(null);
    if (!ACCEPTED_MANUSCRIPT_MIME_TYPES.includes(f.type)) {
      setError("Only PDF, DOC, or DOCX files are supported");
      return;
    }
    if (f.size > MAX_MANUSCRIPT_SIZE_BYTES) {
      setError("File exceeds the 20 MB limit");
      return;
    }
    setFile(f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      title: title.trim(),
      abstract: abstract.trim(),
      keywords,
      authors: fromAuthorDrafts(authors),
      correspondingEmail: correspondingEmail.trim(),
      correspondingPhone: correspondingPhone.trim() || undefined,
      publishImmediately,
      issueId: issueId || undefined,
    };
    const parsed = adminSubmissionSchema.safeParse(payload);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setError(issue ? `${issue.path.join(".") || "Form"}: ${issue.message}` : "Please check the form");
      return;
    }
    if (!file) {
      setError("Please attach the manuscript file");
      return;
    }
    if (publishImmediately && !issueId) {
      setError("Select an issue to publish into");
      return;
    }

    setSaving("create");
    let id: string | null = null;
    try {
      const fd = new FormData();
      fd.append("payload", JSON.stringify(parsed.data));
      fd.append("file", file);
      const res = await fetch("/api/submissions/manual", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await readError(res, "Could not create the paper"));
      id = ((await res.json()) as { id: string }).id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not create the paper";
      setError(msg);
      enqueueSnackbar(msg, { variant: "error" });
      setSaving(null);
      return;
    }

    if (publishImmediately) {
      setSaving("publish");
      try {
        const res = await fetch(`/api/submissions/${id}/decision`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "PUBLISHED", issueId }),
        });
        if (!res.ok) throw new Error(await readError(res, "Publishing failed"));
        enqueueSnackbar("Paper added and published", { variant: "success" });
      } catch (err) {
        enqueueSnackbar(
          `Paper added, but publishing failed: ${err instanceof Error ? err.message : "unknown error"}. Publish it from the detail page.`,
          { variant: "warning" }
        );
      }
    } else {
      enqueueSnackbar("Paper added as Approved", { variant: "success" });
    }

    router.push(`/submissions/${id}`);
    router.refresh();
  };

  return (
    <Paper component="form" variant="outlined" sx={{ p: { xs: 2, sm: 3 } }} onSubmit={submit} noValidate>
      <Stack spacing={2.5}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField label="Title" required fullWidth value={title} onChange={(e) => setTitle(e.target.value)} helperText="At least 10 characters" />
        <TextField
          label="Abstract"
          required
          fullWidth
          multiline
          minRows={6}
          value={abstract}
          onChange={(e) => setAbstract(e.target.value)}
          helperText={`${abstract.length} / 5000 characters (minimum 100)`}
        />
        <KeywordsInput value={keywords} onChange={setKeywords} helperText="3 to 10 keywords" />

        <Typography variant="subtitle1" fontWeight={600}>
          Authors
        </Typography>
        <AuthorsEditor value={authors} onChange={setAuthors} onCorrespondingChange={setCorrespondingEmail} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={7}>
            <TextField
              label="Corresponding Email"
              type="email"
              required
              fullWidth
              value={correspondingEmail}
              onChange={(e) => setCorrespondingEmail(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField
              label="Corresponding Phone (optional)"
              fullWidth
              value={correspondingPhone}
              onChange={(e) => setCorrespondingPhone(e.target.value)}
            />
          </Grid>
        </Grid>

        <Typography variant="subtitle1" fontWeight={600}>
          Manuscript
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} sx={{ flexShrink: 0 }}>
            {file ? "Replace File" : "Choose File"}
            <input
              hidden
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </Button>
          <Typography variant="body2" color={file ? "text.primary" : "text.secondary"} sx={{ wordBreak: "break-all" }}>
            {file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)` : "PDF, DOC or DOCX, up to 20 MB"}
          </Typography>
        </Stack>

        <Typography variant="subtitle1" fontWeight={600}>
          Publishing
        </Typography>
        <Alert severity="info">
          The paper is saved as Approved and Public with no checkout and no author emails.
          {publishImmediately ? " It will then be typeset and published into the selected issue." : ""}
        </Alert>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <FormControlLabel
            control={<Switch checked={publishImmediately} onChange={(e) => setPublishImmediately(e.target.checked)} />}
            label="Publish immediately"
          />
          <TextField
            select
            label="Issue"
            size="small"
            value={issueId}
            onChange={(e) => setIssueId(e.target.value)}
            sx={{ minWidth: 280 }}
            required={publishImmediately}
            helperText={publishImmediately ? "Required to publish" : "Optional - assigns the issue now"}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {issues.map((i) => (
              <MenuItem key={i.id} value={i.id}>
                {issueLabel(i)}
                {i.isCurrent ? " (current)" : ""}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          <Button onClick={() => router.push("/submissions")} disabled={!!saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!!saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {saving === "create" ? "Uploading..." : saving === "publish" ? "Publishing..." : publishImmediately ? "Add & Publish" : "Add Paper"}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
