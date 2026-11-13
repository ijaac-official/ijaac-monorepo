"use client";

// Rendered on the admin submission detail page. Props are a fixed contract; do not change.
import * as React from "react";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import type { ReviewAssignment, ReviewAssignmentStatus } from "@ijaac/shared";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DoNotDisturbOnOutlinedIcon from "@mui/icons-material/DoNotDisturbOnOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ReplayIcon from "@mui/icons-material/Replay";
import EditNoteIcon from "@mui/icons-material/EditNote";
import SendIcon from "@mui/icons-material/Send";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

type ReviewerOption = {
  id: string;
  name: string;
  email?: string;
  designation?: string;
  affiliation?: string;
  country?: string;
  photoUrl: string;
  areasOfInterest: string[];
  eligible: boolean;
  matchScore: number;
  matchedAreas: string[];
  completedReviews: number;
  activeAssignments: number;
};

const STATUS_CHIP: Record<ReviewAssignmentStatus, { label: string; color: "info" | "success" | "default" }> = {
  ASSIGNED: { label: "Assigned", color: "info" },
  COMPLETED: { label: "Completed", color: "success" },
  DECLINED: { label: "Declined", color: "default" },
};

function fmtDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

type DialogState =
  | { kind: "complete"; reviewerId: string; recommendation: string }
  | { kind: "remove"; reviewerId: string }
  | null;

