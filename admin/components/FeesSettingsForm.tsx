"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import type { JournalSettings } from "@ijaac/shared";
import { formatInr } from "@ijaac/shared";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";

const toInr = (paise: number) => String(Math.round(paise / 100));

function feeError(raw: string): string | null {
  if (!raw.trim()) return "Required";
  const n = Number(raw);
  if (!Number.isInteger(n)) return "Use whole rupees (no paise)";
  if (n < 1) return "Minimum is Rs 1";
  if (n > 500000) return "Fee is too large";
  return null;
}

export default function FeesSettingsForm({ initial, neverSaved }: { initial: JournalSettings; neverSaved: boolean }) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [paper, setPaper] = React.useState(toInr(initial.paperFeeInPaise));
  const [book, setBook] = React.useState(toInr(initial.bookFeeInPaise));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const paperErr = feeError(paper);
  const bookErr = feeError(book);
  const dirty = paper !== toInr(initial.paperFeeInPaise) || book !== toInr(initial.bookFeeInPaise);

  const save = async () => {
    if (paperErr || bookErr) {
      enqueueSnackbar(paperErr ? `Paper fee: ${paperErr}` : `Book fee: ${bookErr}`, { variant: "error" });
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperFeeInr: Number(paper), bookFeeInr: Number(book) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof body?.error === "string" ? body.error : "Could not save fees");
      enqueueSnackbar("Fees updated - new checkouts use these amounts immediately", { variant: "success" });
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save fees";
      setError(msg);
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const preview = (raw: string, err: string | null) => (err ? "-" : formatInr(Number(raw) * 100));

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, maxWidth: 860, minWidth: 0 }}>
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}
        {neverSaved && (
          <Alert severity="info">
            These fees have not been saved yet - the values shown come from the server environment defaults.
          </Alert>
        )}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} sx={{ minWidth: 0 }}>
            <TextField
              label="Paper submission fee"
              type="number"
              value={paper}
              onChange={(e) => setPaper(e.target.value)}
              inputProps={{ min: 1, step: 1, inputMode: "numeric" }}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              error={!!paperErr}
              helperText={paperErr ?? `Currently ${formatInr(initial.paperFeeInPaise)}`}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6} sx={{ minWidth: 0 }}>
            <TextField
              label="Book publication fee"
              type="number"
              value={book}
              onChange={(e) => setBook(e.target.value)}
              inputProps={{ min: 1, step: 1, inputMode: "numeric" }}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              error={!!bookErr}
              helperText={bookErr ?? `Currently ${formatInr(initial.bookFeeInPaise)}`}
              fullWidth
            />
          </Grid>
        </Grid>

        <Divider />

        <div>
          <Typography variant="subtitle2" gutterBottom>
            What authors will pay (before coupons)
          </Typography>
          <Grid container spacing={2}>
            {[
              { label: "Paper submission (/submit-paper)", value: preview(paper, paperErr) },
              { label: "Book publication (/books/publish)", value: preview(book, bookErr) },
            ].map((x) => (
              <Grid item xs={12} sm={6} key={x.label} sx={{ minWidth: 0 }}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                  <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                    {x.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="primary.main">
                    {x.value}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Coupon discounts are applied on top of these amounts; any non-free total is at least ₹1. Orders already
            opened at checkout keep the price they were created with.
          </Typography>
        </div>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between">
          <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
            {neverSaved
              ? "Last updated: never"
              : `Last updated: ${new Date(initial.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}${initial.updatedById ? ` by ${initial.updatedById}` : ""}`}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              disabled={!dirty || saving}
              onClick={() => {
                setPaper(toInr(initial.paperFeeInPaise));
                setBook(toInr(initial.bookFeeInPaise));
              }}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              onClick={save}
              disabled={saving || !dirty || !!paperErr || !!bookErr}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              Save Fees
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
