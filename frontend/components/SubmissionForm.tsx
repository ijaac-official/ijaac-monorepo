"use client";

import * as React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import {
  ACCEPTED_MANUSCRIPT_MIME_TYPES,
  MAX_MANUSCRIPT_SIZE_BYTES,
  formatInr,
  submissionFormSchema,
} from "@ijaac/shared";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import CircularProgress from "@mui/material/CircularProgress";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Script from "next/script";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface FormValues {
  title: string;
  abstract: string;
  keywordsInput: string;
  correspondingEmail: string;
  correspondingPhone?: string;
  couponCode?: string;
  authors: { name: string; email: string; affiliation?: string; isCorresponding?: boolean }[];
}

const ACCEPT_ATTR = ".pdf,.doc,.docx";

interface QuoteInfo {
  baseAmountPaise: number;
  finalAmountPaise: number;
  discountPercent: number;
  couponCode?: string;
}

export default function SubmissionForm() {
  const [file, setFile] = React.useState<File | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  );
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [baseFee, setBaseFee] = React.useState<number | null>(null);
  const [quoteInfo, setQuoteInfo] = React.useState<QuoteInfo | null>(null);
  const [couponError, setCouponError] = React.useState<string | null>(null);
  const [applying, setApplying] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/payment/quote")
      .then((r) => r.json())
      .then((q) => setBaseFee(q.baseAmountPaise ?? null))
      .catch(() => undefined);
  }, []);

  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      authors: [{ name: "", email: "", affiliation: "", isCorresponding: true }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "authors" });

  const applyCoupon = async () => {
    const code = getValues("couponCode")?.trim();
    setCouponError(null);
    if (!code) {
      setQuoteInfo(null);
      return;
    }
    setApplying(true);
    try {
      const res = await fetch(`/api/payment/quote?coupon=${encodeURIComponent(code)}`);
      const body = await res.json();
      if (!res.ok) {
        setQuoteInfo(null);
        setCouponError(body?.error ?? "Invalid coupon code");
        return;
      }
      setQuoteInfo(body);
    } finally {
      setApplying(false);
    }
  };

  const removeCoupon = () => {
    setValue("couponCode", "");
    setQuoteInfo(null);
    setCouponError(null);
  };

  const payable = quoteInfo?.finalAmountPaise ?? baseFee;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      return;
    }
    if (!ACCEPTED_MANUSCRIPT_MIME_TYPES.includes(f.type)) {
      setFileError("Only PDF, DOC, or DOCX files are supported.");
      setFile(null);
      return;
    }
    if (f.size > MAX_MANUSCRIPT_SIZE_BYTES) {
      setFileError("File must be smaller than 20 MB.");
      setFile(null);
      return;
    }
    setFileError(null);
    setFile(f);
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    if (!file) {
      setFileError("Please attach your manuscript file.");
      return;
    }

    const keywords = values.keywordsInput
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const payload = {
      title: values.title,
      abstract: values.abstract,
      keywords,
      authors: values.authors.map((a) => ({
        name: a.name,
        email: a.email,
        affiliation: a.affiliation || undefined,
        isCorresponding: a.isCorresponding,
      })),
      correspondingEmail: values.correspondingEmail,
      correspondingPhone: values.correspondingPhone || undefined,
    };

    const parsed = submissionFormSchema.safeParse(payload);
    if (!parsed.success) {
      setServerError(parsed.error.issues[0]?.message ?? "Please check the form for errors.");
      return;
    }

    setStatus("submitting");

    const couponCode = values.couponCode?.trim() || undefined;

    const submit = async (extra: { payment?: unknown; couponCode?: string }) => {
      const formData = new FormData();
      formData.append("payload", JSON.stringify(parsed.data));
      if (extra.payment) formData.append("payment", JSON.stringify(extra.payment));
      if (extra.couponCode) formData.append("couponCode", extra.couponCode);
      formData.append("file", file);

      const res = await fetch("/api/submissions", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body?.error === "string" ? body.error : "Submission failed");
      }
    };

    try {
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode }),
      });
      if (!orderRes.ok) {
        const body = await orderRes.json().catch(() => ({}));
        throw new Error(body?.error ?? "Could not start checkout");
      }
      const order = await orderRes.json();

      // 100% coupon: nothing to charge, so skip Razorpay entirely.
      if (order.free) {
        await submit({ couponCode });
        setStatus("success");
        reset();
        setFile(null);
        setQuoteInfo(null);
        return;
      }

      await new Promise<void>((resolve, reject) => {
        const checkout = new window.Razorpay({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amount,
          currency: order.currency,
          name: "IJAAC Journal",
          description: order.couponCode
            ? `Manuscript submission fee (${order.discountPercent}% off)`
            : "Manuscript submission fee",
          prefill: {
            email: values.correspondingEmail,
            contact: values.correspondingPhone || undefined,
          },
          theme: { color: "#7a1f2b" },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await submit({ payment: response });
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment was cancelled")),
          },
        });
        checkout.open();
      });

      setStatus("success");
      reset();
      setFile(null);
      setQuoteInfo(null);
    } catch (err) {
      setStatus("error");
      setServerError(err instanceof Error ? err.message : "Submission failed");
    }
  };

  if (status === "success") {
    return (
      <Alert severity="success" sx={{ fontSize: "1rem" }}>
        Your manuscript has been submitted successfully. A confirmation email has been sent to
        the corresponding author. Our editorial team will contact you with a decision.
      </Alert>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 820 }}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <Stack spacing={3}>
        {serverError && <Alert severity="error">{serverError}</Alert>}

        <TextField
          label="Manuscript Title"
          {...register("title", { required: "Title is required", minLength: 10 })}
          error={!!errors.title}
          helperText={errors.title?.message ?? "Minimum 10 characters"}
          fullWidth
        />

        <TextField
          label="Abstract"
          {...register("abstract", { required: "Abstract is required" })}
          error={!!errors.abstract}
          helperText={errors.abstract?.message ?? "100-5000 characters"}
          multiline
          rows={6}
          fullWidth
        />

        <TextField
          label="Keywords"
          {...register("keywordsInput", { required: "Please add at least 3 keywords" })}
          error={!!errors.keywordsInput}
          helperText={errors.keywordsInput?.message ?? "Comma-separated, e.g. machine learning, nlp, ethics"}
          fullWidth
        />

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Authors
          </Typography>
          <Stack spacing={2}>
            {fields.map((field, index) => (
              <Stack
                key={field.id}
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ sm: "center" }}
              >
                <TextField
                  label="Name"
                  size="small"
                  {...register(`authors.${index}.name`, { required: true })}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Email"
                  size="small"
                  {...register(`authors.${index}.email`, { required: true })}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Affiliation"
                  size="small"
                  {...register(`authors.${index}.affiliation`)}
                  sx={{ flex: 1 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox size="small" {...register(`authors.${index}.isCorresponding`)} />
                  }
                  label="Corresponding"
                  sx={{ whiteSpace: "nowrap" }}
                />
                <IconButton
                  aria-label="Remove author"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
          <Button
            startIcon={<AddIcon />}
            onClick={() => append({ name: "", email: "", affiliation: "", isCorresponding: false })}
            sx={{ mt: 2 }}
          >
            Add Author
          </Button>
        </Paper>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Corresponding Author Email"
            {...register("correspondingEmail", { required: true })}
            error={!!errors.correspondingEmail}
            helperText={errors.correspondingEmail?.message}
            fullWidth
          />
          <TextField
            label="Corresponding Author Phone (optional)"
            {...register("correspondingPhone")}
            fullWidth
          />
        </Stack>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Manuscript File
          </Typography>
          <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
            {file ? file.name : "Choose PDF or Word file"}
            <input type="file" hidden accept={ACCEPT_ATTR} onChange={handleFileChange} />
          </Button>
          {fileError && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {fileError}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Accepted formats: PDF, DOC, DOCX. Maximum size: 20 MB.
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Order Summary
          </Typography>

          <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 2 }}>
            <TextField
              label="Coupon Code (optional)"
              size="small"
              {...register("couponCode")}
              onChange={(e) => {
                setValue("couponCode", e.target.value.toUpperCase());
                if (quoteInfo) setQuoteInfo(null);
                setCouponError(null);
              }}
              error={!!couponError}
              helperText={couponError ?? undefined}
              disabled={!!quoteInfo}
              sx={{ flex: 1 }}
            />
            {quoteInfo ? (
              <Button variant="outlined" onClick={removeCoupon} sx={{ height: 40 }}>
                Remove
              </Button>
            ) : (
              <Button
                variant="outlined"
                onClick={applyCoupon}
                disabled={applying}
                sx={{ height: 40 }}
              >
                {applying ? <CircularProgress size={18} /> : "Apply"}
              </Button>
            )}
          </Stack>

          <Stack spacing={0.75}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Submission fee
              </Typography>
              <Typography variant="body2">{baseFee != null ? formatInr(baseFee) : "-"}</Typography>
            </Stack>
            {quoteInfo && quoteInfo.discountPercent > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="success.main">
                  Coupon {quoteInfo.couponCode} ({quoteInfo.discountPercent}% off)
                </Typography>
                <Typography variant="body2" color="success.main">
                  - {formatInr(quoteInfo.baseAmountPaise - quoteInfo.finalAmountPaise)}
                </Typography>
              </Stack>
            )}
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ pt: 1, mt: 0.5, borderTop: 1, borderColor: "divider" }}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                Total
              </Typography>
              <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                {payable != null ? formatInr(payable) : "-"}
              </Typography>
            </Stack>
          </Stack>

          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
            {payable === 0
              ? "Your coupon covers the full fee - no payment needed."
              : "You'll pay securely via Razorpay before your manuscript is uploaded. A receipt is emailed after payment. Fees are non-refundable."}
          </Typography>
        </Paper>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={status === "submitting"}
          startIcon={status === "submitting" ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {status === "submitting"
            ? "Processing..."
            : payable === 0
              ? "Submit Manuscript"
              : `Proceed to Pay${payable != null ? ` ${formatInr(payable)}` : ""}`}
        </Button>
      </Stack>
    </Box>
  );
}