export default function ReviewerAssignmentPanel({
  submissionId,
  assignments: initialAssignments,
}: {
  submissionId: string;
  assignments: ReviewAssignment[];
}) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [assignments, setAssignments] = React.useState<ReviewAssignment[]>(initialAssignments);
  const [reviewers, setReviewers] = React.useState<ReviewerOption[] | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<ReviewerOption[]>([]);
  const [assigning, setAssigning] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [dialog, setDialog] = React.useState<DialogState>(null);

  React.useEffect(() => setAssignments(initialAssignments), [initialAssignments]);

  const loadReviewers = React.useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/reviewers`, { cache: "no-store" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed to load reviewers");
      const data = (await res.json()) as { reviewers: ReviewerOption[] };
      setReviewers(data.reviewers);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load reviewers");
      setReviewers([]);
    }
  }, [submissionId]);

  React.useEffect(() => {
    void loadReviewers();
  }, [loadReviewers]);

  const byId = React.useMemo(() => new Map((reviewers ?? []).map((r) => [r.id, r])), [reviewers]);
  const assignedIds = new Set(assignments.map((a) => a.reviewerId));
  const options = (reviewers ?? []).filter((r) => r.eligible && !assignedIds.has(r.id));
  const counts = {
    ASSIGNED: assignments.filter((a) => a.status === "ASSIGNED").length,
    COMPLETED: assignments.filter((a) => a.status === "COMPLETED").length,
    DECLINED: assignments.filter((a) => a.status === "DECLINED").length,
  };

  const assign = async () => {
    if (!selected.length) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/reviewers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerIds: selected.map((r) => r.id) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not assign reviewers");
      setAssignments(data.assignments);
      const notified: string[] = data.notified ?? [];
      const failed: { name: string }[] = data.failed ?? [];
      if (notified.length) {
        enqueueSnackbar(
          `Assigned and notified ${notified.length} ${notified.length === 1 ? "reviewer" : "reviewers"}`,
          { variant: "success" }
        );
      } else if ((data.added ?? []).length) {
        enqueueSnackbar("Reviewers assigned", { variant: "success" });
      } else {
        enqueueSnackbar("Those reviewers were already assigned", { variant: "info" });
      }
      if (failed.length) {
        enqueueSnackbar(`Invitation email failed for: ${failed.map((f) => f.name).join(", ")}`, {
          variant: "warning",
          autoHideDuration: 8000,
        });
      }
      setSelected([]);
      router.refresh();
      void loadReviewers();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : "Could not assign reviewers", { variant: "error" });
    } finally {
      setAssigning(false);
    }
  };

  const patch = async (reviewerId: string, body: { status?: ReviewAssignmentStatus; recommendation?: string }, msg: string) => {
    setBusy(reviewerId);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/reviewers/${reviewerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Update failed");
      setAssignments(data.assignments);
      enqueueSnackbar(msg, { variant: "success" });
      router.refresh();
      void loadReviewers();
      return true;
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : "Update failed", { variant: "error" });
      return false;
    } finally {
      setBusy(null);
    }
  };

  const remove = async (reviewerId: string) => {
    setBusy(reviewerId);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/reviewers/${reviewerId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not remove");
      setAssignments(data.assignments);
      enqueueSnackbar("Assignment removed", { variant: "success" });
      router.refresh();
      void loadReviewers();
      return true;
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : "Could not remove", { variant: "error" });
      return false;
    } finally {
      setBusy(null);
    }
  };

  const confirmDialog = async () => {
    if (!dialog) return;
    const ok =
      dialog.kind === "complete"
        ? await patch(
            dialog.reviewerId,
            { status: "COMPLETED", recommendation: dialog.recommendation.trim() },
            "Review marked as completed"
          )
        : await remove(dialog.reviewerId);
    if (ok) setDialog(null);
  };

  const dialogReviewer = dialog ? byId.get(dialog.reviewerId) : undefined;
  const dialogAssignment = dialog ? assignments.find((a) => a.reviewerId === dialog.reviewerId) : undefined;

  return (
    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <AssignmentIndIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={600}>
            Peer reviewers
          </Typography>
        </Stack>
        {assignments.length > 0 && (
          <Stack direction="row" spacing={1}>
            <Chip size="small" color="info" variant="outlined" label={`${counts.ASSIGNED} in progress`} />
            <Chip size="small" color="success" variant="outlined" label={`${counts.COMPLETED} completed`} />
            {counts.DECLINED > 0 && <Chip size="small" variant="outlined" label={`${counts.DECLINED} declined`} />}
          </Stack>
        )}
      </Stack>

      {assignments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No reviewers assigned yet. Pick reviewers below - the best expertise matches are listed first.
        </Typography>
      ) : (
        <Stack divider={<Divider flexItem />} sx={{ mb: 2, border: 1, borderColor: "divider" }}>
          {assignments.map((a) => {
            const r = byId.get(a.reviewerId);
            const chip = STATUS_CHIP[a.status];
            const isBusy = busy === a.reviewerId;
            return (
              <Stack
                key={a.reviewerId}
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ sm: "center" }}
                sx={{ p: 1.5, opacity: a.status === "DECLINED" ? 0.7 : 1 }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1, minWidth: 0 }}>
                  {reviewers === null ? (
                    <Skeleton variant="circular" width={40} height={40} />
                  ) : (
                    <Avatar src={r?.photoUrl} alt={r?.name} sx={{ width: 40, height: 40 }} />
                  )}
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography variant="body2" fontWeight={600}>
                        {reviewers === null ? <Skeleton width={120} /> : r?.name ?? "Unknown reviewer (deleted)"}
                      </Typography>
                      <Chip size="small" label={chip.label} color={chip.color} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" component="div">
                      Assigned {fmtDate(a.assignedAt)}
                      {a.completedAt ? ` - completed ${fmtDate(a.completedAt)}` : ""}
                      {r?.email ? ` - ${r.email}` : ""}
                    </Typography>
                    {a.recommendation && (
                      <Typography variant="body2" sx={{ mt: 0.5, fontStyle: "italic" }}>
                        Recommendation: {a.recommendation}
                      </Typography>
                    )}
                  </Box>
                </Stack>
                <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                  {isBusy && <CircularProgress size={20} sx={{ alignSelf: "center", mr: 1 }} />}
                  {a.status !== "COMPLETED" ? (
                    <Tooltip title="Mark review completed">
                      <span>
                        <IconButton
                          size="small"
                          color="success"
                          disabled={isBusy}
                          onClick={() =>
                            setDialog({ kind: "complete", reviewerId: a.reviewerId, recommendation: a.recommendation ?? "" })
                          }
                        >
                          <CheckCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Edit recommendation">
                      <span>
                        <IconButton
                          size="small"
                          disabled={isBusy}
                          onClick={() =>
                            setDialog({ kind: "complete", reviewerId: a.reviewerId, recommendation: a.recommendation ?? "" })
                          }
                        >
                          <EditNoteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                  {a.status === "ASSIGNED" ? (
                    <Tooltip title="Mark declined">
                      <span>
                        <IconButton
                          size="small"
                          disabled={isBusy}
                          onClick={() => patch(a.reviewerId, { status: "DECLINED" }, "Marked as declined")}
                        >
                          <DoNotDisturbOnOutlinedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Reopen (back to Assigned)">
                      <span>
                        <IconButton
                          size="small"
                          disabled={isBusy}
                          onClick={() => patch(a.reviewerId, { status: "ASSIGNED" }, "Assignment reopened")}
                        >
                          <ReplayIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                  <Tooltip title="Remove assignment">
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={isBusy}
                        onClick={() => setDialog({ kind: "remove", reviewerId: a.reviewerId })}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </Stack>
            );
          })}
        </Stack>
      )}

      {loadError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => void loadReviewers()}>
              Retry
            </Button>
          }
        >
          {loadError}
        </Alert>
      )}

      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "flex-start" }}>
        <Autocomplete
          multiple
          fullWidth
          size="small"
          loading={reviewers === null}
          options={options}
          value={selected}
          onChange={(_e, v) => setSelected(v)}
          getOptionLabel={(o) => o.name}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          groupBy={(o) => (o.matchScore > 0 ? "Suggested - matches paper keywords" : "Other approved reviewers")}
          filterOptions={(opts, state) => {
            const q = state.inputValue.trim().toLowerCase();
            if (!q) return opts;
            return opts.filter((o) =>
              [o.name, o.email ?? "", o.affiliation ?? "", ...o.areasOfInterest].join(" ").toLowerCase().includes(q)
            );
          }}
          noOptionsText={reviewers?.length ? "No other approved reviewers" : "No approved reviewers yet"}
          renderOption={(props, o) => {
            const { key, ...rest } = props as React.HTMLAttributes<HTMLLIElement> & { key: string };
            return (
              <li key={key} {...rest}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ width: "100%", py: 0.5 }}>
                  <Avatar src={o.photoUrl} sx={{ width: 32, height: 32, mt: 0.25 }} />
                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" fontWeight={600}>
                        {o.name}
                      </Typography>
                      {o.matchScore > 0 && (
                        <Chip
                          size="small"
                          color="secondary"
                          icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                          label={o.matchedAreas.length ? `${o.matchedAreas.length} match` : "match"}
                          sx={{ height: 20, fontSize: 11 }}
                        />
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" component="div" noWrap>
                      {[o.designation, o.affiliation].filter(Boolean).join(", ")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" component="div">
                      {o.activeAssignments} active - {o.completedReviews} completed
                    </Typography>
                    {o.areasOfInterest.length > 0 && (
                      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                        {o.areasOfInterest.slice(0, 6).map((area) => (
                          <Chip
                            key={area}
                            label={area}
                            size="small"
                            variant={o.matchedAreas.includes(area) ? "filled" : "outlined"}
                            color={o.matchedAreas.includes(area) ? "primary" : "default"}
                            sx={{ height: 20, fontSize: 11, borderRadius: 999 }}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Stack>
              </li>
            );
          }}
          renderTags={(tags, getTagProps) =>
            tags.map((t, index) => {
              const { key, ...rest } = getTagProps({ index });
              return <Chip key={key} size="small" avatar={<Avatar src={t.photoUrl} />} label={t.name} {...rest} />;
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Add reviewers"
              placeholder={selected.length ? "" : "Search by name, institution or expertise"}
            />
          )}
        />
        <Button
          variant="contained"
          onClick={assign}
          disabled={!selected.length || assigning}
          startIcon={assigning ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
          sx={{ flexShrink: 0, whiteSpace: "nowrap", height: 40 }}
        >
          {assigning ? "Assigning..." : `Assign & notify${selected.length ? ` (${selected.length})` : ""}`}
        </Button>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        Each new reviewer receives an invitation email with the title, abstract excerpt and keywords. The manuscript
        file is not attached - share it once they accept.
      </Typography>

      <Dialog open={!!dialog} onClose={() => !busy && setDialog(null)} fullWidth maxWidth="sm">
        {dialog?.kind === "complete" && (
          <>
            <DialogTitle>
              {dialogAssignment?.status === "COMPLETED" ? "Edit recommendation" : "Mark review completed"}
            </DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ mb: 2 }}>
                {dialogReviewer?.name ?? "This reviewer"} will be credited with a completed review on their public
                profile.
              </DialogContentText>
              <TextField
                autoFocus
                fullWidth
                multiline
                minRows={3}
                label="Recommendation (optional)"
                placeholder="e.g. Accept with minor revisions"
                value={dialog.recommendation}
                onChange={(e) => setDialog({ ...dialog, recommendation: e.target.value })}
              />
              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75, mt: 1.5 }}>
                {["Accept", "Minor revisions", "Major revisions", "Reject"].map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    size="small"
                    variant="outlined"
                    onClick={() => setDialog({ ...dialog, recommendation: s })}
                  />
                ))}
              </Stack>
            </DialogContent>
          </>
        )}
        {dialog?.kind === "remove" && (
          <>
            <DialogTitle>Remove assignment?</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Remove {dialogReviewer?.name ?? "this reviewer"} from this paper? This does not email the reviewer.
                {dialogAssignment?.status === "COMPLETED"
                  ? " Their completed review will no longer count on their public profile."
                  : ""}
              </DialogContentText>
            </DialogContent>
          </>
        )}
        <DialogActions>
          <Button onClick={() => setDialog(null)} disabled={!!busy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={dialog?.kind === "remove" ? "error" : "primary"}
            onClick={confirmDialog}
            disabled={!!busy}
            startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {dialog?.kind === "remove" ? "Remove" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
