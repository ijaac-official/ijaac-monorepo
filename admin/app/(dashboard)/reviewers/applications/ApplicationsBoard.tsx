"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import type { Reviewer, ReviewerStatus } from "@ijaac/shared";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import ReplayIcon from "@mui/icons-material/Replay";

type Decision = "APPROVED" | "REJECTED" | "PENDING";

const STATUS_COLOR: Record<ReviewerStatus, "warning" | "success" | "error"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "error",
};

function statusOf(r: Reviewer): ReviewerStatus {
  return r.status ?? "APPROVED";
}

function fmtDate(iso?: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function timeAgo(iso?: string): string {
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function orcidHref(orcid: string): string {
  return /^https?:\/\//i.test(orcid) ? orcid : `https://orcid.org/${orcid}`;
}

function DetailRow({ label, children }: { label: string; children?: React.ReactNode }) {
  if (children === undefined || children === null || children === "") return null;
  return (
    <Stack direction="row" spacing={2} sx={{ py: 0.75 }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 130, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" component="div" sx={{ minWidth: 0, wordBreak: "break-word" }}>
        {children}
      </Typography>
    </Stack>
  );
}

export default function ApplicationsBoard({
  applications,
  frontendUrl,
}: {
  applications: Reviewer[];
  frontendUrl: string;
}) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = React.useState<ReviewerStatus>("PENDING");
  const [query, setQuery] = React.useState("");
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState<{ reviewer: Reviewer; decision: Decision } | null>(null);
  const [note, setNote] = React.useState("");
  const [notify, setNotify] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const counts = React.useMemo(() => {
    const c: Record<ReviewerStatus, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
    for (const r of applications) c[statusOf(r)]++;
    return c;
  }, [applications]);

  const visible = applications.filter((r) => {
    if (statusOf(r) !== tab) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [r.name, r.email ?? "", r.affiliation ?? "", r.country ?? "", r.designation ?? "", ...r.areasOfInterest]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  const open = openId ? applications.find((r) => r.id === openId) ?? null : null;

  const startDecision = (reviewer: Reviewer, decision: Decision) => {
    setNote("");
    setNotify(decision !== "PENDING");
    setConfirm({ reviewer, decision });
  };

  const submitDecision = async () => {
    if (!confirm) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/reviewers/${confirm.reviewer.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: confirm.decision,
          note: note.trim() || undefined,
          notify: confirm.decision !== "PENDING" && notify,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not update application");
      const name = confirm.reviewer.name;
      const verb =
        confirm.decision === "APPROVED" ? "approved" : confirm.decision === "REJECTED" ? "rejected" : "moved back to pending";
      enqueueSnackbar(`${name} ${verb}${data.emailSent ? " - email sent" : ""}`, { variant: "success" });
      if (data.emailError) {
        enqueueSnackbar(`Status saved, but the email failed: ${data.emailError}`, {
          variant: "warning",
          autoHideDuration: 8000,
        });
      }
      setConfirm(null);
      setOpenId(null);
      router.refresh();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : "Could not update application", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const actionButtons = (r: Reviewer, size: "small" | "medium" = "small") => {
    const s = statusOf(r);
    return (
      <>
        {s !== "APPROVED" && (
          <Button
            size={size}
            variant="contained"
            color="success"
            startIcon={<CheckIcon />}
            onClick={(e) => {
              e.stopPropagation();
              startDecision(r, "APPROVED");
            }}
          >
            Approve
          </Button>
        )}
        {s !== "REJECTED" && (
          <Button
            size={size}
            variant="outlined"
            color="error"
            startIcon={<CloseIcon />}
            onClick={(e) => {
              e.stopPropagation();
              startDecision(r, "REJECTED");
            }}
          >
            {s === "APPROVED" ? "Revoke" : "Reject"}
          </Button>
        )}
        {s !== "PENDING" && (
          <Button
            size={size}
            startIcon={<ReplayIcon />}
            onClick={(e) => {
              e.stopPropagation();
              startDecision(r, "PENDING");
            }}
          >
            Back to pending
          </Button>
        )}
      </>
    );
  };

  return (
    <>
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ md: "center" }}
          sx={{ px: 2 }}
        >
          <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
            {(["PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
              <Tab
                key={s}
                value={s}
                label={
                  <Badge
                    badgeContent={counts[s]}
                    color={STATUS_COLOR[s]}
                    max={999}
                    showZero={s === "PENDING"}
                    sx={{ "& .MuiBadge-badge": { right: -14 } }}
                  >
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </Badge>
                }
                sx={{ pr: 4 }}
              />
            ))}
          </Tabs>
          <TextField
            size="small"
            placeholder="Search name, institution, expertise"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ my: 1.5, minWidth: { md: 300 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Stack>
      </Paper>

      {visible.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: "center" }}>
          <InboxOutlinedIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography color="text.secondary">
            {query
              ? "No applications match your search."
              : tab === "PENDING"
                ? "No pending applications - you are all caught up."
                : `No ${tab.toLowerCase()} applications yet.`}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {visible.map((r) => (
            <Grid item xs={12} md={6} lg={4} key={r.id}>
              <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <CardActionArea onClick={() => setOpenId(r.id)} sx={{ flexGrow: 1, alignItems: "flex-start" }}>
                  <CardContent>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                      <Avatar src={r.photoUrl} alt={r.name} sx={{ width: 48, height: 48 }} />
                      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600} noWrap>
                          {r.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {[r.designation, r.affiliation].filter(Boolean).join(", ")}
                        </Typography>
                      </Box>
                      <Chip size="small" label={statusOf(r)} color={STATUS_COLOR[statusOf(r)]} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>
                      {[r.country, r.qualification, r.experienceYears !== undefined ? `${r.experienceYears} yrs exp.` : ""]
                        .filter(Boolean)
                        .join(" - ")}
                    </Typography>
                    <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
                      {r.areasOfInterest.slice(0, 5).map((a) => (
                        <Chip key={a} label={a} size="small" variant="outlined" sx={{ borderRadius: 999 }} />
                      ))}
                      {r.areasOfInterest.length > 5 && (
                        <Chip size="small" label={`+${r.areasOfInterest.length - 5}`} sx={{ borderRadius: 999 }} />
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1.5 }}>
                      Applied {timeAgo(r.appliedAt ?? r.createdAt)}
                    </Typography>
                  </CardContent>
                </CardActionArea>
                <Divider />
                <CardActions sx={{ px: 2, py: 1.25, gap: 0.5, flexWrap: "wrap" }}>{actionButtons(r)}</CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Drawer anchor="right" open={!!open} onClose={() => setOpenId(null)} PaperProps={{ sx: { width: { xs: "100%", sm: 520 } } }}>
        {open && (
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2, borderBottom: 1, borderColor: "divider" }}>
              <Typography variant="h6">Application</Typography>
              <IconButton onClick={() => setOpenId(null)} aria-label="Close">
                <CloseIcon />
              </IconButton>
            </Stack>
            <Box sx={{ p: 3, overflowY: "auto", flexGrow: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Avatar src={open.photoUrl} alt={open.name} sx={{ width: 72, height: 72 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6">{open.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {open.designation}
                  </Typography>
                  <Chip size="small" sx={{ mt: 0.5 }} label={statusOf(open)} color={STATUS_COLOR[statusOf(open)]} />
                </Box>
              </Stack>

              <Typography variant="overline" color="text.secondary">
                Contact
              </Typography>
              <DetailRow label="Email">
                {open.email && (
                  <Link href={`mailto:${open.email}`} sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                    <EmailOutlinedIcon fontSize="inherit" />
                    {open.email}
                  </Link>
                )}
              </DetailRow>
              <DetailRow label="Mobile">
                {open.phone && (
                  <Link href={`tel:${open.phone.replace(/[\s-]/g, "")}`} sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                    <PhoneOutlinedIcon fontSize="inherit" />
                    {open.phone}
                  </Link>
                )}
              </DetailRow>

              <Divider sx={{ my: 1.5 }} />
              <Typography variant="overline" color="text.secondary">
                Professional
              </Typography>
              <DetailRow label="Designation">{open.designation}</DetailRow>
              <DetailRow label="Affiliation">{open.affiliation}</DetailRow>
              <DetailRow label="Country">{open.country}</DetailRow>
              <DetailRow label="Qualification">{open.qualification}</DetailRow>
              <DetailRow label="Experience">
                {open.experienceYears !== undefined ? `${open.experienceYears} years` : undefined}
              </DetailRow>

              <Divider sx={{ my: 1.5 }} />
              <Typography variant="overline" color="text.secondary">
                Links
              </Typography>
              <DetailRow label="LinkedIn">
                {open.linkedinUrl && (
                  <Link href={open.linkedinUrl} target="_blank" rel="noopener noreferrer" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                    <LinkedInIcon fontSize="inherit" />
                    {open.linkedinUrl.replace(/^https?:\/\/(www\.)?/, "")}
                  </Link>
                )}
              </DetailRow>
              <DetailRow label="ORCID">
                {open.orcid && (
                  <Link href={orcidHref(open.orcid)} target="_blank" rel="noopener noreferrer">
                    {open.orcid}
                  </Link>
                )}
              </DetailRow>
              {!open.linkedinUrl && !open.orcid && (
                <Typography variant="body2" color="text.secondary">
                  None provided
                </Typography>
              )}

              <Divider sx={{ my: 1.5 }} />
              <Typography variant="overline" color="text.secondary">
                Areas of expertise
              </Typography>
              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75, mt: 0.5, mb: 1 }}>
                {open.areasOfInterest.map((a) => (
                  <Chip key={a} label={a} size="small" color="primary" variant="outlined" sx={{ borderRadius: 999 }} />
                ))}
              </Stack>

              {open.bio && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="overline" color="text.secondary">
                    Bio
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {open.bio}
                  </Typography>
                </>
              )}
              {open.motivation && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="overline" color="text.secondary">
                    Motivation (private)
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "action.hover" }}>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {open.motivation}
                    </Typography>
                  </Paper>
                </>
              )}

              <Divider sx={{ my: 1.5 }} />
              <DetailRow label="Applied">{fmtDate(open.appliedAt ?? open.createdAt)}</DetailRow>
              <DetailRow label="Approved">{open.approvedAt ? fmtDate(open.approvedAt) : undefined}</DetailRow>
              <DetailRow label="Last updated">{fmtDate(open.updatedAt)}</DetailRow>
              {statusOf(open) === "APPROVED" && (
                <Button
                  href={`${frontendUrl}/reviewers/${open.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  endIcon={<OpenInNewIcon />}
                  sx={{ mt: 1, px: 0 }}
                >
                  View public profile
                </Button>
              )}
            </Box>
            <Stack direction="row" spacing={1} sx={{ p: 2, borderTop: 1, borderColor: "divider", flexWrap: "wrap", gap: 1 }}>
              {actionButtons(open, "medium")}
            </Stack>
          </Box>
        )}
      </Drawer>

      <Dialog open={!!confirm} onClose={() => !saving && setConfirm(null)} fullWidth maxWidth="sm">
        {confirm && (
          <>
            <DialogTitle>
              {confirm.decision === "APPROVED"
                ? `Approve ${confirm.reviewer.name}?`
                : confirm.decision === "REJECTED"
                  ? statusOf(confirm.reviewer) === "APPROVED"
                    ? `Revoke ${confirm.reviewer.name}?`
                    : `Reject ${confirm.reviewer.name}?`
                  : `Move ${confirm.reviewer.name} back to pending?`}
            </DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ mb: 2 }}>
                {confirm.decision === "APPROVED"
                  ? "They will appear on the public Reviewer Panel with a verified profile and can be assigned papers."
                  : confirm.decision === "REJECTED"
                    ? "They will not be listed publicly or be available for paper assignments."
                    : "The reviewer will be hidden from the public site until a decision is made."}
              </DialogContentText>
              {confirm.decision === "REJECTED" && (
                <TextField
                  label="Note to the applicant (optional)"
                  placeholder="e.g. We currently have enough reviewers in this area."
                  multiline
                  minRows={3}
                  fullWidth
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={!notify}
                  helperText={notify ? "Included in the polite rejection email" : "Email disabled"}
                  sx={{ mb: 1 }}
                />
              )}
              {confirm.decision !== "PENDING" && (
                <FormControlLabel
                  control={<Checkbox checked={notify} onChange={(e) => setNotify(e.target.checked)} />}
                  label={
                    confirm.decision === "APPROVED"
                      ? `Email ${confirm.reviewer.email ?? "the reviewer"} a welcome message with their profile link`
                      : `Email ${confirm.reviewer.email ?? "the applicant"} about this decision`
                  }
                />
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirm(null)} disabled={saving}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color={confirm.decision === "APPROVED" ? "success" : confirm.decision === "REJECTED" ? "error" : "primary"}
                onClick={submitDecision}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                {confirm.decision === "APPROVED" ? "Approve" : confirm.decision === "REJECTED" ? "Confirm" : "Move to pending"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
