"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import type { Issue } from "@ijaac/shared";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ImageUploadField from "./ImageUploadField";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Month (1-12) of a monthly issue. Legacy (bimonthly) issues have no month. */
function monthOf(issue: Pick<Issue, "month">): number | undefined {
  return issue.month && issue.month >= 1 && issue.month <= 12 ? issue.month : undefined;
}

function firstYearOf(issues: Issue[]): number {
  return issues.length ? Math.min(...issues.map((i) => i.year)) : new Date().getFullYear();
}

function autoVolume(year: number, issues: Issue[]): string {
  return String(Math.max(1, year - firstYearOf(issues) + 1));
}

function firstOfMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

type FormState = {
  id?: string;
  year: string;
  /** "" = legacy issue without a month */
  month: string;
  volume: string;
  volumeOverridden: boolean;
  /** Defaults to the month; can be set to any value (e.g. a running issue count). */
  number: string;
  numberEdited: boolean;
  title: string;
  titleEdited: boolean;
  publishDate: string;
  publishDateEdited: boolean;
  description: string;
  coverImageUrl: string;
};

function emptyForm(issues: Issue[]): FormState {
  const now = new Date();
  const year = now.getFullYear();
  // Default to the first month of the current year that has no issue yet.
  let month = now.getMonth() + 1;
  const taken = new Set(issues.filter((i) => i.year === year).map(monthOf));
  if (taken.has(month)) {
    const free = Array.from({ length: 12 }, (_, i) => i + 1).find((m) => !taken.has(m));
    if (free) month = free;
  }
  return {
    year: String(year),
    month: String(month),
    volume: autoVolume(year, issues),
    volumeOverridden: false,
    number: String(month),
    numberEdited: false,
    title: `${MONTHS[month - 1]} ${year}`,
    titleEdited: false,
    publishDate: firstOfMonth(year, month),
    publishDateEdited: false,
    description: "",
    coverImageUrl: "",
  };
}

/** Re-derives auto fields (volume, title, publish date) after year/month change. */
function withDerived(form: FormState, issues: Issue[]): FormState {
  const year = Number(form.year);
  const month = Number(form.month);
  if (!Number.isInteger(year) || year < 1900) return form;
  const next = { ...form };
  if (!next.volumeOverridden) next.volume = autoVolume(year, issues);
  if (month >= 1 && month <= 12) {
    if (!next.numberEdited) next.number = String(month);
    if (!next.titleEdited) next.title = `${MONTHS[month - 1]} ${year}`;
    if (!next.publishDateEdited) next.publishDate = firstOfMonth(year, month);
  }
  return next;
}

