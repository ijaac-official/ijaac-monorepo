"use client";

import SecurePaymentBadge from "@/components/SecurePaymentBadge";
import * as React from "react";
import { useFieldArray, useForm, type FieldErrors, type Resolver } from "react-hook-form";
import { useSnackbar } from "notistack";
import { formatInr, submissionFormSchema, type SubmissionFormInput } from "@ijaac/shared";
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
import FormHelperText from "@mui/material/FormHelperText";
import CircularProgress from "@mui/material/CircularProgress";
import MuiLink from "@mui/material/Link";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import Script from "next/script";
import NextLink from "next/link";
import {
  MAX_MANUSCRIPT_MB,
  checkManuscriptBytes,
  checkManuscriptMeta,
  normalizeSubmissionInput,
} from "@/app/submit-paper/manuscript-checks";

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
  correspondingPhone: string;
  couponCode?: string;
  consent: boolean;
  authors: { name: string; email: string; affiliation?: string; isCorresponding?: boolean }[];
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

const ACCEPT_ATTR = ".pdf,.doc,.docx";
const ABSTRACT_MIN = 100;
const ABSTRACT_MAX = 5000;
const KEYWORDS_MIN = 3;
const KEYWORDS_MAX = 10;
const FILE_SECTION_ID = "manuscript-file-section";

interface QuoteInfo {
  baseAmountPaise: number;
  finalAmountPaise: number;
  discountPercent: number;
  couponCode?: string;
}

class CancelledError extends Error {}

function splitKeywords(input: string | undefined): string[] {
  return (input ?? "")
    .split(/[,;\n]/)
    .map((k) => k.trim())
    .filter(Boolean);
}

function toPayload(values: FormValues): SubmissionFormInput {
  return normalizeSubmissionInput({
    title: values.title ?? "",
    abstract: values.abstract ?? "",
    keywords: splitKeywords(values.keywordsInput),
    authors: (values.authors ?? []).map((a) => ({
      name: a.name ?? "",
      email: a.email ?? "",
      affiliation: a.affiliation || undefined,
      isCorresponding: !!a.isCorresponding,
    })),
    correspondingEmail: values.correspondingEmail ?? "",
    correspondingPhone: values.correspondingPhone ?? "",
  }) as SubmissionFormInput;
}

/** Writes a nested error like "authors.0.email" into a react-hook-form errors object. */
function setNestedError(errors: Record<string, unknown>, path: (string | number)[], message: string) {
  let node: Record<string | number, unknown> = errors;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const nextIsIndex = typeof path[i + 1] === "number";
    if (node[key] == null) node[key] = nextIsIndex ? [] : {};
    node = node[key] as Record<string | number, unknown>;
  }
  const last = path[path.length - 1];
  if (node[last] == null) node[last] = { type: "validate", message };
}

/** Runs the shared zod schema (the same one the server uses) over the whole form. */
const formResolver: Resolver<FormValues> = async (values) => {
  const errors: Record<string, unknown> = {};
  const parsed = submissionFormSchema.safeParse(toPayload(values));
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const [head, ...rest] = issue.path;
      if (head === "keywords") {
        const message =
          rest.length > 0 ? "Each keyword must be at least 2 characters" : issue.message;
        setNestedError(errors, ["keywordsInput"], message);
      } else if (head === "authors" && rest.length >= 2) {
        setNestedError(errors, ["authors", rest[0], rest[1]], issue.message);
      } else if (head === "authors") {
        setNestedError(errors, ["authors", 0, "name"], issue.message);
      } else if (typeof head === "string") {
        setNestedError(errors, [head], issue.message);
      }
    }
  }
  if (!values.consent) {
    setNestedError(errors, ["consent"], "Please confirm the declaration to continue");
  }
  if (Object.keys(errors).length > 0) {
    return { values: {}, errors: errors as FieldErrors<FormValues> };
  }
  return { values, errors: {} };
};

/** DOM order of fields, used to scroll/focus the first invalid one. */
function orderedErrorNames(errors: FieldErrors<FormValues>, authorCount: number): { name: string; message: string }[] {
  const out: { name: string; message: string }[] = [];
  const push = (name: string, message?: string) => message && out.push({ name, message });
  push("title", errors.title?.message);
  push("abstract", errors.abstract?.message);
  push("keywordsInput", errors.keywordsInput?.message);
  for (let i = 0; i < authorCount; i++) {
    push(`authors.${i}.name`, errors.authors?.[i]?.name?.message);
    push(`authors.${i}.email`, errors.authors?.[i]?.email?.message);
  }
  push("correspondingEmail", errors.correspondingEmail?.message);
  push("correspondingPhone", errors.correspondingPhone?.message);
  return out;
}

