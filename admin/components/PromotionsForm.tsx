"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { PlatformSettings } from "@ijaac/shared";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";

export default function PromotionsForm({ initialSettings }: { initialSettings: PlatformSettings }) {
  const router = useRouter();
  const [enabled, setEnabled] = React.useState(initialSettings.earlyBirdEnabled);
  const [code, setCode] = React.useState(initialSettings.earlyBirdCouponCode);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ earlyBirdEnabled: enabled, earlyBirdCouponCode: code }),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, maxWidth: 480 }}>
      {saved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Saved.
        </Alert>
      )}
      <Stack spacing={2}>
        <FormControlLabel
          control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
          label={enabled ? "Early-bird free submission: ON" : "Early-bird free submission: OFF"}
        />
        <TextField
          label="Coupon code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          fullWidth
        />
        <Button variant="contained" onClick={save} disabled={saving} sx={{ alignSelf: "flex-start" }}>
          Save
        </Button>
      </Stack>
    </Paper>
  );
}
