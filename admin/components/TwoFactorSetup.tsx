"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Image from "next/image";

export default function TwoFactorSetup({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [qrCode, setQrCode] = React.useState<string | null>(null);
  const [secret, setSecret] = React.useState<string | null>(null);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const startSetup = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/2fa/setup");
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Could not start setup");
      setQrCode(body.qrCodeDataUrl);
      setSecret(body.secret);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start setup");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Verification failed");
      router.refresh();
      setQrCode(null);
      setSecret(null);
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const disable = async () => {
    if (!confirm("Disable 2FA? Anyone with the password alone will be able to sign in.")) return;
    await fetch("/api/2fa/disable", { method: "POST" });
    router.refresh();
  };

  if (enabled) {
    return (
      <Paper variant="outlined" sx={{ p: 3, maxWidth: 480 }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          Two-factor authentication is enabled.
        </Alert>
        <Button color="error" variant="outlined" onClick={disable}>
          Disable 2FA
        </Button>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, maxWidth: 480 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!qrCode && (
        <Button variant="contained" onClick={startSetup} disabled={loading}>
          Enable 2FA
        </Button>
      )}

      {qrCode && (
        <Stack spacing={2}>
          <Typography variant="body2">
            Scan this QR code with Google Authenticator, Authy, or any TOTP app:
          </Typography>
          <Image src={qrCode} alt="2FA QR code" width={200} height={200} />
          <Typography variant="caption" color="text.secondary">
            Or enter this key manually: <code>{secret}</code>
          </Typography>
          <TextField
            label="Enter the 6-digit code to confirm"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            fullWidth
          />
          <Button variant="contained" onClick={verify} disabled={loading || code.length !== 6}>
            Verify &amp; Enable
          </Button>
        </Stack>
      )}
    </Paper>
  );
}