function focusField(name: string) {
  if (typeof document === "undefined") return;
  const el =
    name === "file"
      ? document.getElementById(FILE_SECTION_ID)
      : document.querySelector<HTMLElement>(`[name="${name}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  const focusTarget =
    name === "file" ? el.querySelector<HTMLElement>("label, button, input") ?? el : el;
  window.setTimeout(() => focusTarget.focus({ preventScroll: true }), 250);
}

export default function SubmissionForm() {
  const { enqueueSnackbar } = useSnackbar();
  const [file, setFile] = React.useState<File | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [checkingFile, setCheckingFile] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  );
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [baseFee, setBaseFee] = React.useState<number | null>(null);
  const [quoteInfo, setQuoteInfo] = React.useState<QuoteInfo | null>(null);
  const [couponError, setCouponError] = React.useState<string | null>(null);
  const [applying, setApplying] = React.useState(false);
  /**
   * A verified payment whose submission upload failed. The order is not yet
   * attached to a submission, so the server accepts it again - the author can
   * fix the problem and resubmit without paying twice.
   */
  const pendingPaymentRef = React.useRef<RazorpayResponse | null>(null);

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
    watch,
    formState: { errors, isSubmitted },
  } = useForm<FormValues>({
    resolver: formResolver,
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: {
      title: "",
      abstract: "",
      keywordsInput: "",
      correspondingEmail: "",
      correspondingPhone: "",
      couponCode: "",
      consent: false,
      authors: [{ name: "", email: "", affiliation: "", isCorresponding: true }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "authors" });

  const abstractLength = (watch("abstract") ?? "").trim().length;
  const keywordCount = splitKeywords(watch("keywordsInput")).length;

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
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setQuoteInfo(null);
        setCouponError(body?.error ?? "Invalid coupon code");
        return;
      }
      setQuoteInfo(body);
      enqueueSnackbar(
        body.finalAmountPaise === 0
          ? "Coupon applied - no payment needed"
          : `Coupon applied - ${body.discountPercent}% off`,
        { variant: "success" }
      );
    } catch {
      setCouponError("Could not check the coupon, please try again");
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const f = input.files?.[0] ?? null;
    // allow re-selecting the same file after fixing it
    input.value = "";
    if (!f) return;

    const metaError = checkManuscriptMeta(f);
    if (metaError) {
      setFileError(metaError);
      setFile(null);
      return;
    }
    setCheckingFile(true);
    try {
      const head = new Uint8Array(await f.slice(0, 1024).arrayBuffer());
      const bytesError = checkManuscriptBytes(f.name, head);
      if (bytesError) {
        setFileError(bytesError);
        setFile(null);
        return;
      }
      setFileError(null);
      setFile(f);
    } catch {
      setFileError("Could not read the selected file. Please choose it again.");
      setFile(null);
    } finally {
      setCheckingFile(false);
    }
  };

  const currentFileError = (): string | null => {
    if (!file) return fileError ?? "Please attach your manuscript file.";
    return checkManuscriptMeta(file);
  };

  const reportInvalid = (formErrors: FieldErrors<FormValues>) => {
    const list = orderedErrorNames(formErrors, fields.length);
    const fErr = currentFileError();
    if (fErr) {
      setFileError(fErr);
      list.push({ name: "file", message: fErr });
    }
    if (formErrors.consent?.message) list.push({ name: "consent", message: formErrors.consent.message });
    if (list.length === 0) return;
    focusField(list[0].name);
    enqueueSnackbar(
      list.length === 1
        ? list[0].message
        : `Please fix ${list.length} fields before continuing. ${list[0].message}`,
      { variant: "error" }
    );
  };

  const onValid = async (values: FormValues) => {
    setServerError(null);

    // The manuscript lives outside react-hook-form, so check it here too.
    const fErr = currentFileError();
    if (fErr || !file) {
      reportInvalid({});
      return;
    }

    const payload = toPayload(values);
    const parsed = submissionFormSchema.safeParse(payload);
    if (!parsed.success) {
      // Should not happen (the resolver ran the same schema), but never proceed to checkout.
      enqueueSnackbar(parsed.error.issues[0]?.message ?? "Please check the form for errors.", {
        variant: "error",
      });
      return;
    }

    setStatus("submitting");
    const couponCode = values.couponCode?.trim() || undefined;

    const submit = async (extra: { payment?: RazorpayResponse; couponCode?: string }) => {
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

    const finish = () => {
      pendingPaymentRef.current = null;
      setStatus("success");
      reset();
      setFile(null);
      setQuoteInfo(null);
      enqueueSnackbar("Manuscript submitted successfully", { variant: "success" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    try {
      // Already paid in an earlier attempt whose upload failed: reuse that payment.
      if (pendingPaymentRef.current) {
        await submit({ payment: pendingPaymentRef.current });
        finish();
        return;
      }

      // Server-side pre-validation of all metadata happens inside create-order,
      // so no order is ever created for an incomplete submission.
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode,
          consent: true,
          submission: parsed.data,
          file: { name: file.name, size: file.size, type: file.type },
        }),
      });
      if (!orderRes.ok) {
        const body = await orderRes.json().catch(() => ({}));
        throw new Error(typeof body?.error === "string" ? body.error : "Could not start checkout");
      }
      const order = await orderRes.json();

      // 100% coupon: nothing to charge, so skip Razorpay entirely.
      if (order.free) {
        await submit({ couponCode });
        finish();
        return;
      }

      if (typeof window.Razorpay !== "function") {
        throw new Error("The payment gateway is still loading. Please try again in a moment.");
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
            email: parsed.data.correspondingEmail,
            contact: parsed.data.correspondingPhone,
          },
          theme: { color: "#7a1f2b" },
          handler: async (response: RazorpayResponse) => {
            pendingPaymentRef.current = response;
            try {
              await submit({ payment: response });
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => reject(new CancelledError("Payment was cancelled")),
          },
        });
        checkout.open();
      });

      finish();
    } catch (err) {
      setStatus("error");
      if (err instanceof CancelledError) {
        setServerError(null);
        enqueueSnackbar("Payment was cancelled. Your details are still here.", { variant: "warning" });
        return;
      }
      const message = err instanceof Error ? err.message : "Submission failed";
      const paidNote = pendingPaymentRef.current
        ? " Your payment was received - fix the issue and submit again; you will not be charged twice."
        : "";
      setServerError(message + paidNote);
      enqueueSnackbar(message, { variant: "error" });
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

  const submitting = status === "submitting";
  const showFileError = fileError ?? (isSubmitted && !file ? "Please attach your manuscript file." : null);

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(onValid, reportInvalid)}
      sx={{ maxWidth: 820 }}
    >
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <Stack spacing={3}>
        {serverError && <Alert severity="error">{serverError}</Alert>}

        <TextField
          label="Manuscript Title"
          required
          {...register("title")}
          error={!!errors.title}
          helperText={errors.title?.message ?? "Minimum 10 characters"}
          fullWidth
        />

        <TextField
          label="Abstract"
          required
          {...register("abstract")}
          error={!!errors.abstract}
          helperText={
            <Box component="span" sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
              <span>{errors.abstract?.message ?? `${ABSTRACT_MIN}-${ABSTRACT_MAX} characters`}</span>
              <Box
                component="span"
                sx={{
                  flexShrink: 0,
                  fontVariantNumeric: "tabular-nums",
                  color:
                    abstractLength > ABSTRACT_MAX
                      ? "error.main"
                      : abstractLength >= ABSTRACT_MIN
                        ? "success.main"
                        : "text.secondary",
                }}
              >
                {abstractLength} / {ABSTRACT_MAX}
                {abstractLength < ABSTRACT_MIN ? ` (${ABSTRACT_MIN - abstractLength} more needed)` : ""}
              </Box>
            </Box>
          }
          multiline
          minRows={6}
          fullWidth
        />

        <TextField
          label="Keywords"
          required
          {...register("keywordsInput")}
          error={!!errors.keywordsInput}
          helperText={
            <Box component="span" sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
              <span>
                {errors.keywordsInput?.message ??
                  "Comma-separated, e.g. machine learning, nlp, ethics"}
              </span>
              <Box
                component="span"
                sx={{
                  flexShrink: 0,
                  color:
                    keywordCount > KEYWORDS_MAX
                      ? "error.main"
                      : keywordCount >= KEYWORDS_MIN
                        ? "success.main"
                        : "text.secondary",
                }}
              >
                {keywordCount} / {KEYWORDS_MIN}-{KEYWORDS_MAX}
              </Box>
            </Box>
          }
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
                alignItems={{ sm: "flex-start" }}
              >
                <TextField
                  label="Name"
                  size="small"
                  required
                  {...register(`authors.${index}.name`)}
                  error={!!errors.authors?.[index]?.name}
                  helperText={errors.authors?.[index]?.name?.message}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Email"
                  size="small"
                  type="email"
                  required
                  {...register(`authors.${index}.email`)}
                  error={!!errors.authors?.[index]?.email}
                  helperText={errors.authors?.[index]?.email?.message}
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
                    <Checkbox
                      size="small"
                      defaultChecked={!!field.isCorresponding}
                      {...register(`authors.${index}.isCorresponding`)}
                    />
                  }
                  label="Corresponding"
                  sx={{ whiteSpace: "nowrap", mt: { sm: 0.25 } }}
                />
                <IconButton
                  aria-label="Remove author"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  sx={{ alignSelf: { xs: "flex-end", sm: "flex-start" } }}
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

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
          <TextField
            label="Corresponding Author Email"
            type="email"
            required
            autoComplete="email"
            {...register("correspondingEmail")}
            error={!!errors.correspondingEmail}
            helperText={errors.correspondingEmail?.message ?? "Decision and receipt emails go here"}
            fullWidth
          />
          <TextField
            label="Corresponding Author Mobile"
            type="tel"
            required
            autoComplete="tel"
            inputProps={{ inputMode: "tel" }}
            {...register("correspondingPhone")}
            error={!!errors.correspondingPhone}
            helperText={
              errors.correspondingPhone?.message ??
              "Required. 10-15 digits with country code, e.g. +91 98765 43210"
            }
            fullWidth
          />
        </Stack>

        <Paper
          id={FILE_SECTION_ID}
          variant="outlined"
          sx={{ p: 2.5, borderColor: showFileError ? "error.main" : undefined }}
        >
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Manuscript File *
          </Typography>
          <Button
            component="label"
            variant="outlined"
            color={showFileError ? "error" : "primary"}
            startIcon={
              checkingFile ? (
                <CircularProgress size={16} />
              ) : file ? (
                <InsertDriveFileOutlinedIcon />
              ) : (
                <UploadFileIcon />
              )
            }
            disabled={checkingFile}
            sx={{ maxWidth: "100%", "& .MuiButton-startIcon": { flexShrink: 0 } }}
          >
            <Box
              component="span"
              sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {file ? file.name : "Choose PDF or Word file"}
            </Box>
            <input type="file" hidden accept={ACCEPT_ATTR} onChange={handleFileChange} />
          </Button>
          {file && !showFileError && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {(file.size / (1024 * 1024)).toFixed(2)} MB - looks good
            </Typography>
          )}
          {showFileError && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }} role="alert">
              {showFileError}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Accepted formats: PDF, DOC, DOCX. Maximum size: {MAX_MANUSCRIPT_MB} MB.
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

        <Box>
          <FormControlLabel
            control={<Checkbox {...register("consent")} />}
            label={
              <Typography variant="body2">
                I confirm this manuscript is original, is not under review elsewhere, and all
                co-authors approve this submission. I agree to the{" "}
                <MuiLink component={NextLink} href="/terms-and-conditions" target="_blank">
                  Terms and Conditions
                </MuiLink>{" "}
                and understand the submission fee is{" "}
                <MuiLink component={NextLink} href="/refund-policy" target="_blank">
                  non-refundable
                </MuiLink>
                .
              </Typography>
            }
            sx={{ alignItems: "flex-start", "& .MuiCheckbox-root": { pt: 0.25 } }}
          />
          {errors.consent?.message && (
            <FormHelperText error sx={{ ml: 4 }}>
              {errors.consent.message}
            </FormHelperText>
          )}
        </Box>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitting || checkingFile}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {submitting
            ? "Processing..."
            : pendingPaymentRef.current
              ? "Retry Submission (already paid)"
              : payable === 0
                ? "Submit Manuscript"
                : `Proceed to Pay${payable != null ? ` ${formatInr(payable)}` : ""}`}
        </Button>
        {payable !== 0 && (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <SecurePaymentBadge />
          </Box>
        )}
      </Stack>
    </Box>
  );
}
