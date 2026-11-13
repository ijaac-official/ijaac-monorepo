"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import type { Coupon } from "@ijaac/shared";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Paper from "@mui/material/Paper";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import CircularProgress from "@mui/material/CircularProgress";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

type FormState = {
  id?: string;
  code: string;
  discountPercent: string;
  maxRedemptions: string;
  isActive: boolean;
  redeemedCount: number;
};
const EMPTY: FormState = { code: "", discountPercent: "100", maxRedemptions: "50", isActive: true, redeemedCount: 0 };

async function errorFrom(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => ({}));
  return typeof body?.error === "string" ? body.error : fallback;
}

export default function CouponManager({
  initialCoupons,
  baseFeeInr,
}: {
  initialCoupons: Coupon[];
  baseFeeInr: number;
}) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [toDelete, setToDelete] = React.useState<Coupon | null>(null);

  const isEdit = !!form.id;
  const pct = Math.min(100, Math.max(0, Number(form.discountPercent) || 0));
  const previewInr = pct >= 100 ? 0 : Math.max(1, Math.round(baseFeeInr * (1 - pct / 100)));

  const openCreate = () => {
    setForm(EMPTY);
    setError(null);
    setOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setForm({
      id: c.id,
      code: c.code,
      discountPercent: String(c.discountPercent),
      maxRedemptions: String(c.maxRedemptions),
      isActive: c.isActive,
      redeemedCount: c.redeemedCount,
    });
    setError(null);
    setOpen(true);
  };

  const save = async () => {
    const discountPercent = Number(form.discountPercent);
    const maxRedemptions = Number(form.maxRedemptions);
    if (!Number.isInteger(discountPercent) || discountPercent < 1 || discountPercent > 100) {
      setError("Discount must be a whole number between 1 and 100");
      return;
    }
    if (!Number.isInteger(maxRedemptions) || maxRedemptions < 1) {
      setError("Number of uses must be at least 1");
      return;
    }
    if (isEdit && maxRedemptions < form.redeemedCount) {
      setError(`Number of uses cannot be below the ${form.redeemedCount} already redeemed`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const body = isEdit
        ? { code: form.code.trim().toUpperCase(), discountPercent, maxRedemptions, isActive: form.isActive }
        : { code: form.code.trim().toUpperCase(), discountPercent, maxRedemptions };
      const res = await fetch(isEdit ? `/api/coupons/${form.id}` : "/api/coupons", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await errorFrom(res, "Save failed"));
      enqueueSnackbar(isEdit ? `Coupon ${body.code} updated` : `Coupon ${body.code} created`, { variant: "success" });
      setOpen(false);
      setForm(EMPTY);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setError(msg);
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c: Coupon, isActive: boolean) => {
    setBusyId(c.id);
    try {
      const res = await fetch(`/api/coupons/${c.id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error(await errorFrom(res, "Could not update coupon"));
      enqueueSnackbar(isActive ? `${c.code} reactivated` : `${c.code} stopped`, { variant: "success" });
      router.refresh();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : "Could not update coupon", { variant: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const c = toDelete;
    setBusyId(c.id);
    try {
      const res = await fetch(`/api/coupons/${c.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await errorFrom(res, "Could not delete coupon"));
      enqueueSnackbar(`Coupon ${c.code} deleted`, { variant: "success" });
      setToDelete(null);
      router.refresh();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : "Could not delete coupon", { variant: "error" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Create Coupon
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ overflowX: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Discount</TableCell>
              <TableCell>Redemptions</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {initialCoupons.map((c) => {
              const exhausted = c.redeemedCount >= c.maxRedemptions;
              const busy = busyId === c.id;
              return (
                <TableRow key={c.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{c.code}</TableCell>
                  <TableCell>
                    {c.discountPercent >= 100 ? (
                      <Chip label="100% - Free" size="small" color="secondary" />
                    ) : (
                      `${c.discountPercent}% off`
                    )}
                  </TableCell>
                  <TableCell sx={{ minWidth: 160 }}>
                    <Typography variant="body2">
                      {c.redeemedCount} / {c.maxRedemptions}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, (c.redeemedCount / c.maxRedemptions) * 100)}
                      sx={{ mt: 0.5 }}
                    />
                  </TableCell>
                  <TableCell>
                    {!c.isActive ? (
                      <Chip label="Stopped" size="small" color="error" />
                    ) : exhausted ? (
                      <Chip label="Exhausted" size="small" />
                    ) : (
                      <Chip label="Active" size="small" color="success" />
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {c.isActive ? (
                      <Button size="small" color="error" disabled={busy} onClick={() => toggle(c, false)}>
                        Stop Immediately
                      </Button>
                    ) : (
                      <Button size="small" disabled={busy} onClick={() => toggle(c, true)}>
                        Reactivate
                      </Button>
                    )}
                    <Tooltip title="Edit">
                      <span>
                        <IconButton size="small" disabled={busy} onClick={() => openEdit(c)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={c.redeemedCount > 0 ? "Used coupons cannot be deleted - stop it instead" : "Delete"}>
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={busy || c.redeemedCount > 0}
                          onClick={() => setToDelete(c)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {initialCoupons.length === 0 && (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            No coupons created yet.
          </Typography>
        )}
      </Paper>

      <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{isEdit ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Coupon Code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="EARLYBIRD"
              helperText="Letters, numbers, - and _ only"
              fullWidth
            />
            <TextField
              label="Discount"
              type="number"
              value={form.discountPercent}
              onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
              inputProps={{ min: 1, max: 100 }}
              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              helperText={
                pct >= 100
                  ? `Free submission - checkout is skipped (base fee ₹${baseFeeInr})`
                  : `Authors pay ₹${previewInr} instead of ₹${baseFeeInr}`
              }
              fullWidth
            />
            <TextField
              label="Number of Uses"
              type="number"
              value={form.maxRedemptions}
              onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
              inputProps={{ min: Math.max(1, form.redeemedCount) }}
              helperText={isEdit ? `${form.redeemedCount} already redeemed` : undefined}
              fullWidth
            />
            {isEdit && (
              <FormControlLabel
                control={
                  <Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                }
                label={form.isActive ? "Active" : "Stopped"}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={saving || !form.code.trim()}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {isEdit ? "Save" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete coupon?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Coupon <b>{toDelete?.code}</b> will be permanently deleted. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={busyId === toDelete?.id}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
