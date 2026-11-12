"use client";

import * as React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import {
  ACCEPTED_MANUSCRIPT_MIME_TYPES,
  MAX_MANUSCRIPT_SIZE_BYTES,
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

export default function SubmissionForm() {
  const [file, setFile] = React.useState<File | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  );
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      authors: [{ name: "", email: "", affiliation: "", isCorresponding: true }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "authors" });

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

    const couponCode = values.couponCode?.trim();
    if (couponCode) {
      try {
        const formData = new FormData();
        formData.append("payload", JSON.stringify(parsed.data));
        formData.append("couponCode", couponCode);
        formData.append("file", file);

        const res = await fetch("/api/submissions", { method: "POST", body: formData });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? "Submission failed");
        }
        setStatus("success");
        reset();
        setFile(null);
      } catch (err) {
        setStatus("error");
        setServerError(err instanceof Error ? err.message : "Submission failed");
      }
      return;
    }

    try {
      const orderRes = await fetch("/api/payment/create-order", { method: "POST" });
      if (!orderRes.ok) {
        const body = await orderRes.json().catch(() => ({}));
        throw new Error(body?.error ?? "Could not start checkout");
      }
      const order = await orderRes.json();

      await new Promise<void>((resolve, reject) => {
        const checkout = new window.Razorpay({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amount,
          currency: order.currency,
          name: "IJAAC Journal",
          description: "Manuscript submission fee",
          prefill: {
            email: values.correspondingEmail,
            contact: values.correspondingPhone || undefined,
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const formData = new FormData();
              formData.append("payload", JSON.stringify(parsed.data));
              formData.append("payment", JSON.stringify(response));
              formData.append("file", file);

              const res = await fetch("/api/submissions", { method: "POST", body: formData });
              if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.error ?? "Submission failed");
              }
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

        <TextField
          label="Coupon Code (optional)"
          {...register("couponCode")}
          helperText="Have a promo code? Enter it to waive the submission fee."
          fullWidth
        />

        <Typography variant="body2" color="text.secondary">
          A one-time submission fee applies unless a valid coupon is entered above. You will be
          redirected to a secure Razorpay checkout before your manuscript is uploaded.
        </Typography>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={status === "submitting"}
          startIcon={status === "submitting" ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {status === "submitting" ? "Processing..." : "Proceed to Checkout"}
        </Button>
      </Stack>
    </Box>
  );
}
