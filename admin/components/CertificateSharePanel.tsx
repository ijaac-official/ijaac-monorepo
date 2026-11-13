"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SendIcon from "@mui/icons-material/Send";

interface SendResponse {
  sent?: number;
  failed?: number;
  skipped?: number;
  error?: string;
  errors?: { author: string; error: string }[];
}

// Fixed time zone so server and client render the same string (no hydration mismatch).
const TZ = "Asia/Kolkata";

/** "13 Nov 2026" */
function formatShortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
}

/** "13 Nov 2026, 14:05" */
function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "an earlier date";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

// Chips never force the panel wider than its column: shrinkable, label truncates with an ellipsis.
const chipSx = {
  minWidth: 0,
  maxWidth: "100%",
  flexShrink: 1,
  "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
} as const;

/**
 * Rendered on the admin submission detail page. Props are a fixed contract.
 */
export default function CertificateSharePanel({
  submissionId,
  status,
  certificatesSentAt,
  authorCount,
}: {
  submissionId: string;
  status: string;
  certificatesSentAt?: string;
  authorCount: number;
}) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const eligible = status === "APPROVED" || status === "PUBLISHED";
  const authorsLabel = `${authorCount} author${authorCount === 1 ? "" : "s"}`;

  const send = async () => {
    setConfirmOpen(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/certificates/send`, { method: "POST" });
      const body: SendResponse = await res.json().catch(() => ({}));
      const sent = body.sent ?? 0;
      const failed = body.failed ?? 0;
      const skipped = body.skipped ?? 0;
      if (!res.ok && !sent) {
        throw new Error(body.error ?? body.errors?.[0]?.error ?? "Failed to send certificates");
      }
      const extra = [failed && `${failed} failed`, skipped && `${skipped} without email`].filter(Boolean).join(", ");
      enqueueSnackbar(
        `Certificate + paper sent to ${sent} author${sent === 1 ? "" : "s"}${extra ? ` (${extra})` : ""}`,
        { variant: failed ? "warning" : "success" }
      );
      router.refresh();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : "Failed to send certificates", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        useFlexGap
        gap={1}
        sx={{ mb: 1.5, minWidth: 0 }}
      >
        <Typography variant="subtitle1" fontWeight={600} sx={{ flexShrink: 0 }}>
          Certificates
        </Typography>
        {certificatesSentAt ? (
          <Chip
            size="small"
            color="success"
            icon={<CheckCircleIcon />}
            label={`Sent ${formatShortDate(certificatesSentAt)}`}
            title={`Shared with authors on ${formatDate(certificatesSentAt)}`}
            sx={chipSx}
          />
        ) : (
          <Chip size="small" variant="outlined" icon={<ScheduleIcon />} label="Not sent yet" sx={chipSx} />
        )}
      </Stack>

      {eligible ? (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, overflowWrap: "anywhere" }}>
            Each author receives their own certificate of publication plus the paper (the typeset
            published PDF if available, otherwise the original manuscript).
          </Typography>
          <Button
            variant={certificatesSentAt ? "outlined" : "contained"}
            fullWidth
            disabled={loading || authorCount === 0}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
            onClick={() => (certificatesSentAt ? setConfirmOpen(true) : send())}
            sx={{ minWidth: 0, whiteSpace: "normal", textAlign: "center", lineHeight: 1.35, py: 1 }}
          >
            {loading
              ? "Sending..."
              : `${certificatesSentAt ? "Resend" : "Send"} certificate + paper to all ${authorsLabel}`}
          </Button>
        </>
      ) : (
        <Alert severity="info" variant="outlined">
          Certificates can be shared once the paper is approved or published.
        </Alert>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Resend?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Certificates were already shared on {certificatesSentAt ? formatDate(certificatesSentAt) : "an earlier date"}.
            Resend the certificate and paper to all {authorsLabel}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={send} autoFocus>
            Resend
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
