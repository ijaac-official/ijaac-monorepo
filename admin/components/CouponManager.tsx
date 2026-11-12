"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import AddIcon from "@mui/icons-material/Add";

type FormState = { code: string; discountPercent: string; maxRedemptions: string };
const EMPTY: FormState = { code: "", discountPercent: "100", maxRedemptions: "50" };

export default function CouponManager({
  initialCoupons,
  baseFeeInr,
}: {
  initialCoupons: Coupon[];
  baseFeeInr: number;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const pct = Math.min(100, Math.max(0, Number(form.discountPercent) || 0));
  const previewInr = pct >= 100 ? 0 : Math.max(1, Math.round(baseFeeInr * (1 - pct / 100)));

  const create = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.toUpperCase(),
          discountPercent: Number(form.discountPercent),
          maxRedemptions: Number(form.maxRedemptions) || 1,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Save failed");
      }
      setOpen(false);
      setForm(EMPTY);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (id: string, isActive: boolean) => {
    await fetch(`/api/coupons/${id}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    router.refresh();
  };

  return (
    <>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Create Coupon
        </Button>
      </Stack>

      <Paper variant="outlined">
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
                  <TableCell align="right">
                    {c.isActive ? (
                      <Button size="small" color="error" onClick={() => toggle(c.id, false)}>
                        Stop Immediately
                      </Button>
                    ) : (
                      <Button size="small" onClick={() => toggle(c.id, true)}>
                        Reactivate
                      </Button>
                    )}
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

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Create Coupon</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Coupon Code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="EARLYBIRD"
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
              inputProps={{ min: 1 }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={create} disabled={saving || !form.code.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
