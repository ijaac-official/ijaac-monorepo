"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Link from "@mui/material/Link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = React.useState<"email" | "code">("email");
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resendIn, setResendIn] = React.useState(0);

  React.useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const sendCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? "Could not send the code");
      setStep("code");
      setCode("");
      setResendIn(body.resendAfterSeconds ?? 60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, code, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("That code is invalid or has expired. Check the latest email, or request a new code.");
      return;
    }
    router.push(searchParams.get("callbackUrl") ?? "/");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "email") sendCode();
    else verify();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
      }}
    >
      <Paper elevation={2} sx={{ p: 4, width: "100%", maxWidth: 420 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom color="primary.main">
          IJAAC Admin
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {step === "email"
            ? "Enter the admin email and we'll send a one-time sign-in code."
            : `We sent a 6-digit code to ${email}. It expires in 10 minutes.`}
        </Typography>
        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}

            {step === "email" ? (
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                autoFocus
                autoComplete="email"
              />
            ) : (
              <TextField
                label="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                fullWidth
                autoFocus
                autoComplete="one-time-code"
                inputProps={{ inputMode: "numeric", style: { letterSpacing: 8, fontSize: 22, textAlign: "center" } }}
              />
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || (step === "code" && code.length !== 6)}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              {step === "email" ? "Send Code" : "Sign In"}
            </Button>

            {step === "code" && (
              <Stack direction="row" justifyContent="space-between">
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => {
                    setStep("email");
                    setError(null);
                  }}
                >
                  Use a different email
                </Link>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  disabled={resendIn > 0 || loading}
                  onClick={sendCode}
                  sx={{ opacity: resendIn > 0 ? 0.5 : 1 }}
                >
                  {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                </Link>
              </Stack>
            )}
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginForm />
    </React.Suspense>
  );
}