export default function IssuesManager({ initialIssues }: { initialIssues: Issue[] }) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(() => emptyForm(initialIssues));
  const [saving, setSaving] = React.useState(false);
  const [generateYear, setGenerateYear] = React.useState(String(new Date().getFullYear()));
  const [generating, setGenerating] = React.useState(false);

  const yearOptions = React.useMemo(() => {
    const current = new Date().getFullYear();
    const years = new Set<number>([current - 1, current, current + 1, ...initialIssues.map((i) => i.year)]);
    return [...years].sort((a, b) => b - a);
  }, [initialIssues]);

  const duplicate = React.useMemo(() => {
    const year = Number(form.year);
    const month = Number(form.month);
    if (!month) return undefined;
    return initialIssues.find((i) => i.id !== form.id && i.year === year && monthOf(i) === month);
  }, [form.year, form.month, form.id, initialIssues]);

  const issuesForGenerateYear = initialIssues.filter((i) => i.year === Number(generateYear) && monthOf(i));
  const missingForGenerateYear = 12 - new Set(issuesForGenerateYear.map(monthOf)).size;

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const updateDerived = (patch: Partial<FormState>) =>
    setForm((f) => withDerived({ ...f, ...patch }, initialIssues));

  const openCreate = () => {
    setForm(emptyForm(initialIssues));
    setOpen(true);
  };

  const openEdit = (issue: Issue) => {
    const month = monthOf(issue);
    setForm({
      id: issue.id,
      year: String(issue.year),
      // Legacy bimonthly issues have no month and keep their number.
      month: month ? String(month) : "",
      volume: issue.volume,
      volumeOverridden: true,
      number: issue.number,
      numberEdited: true,
      title: issue.title ?? "",
      titleEdited: true,
      publishDate: issue.publishDate ? issue.publishDate.slice(0, 10) : "",
      publishDateEdited: true,
      description: issue.description ?? "",
      coverImageUrl: issue.coverImageUrl ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    const year = Number(form.year);
    const month = form.month ? Number(form.month) : undefined;
    if (!Number.isInteger(year) || year < 1900) {
      enqueueSnackbar("Enter a valid year", { variant: "error" });
      return;
    }
    if (!form.volume.trim()) {
      enqueueSnackbar("Volume is required", { variant: "error" });
      return;
    }
    if (!form.number.trim()) {
      enqueueSnackbar("Enter an issue number", { variant: "error" });
      return;
    }
    if (duplicate) {
      enqueueSnackbar(`An issue for ${MONTHS[(month ?? 1) - 1]} ${year} already exists`, { variant: "error" });
      return;
    }

    setSaving(true);
    const payload = {
      year,
      month,
      volume: form.volume.trim(),
      number: form.number.trim(),
      title: form.title.trim() || undefined,
      description: form.description.trim() || undefined,
      coverImageUrl: form.coverImageUrl || (form.id ? "" : undefined),
      publishDate: form.publishDate ? new Date(`${form.publishDate}T00:00:00Z`).toISOString() : undefined,
    };
    try {
      const res = await fetch(form.id ? `/api/issues/${form.id}` : "/api/issues", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(typeof body?.error === "string" ? body.error : "Save failed");
      }
      enqueueSnackbar(form.id ? "Issue updated" : "Issue created", { variant: "success" });
      setOpen(false);
      router.refresh();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : "Save failed", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const setCurrent = async (id: string) => {
    try {
      const res = await fetch(`/api/issues/${id}/set-current`, { method: "POST" });
      if (!res.ok) throw new Error();
      enqueueSnackbar("Current issue updated", { variant: "success" });
      router.refresh();
    } catch {
      enqueueSnackbar("Could not set current issue", { variant: "error" });
    }
  };

  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const setHidden = async (issue: Issue, hidden: boolean) => {
    setTogglingId(issue.id);
    try {
      const res = await fetch(`/api/issues/${issue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHidden: hidden }),
      });
      if (!res.ok) throw new Error();
      const label = issue.title ?? `Vol. ${issue.volume}, Issue ${issue.number}`;
      enqueueSnackbar(
        hidden
          ? `${label} is now hidden from the public site${issue.isCurrent ? " (it is the current issue, so the Current Issue page will be empty)" : ""}`
          : `${label} is now visible on the public site`,
        { variant: hidden && issue.isCurrent ? "warning" : "success" }
      );
      router.refresh();
    } catch {
      enqueueSnackbar("Could not change visibility", { variant: "error" });
    } finally {
      setTogglingId(null);
    }
  };

  const generateAll = async () => {
    const year = Number(generateYear);
    if (!window.confirm(`Create the missing monthly issues for ${year}? Existing months are kept.`)) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/issues/generate-year", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(typeof body?.error === "string" ? body.error : "Generation failed");
      const created = Number(body?.created ?? 0);
      enqueueSnackbar(
        created ? `Created ${created} issue${created === 1 ? "" : "s"} for ${year}` : `All 12 issues for ${year} already exist`,
        { variant: created ? "success" : "info" }
      );
      router.refresh();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : "Generation failed", { variant: "error" });
    } finally {
      setGenerating(false);
    }
  };

  const monthNum = Number(form.month);

  return (
    <>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            select
            size="small"
            label="Year"
            value={generateYear}
            onChange={(e) => setGenerateYear(e.target.value)}
            sx={{ minWidth: 110 }}
          >
            {yearOptions.map((y) => (
              <MenuItem key={y} value={String(y)}>
                {y}
              </MenuItem>
            ))}
          </TextField>
          <Tooltip title={missingForGenerateYear === 0 ? "All 12 months already exist" : `${missingForGenerateYear} month(s) missing`}>
            <span>
              <Button
                variant="outlined"
                startIcon={generating ? <CircularProgress size={14} /> : <AutoAwesomeIcon />}
                onClick={generateAll}
                disabled={generating || missingForGenerateYear === 0}
              >
                Generate all 12 issues for {generateYear}
              </Button>
            </span>
          </Tooltip>
        </Stack>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add Issue
        </Button>
      </Stack>

      <Paper variant="outlined">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cover</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Volume</TableCell>
                <TableCell>Issue No.</TableCell>
                <TableCell>Month</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Public</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {initialIssues.map((issue) => {
                const m = issue.month;
                return (
                  <TableRow key={issue.id} hover>
                    <TableCell>
                      <Box
                        sx={{
                          width: 40,
                          height: 54,
                          bgcolor: "primary.main",
                          backgroundImage: issue.coverImageUrl
                            ? `url(${issue.coverImageUrl})`
                            : "linear-gradient(160deg, #7a1f2b 0%, #4a0f18 100%)",
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Link href={`/issues/${issue.id}`} style={{ color: "inherit", textDecoration: "none", fontWeight: 500 }}>
                        {issue.title ?? `Vol. ${issue.volume}, Issue ${issue.number}`}
                      </Link>
                    </TableCell>
                    <TableCell>{issue.volume}</TableCell>
                    <TableCell>{issue.number}</TableCell>
                    <TableCell>{m ? MONTHS[m - 1] : "-"}</TableCell>
                    <TableCell>{issue.year}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                        {issue.isCurrent && <Chip label="Current" color="primary" size="small" />}
                        {issue.isHidden && <Chip label="Hidden" size="small" variant="outlined" color="warning" />}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={issue.isHidden ? "Hidden from the public site - click to show" : "Visible on the public site - click to hide"}>
                        <Switch
                          size="small"
                          checked={!issue.isHidden}
                          disabled={togglingId === issue.id}
                          onChange={(e) => setHidden(issue, !e.target.checked)}
                          inputProps={{ "aria-label": issue.isHidden ? "Show issue publicly" : "Hide issue from public" }}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <IconButton size="small" aria-label="Edit issue" onClick={() => openEdit(issue)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      {!issue.isCurrent && (
                        <Button size="small" onClick={() => setCurrent(issue.id)}>
                          Set as Current
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {initialIssues.length === 0 && (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            No issues yet. Add one, or generate all 12 monthly issues for a year.
          </Typography>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{form.id ? "Edit Issue" : "Add Issue"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Issues are monthly: one volume per year, 12 issues per volume, issue number = month.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Year"
                type="number"
                value={form.year}
                onChange={(e) => updateDerived({ year: e.target.value })}
                fullWidth
              />
              <TextField
                select
                label="Month"
                value={form.month}
                onChange={(e) => updateDerived({ month: e.target.value })}
                fullWidth
              >
                {form.id && !form.month && <MenuItem value="">None (legacy issue)</MenuItem>}
                {MONTHS.map((name, i) => (
                  <MenuItem key={name} value={String(i + 1)}>
                    {name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            {duplicate && (
              <Alert severity="error">
                {MONTHS[monthNum - 1]} {form.year} already exists
                {duplicate.title ? ` ("${duplicate.title}")` : ""}.
              </Alert>
            )}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Volume"
                value={form.volume}
                onChange={(e) => update({ volume: e.target.value, volumeOverridden: true })}
                helperText={
                  form.volumeOverridden && !form.id ? (
                    <Box
                      component="span"
                      sx={{ cursor: "pointer", textDecoration: "underline" }}
                      onClick={() => setForm((f) => withDerived({ ...f, volumeOverridden: false }, initialIssues))}
                    >
                      Reset to auto ({autoVolume(Number(form.year) || new Date().getFullYear(), initialIssues)})
                    </Box>
                  ) : (
                    `Auto: year - ${firstYearOf(initialIssues)} + 1`
                  )
                }
                fullWidth
              />
              <TextField
                label="Issue Number"
                value={form.number}
                onChange={(e) => update({ number: e.target.value, numberEdited: true })}
                helperText={
                  form.month && form.number !== form.month ? (
                    <Box
                      component="span"
                      sx={{ cursor: "pointer", textDecoration: "underline" }}
                      onClick={() => update({ number: form.month, numberEdited: false })}
                    >
                      Reset to month number ({form.month})
                    </Box>
                  ) : (
                    "Shown as \"Issue N\" on the site"
                  )
                }
                fullWidth
              />
            </Stack>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => update({ title: e.target.value, titleEdited: true })}
              fullWidth
            />
            <TextField
              label="Publish Date"
              type="date"
              value={form.publishDate}
              onChange={(e) => update({ publishDate: e.target.value, publishDateEdited: true })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <ImageUploadField
              label="Issue Cover"
              value={form.coverImageUrl}
              onChange={(url) => update({ coverImageUrl: url })}
              folder="issues"
              variant="rect"
              aspect={3 / 4}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving || !!duplicate}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
