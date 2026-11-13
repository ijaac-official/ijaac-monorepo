"use client";

import * as React from "react";
import Script from "next/script";
import NextLink from "next/link";
import { useSnackbar } from "notistack";
import { bookSubmissionFormSchema, formatInr, type BookSubmissionFormInput } from "@ijaac/shared";
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
import LinearProgress from "@mui/material/LinearProgress";
import MuiLink from "@mui/material/Link";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import SecurePaymentBadge from "@/components/SecurePaymentBadge";
import { normalizeBookInput } from "@/app/books/publish/book-checks";
import { MAX_BOOK_COVER_MB, checkCoverBytes, checkCoverMeta } from "@/lib/file-checks";
import { directUpload, type UploadedRef } from "@/lib/direct-upload";
import { MULTIPART_FALLBACK_MAX_BYTES } from "@ijaac/shared";

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface QuoteInfo {
  baseAmountPaise: number;
  finalAmountPaise: number;
  discountPercent: number;
  couponCode?: string;
}

interface Values {
  title: string;
  subtitle: string;
  authorName: string;
  coAuthors: string[];
  email: string;
  phone: string;
  affiliation: string;
  category: string;
  synopsis: string;
  pageCount: string;
}

const EMPTY: Values = {
  title: "",
  subtitle: "",
  authorName: "",
  coAuthors: [],
  email: "",
  phone: "",
  affiliation: "",
  category: "",
  synopsis: "",
  pageCount: "",
};

const SYNOPSIS_MIN = 100;
const SYNOPSIS_MAX = 5000;
const FIELD_ORDER = [
  "title",
  "subtitle",
  "authorName",
  "coAuthors",
  "email",
  "phone",
  "affiliation",
  "category",
  "synopsis",
  "pageCount",
  "cover",
  "consent",
];

class CancelledError extends Error {}

type Errors = Record<string, string>;

function validateValues(values: Values): { data?: BookSubmissionFormInput; errors: Errors } {
  const errors: Errors = {};
  const parsed = bookSubmissionFormSchema.safeParse(normalizeBookInput(values));
  if (parsed.success) return { data: parsed.data, errors };
  for (const issue of parsed.error.issues) {
    const [head, idx] = issue.path;
    const key = head === "coAuthors" && typeof idx === "number" ? `coAuthors.${idx}` : String(head);
    if (!errors[key]) errors[key] = head === "pageCount" ? "Enter a whole number of pages" : issue.message;
  }
  return { errors };
}

function focusField(name: string) {
  const el =
    document.getElementById(`book-field-${name}`) ??
    document.querySelector<HTMLElement>(`[name="${name}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  const target = el.matches("input, textarea, button, label") ? el : el.querySelector<HTMLElement>("input, textarea, label, button") ?? el;
  window.setTimeout(() => target.focus({ preventScroll: true }), 250);
}

async function readHead(f: File): Promise<Uint8Array> {
  return new Uint8Array(await f.slice(0, 1024).arrayBuffer());
}

export default function BookPublishForm({ initialFeePaise }: { initialFeePaise: number }) {
  const { enqueueSnackbar } = useSnackbar();
  const [values, setValues] = React.useState<Values>(EMPTY);
  const [errors, setErrors] = React.useState<Errors>({});
  const [touchedSubmit, setTouchedSubmit] = React.useState(false);
  const [consent, setConsent] = React.useState(false);
  const [cover, setCover] = React.useState<File | null>(null);
  const [coverPreview, setCoverPreview] = React.useState<string | null>(null);
  const [fileErrors, setFileErrors] = React.useState<{ cover?: string }>({});
  const [checking, setChecking] = React.useState(false);
  const [baseFee, setBaseFee] = React.useState<number>(initialFeePaise);
  const [couponCode, setCouponCode] = React.useState("");
  const [quoteInfo, setQuoteInfo] = React.useState<QuoteInfo | null>(null);
  const [couponError, setCouponError] = React.useState<string | null>(null);
  const [applying, setApplying] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success">("idle");
  const [progress, setProgress] = React.useState<{ label: string; pct: number } | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const pendingPaymentRef = React.useRef<RazorpayResponse | null>(null);
  const uploads = React.useRef<{ cover?: { file: File; ref: UploadedRef | null } }>({});

  // Refresh the live fee (the admin may change it while the page is open).
  React.useEffect(() => {
    fetch("/api/payment/quote?kind=BOOK")
      .then((r) => (r.ok ? r.json() : null))
      .then((q) => q?.baseAmountPaise && setBaseFee(q.baseAmountPaise))
      .catch(() => undefined);
  }, []);

  React.useEffect(() => {
    if (!cover) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(cover);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [cover]);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    const next = { ...values, [key]: value };
    setValues(next);
    if (touchedSubmit) setErrors(validateValues(next).errors);
  };

  const payable = quoteInfo?.finalAmountPaise ?? baseFee;
  const synopsisLength = values.synopsis.trim().length;
  const submitting = status === "submitting";

  const pickCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!f) return;
    const meta = checkCoverMeta(f);
    if (meta) {
      setFileErrors((x) => ({ ...x, cover: meta }));
      setCover(null);
      return;
    }
    setChecking(true);
    try {
      const bytesError = checkCoverBytes(f.name, await readHead(f));
      setFileErrors((x) => ({ ...x, cover: bytesError ?? undefined }));
      setCover(bytesError ? null : f);
    } catch {
      setFileErrors((x) => ({ ...x, cover: "Could not read the selected image. Please choose it again." }));
      setCover(null);
    } finally {
      setChecking(false);
    }
  };

  const applyCoupon = async () => {
    const code = couponCode.trim();
    setCouponError(null);
    if (!code) return;
    setApplying(true);
    try {
      const res = await fetch(`/api/payment/quote?kind=BOOK&coupon=${encodeURIComponent(code)}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setQuoteInfo(null);
        setCouponError(body?.error ?? "Invalid coupon code");
        return;
      }
      setQuoteInfo(body);
      setBaseFee(body.baseAmountPaise);
      enqueueSnackbar(
        body.finalAmountPaise === 0 ? "Coupon applied - no payment needed" : `Coupon applied - ${body.discountPercent}% off`,
        { variant: "success" }
      );
    } catch {
      setCouponError("Could not check the coupon, please try again");
    } finally {
      setApplying(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setQuoteInfo(null);
    setCouponError(null);
  };

  /** Full client-side validation; returns the parsed payload or null after reporting errors. */
  const validateAll = (): BookSubmissionFormInput | null => {
    const { data, errors: fieldErrors } = validateValues(values);
    const all: Errors = { ...fieldErrors };
    const cErr = cover ? checkCoverMeta(cover) : fileErrors.cover;
    if (cErr) all.cover = cErr;
    if (!consent) all.consent = "Please confirm the declaration to continue";
    setErrors(fieldErrors);
    setFileErrors({ cover: all.cover });
    setTouchedSubmit(true);

    const keys = Object.keys(all).sort((a, b) => FIELD_ORDER.indexOf(a.split(".")[0]) - FIELD_ORDER.indexOf(b.split(".")[0]));
    if (keys.length > 0) {
      focusField(keys[0]);
      const first = all[keys[0]];
      enqueueSnackbar(keys.length === 1 ? first : `Please fix ${keys.length} fields before continuing. ${first}`, {
        variant: "error",
      });
      return null;
    }
    return data ?? null;
  };

  const ensureCoverUploaded = async (f: File) => {
    const existing = uploads.current.cover;
    if (existing?.file === f) return existing.ref;
    const label = "Uploading cover image";
    setProgress({ label, pct: 0 });
    try {
      const result = await directUpload("book-cover", f, (pct) => setProgress({ label, pct }));
      const ref = result.mode === "direct" ? result.ref : null;
      uploads.current.cover = { file: f, ref };
      return ref;
    } finally {
      setProgress(null);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const data = validateAll();
    if (!data) return;

    setStatus("submitting");
    const code = quoteInfo?.couponCode ?? (couponCode.trim() || undefined);

    try {
      const cRef = cover ? await ensureCoverUploaded(cover) : null;
      if (cover && !cRef && cover.size > MULTIPART_FALLBACK_MAX_BYTES) {
        throw new Error("The cover image could not be uploaded directly and is too large to send. Please try again.");
      }

      const describe = (f: File, ref: UploadedRef | null) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        ...(ref ? { key: ref.key, token: ref.token } : {}),
      });

      const submit = async (extra: { payment?: RazorpayResponse; couponCode?: string }) => {
        const fd = new FormData();
        fd.append("payload", JSON.stringify(data));
        fd.append("consent", "true");
        if (extra.payment) fd.append("payment", JSON.stringify(extra.payment));
        if (extra.couponCode) fd.append("couponCode", extra.couponCode);
        if (cover) {
          if (cRef) {
            fd.append("coverKey", cRef.key);
            fd.append("coverToken", cRef.token);
            fd.append("coverName", cRef.name);
          } else {
            fd.append("cover", cover);
          }
        }
        const res = await fetch("/api/book-submissions", { method: "POST", body: fd });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(typeof body?.error === "string" ? body.error : "Submission failed");
        }
      };

      if (pendingPaymentRef.current) {
        await submit({ payment: pendingPaymentRef.current });
      } else {
        const orderRes = await fetch("/api/payment/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "BOOK",
            couponCode: code,
            consent: true,
            book: data,
            ...(cover ? { cover: describe(cover, cRef) } : {}),
          }),
        });
        const order = await orderRes.json().catch(() => ({}));
        if (!orderRes.ok) throw new Error(typeof order?.error === "string" ? order.error : "Could not start checkout");

        if (order.free) {
          await submit({ couponCode: code });
        } else {
          if (typeof window.Razorpay !== "function") {
            throw new Error("The payment gateway is still loading. Please try again in a moment.");
          }
          await new Promise<void>((resolve, reject) => {
            const checkout = new window.Razorpay({
              key: order.keyId,
              order_id: order.orderId,
              amount: order.amount,
              currency: order.currency,
              name: "IJAAC Books",
              description: order.couponCode
                ? `Book publication fee (${order.discountPercent}% off)`
                : "Book publication fee",
              prefill: { name: data.authorName, email: data.email, contact: data.phone },
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
              modal: { ondismiss: () => reject(new CancelledError("Payment was cancelled")) },
            });
            checkout.open();
          });
        }
      }

      pendingPaymentRef.current = null;
      uploads.current = {};
      setStatus("success");
      enqueueSnackbar("Book publication request submitted successfully", { variant: "success" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setStatus("idle");
      if (err instanceof CancelledError) {
        enqueueSnackbar("Payment was cancelled. Your details are still here.", { variant: "warning" });
        return;
      }
      // Uploaded objects may have been consumed or rejected - upload afresh on retry.
      uploads.current = {};
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
      <Alert severity="success" sx={{ fontSize: "1rem", overflowWrap: "anywhere" }}>
        Your book publication request has been submitted. A confirmation email has been sent to {values.email}.
        Our editorial office will contact you by email to collect your manuscript and discuss the publication of
        your book.
      </Alert>
    );
  }

  const coverErr = fileErrors.cover;
  const coverBox = (
    <Paper id="book-field-cover" variant="outlined" sx={{ p: 2.5, minWidth: 0, borderColor: coverErr ? "error.main" : undefined }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Cover Image (optional)
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} sx={{ minWidth: 0 }}>
        {coverPreview && (
          <Box
            component="img"
            src={coverPreview}
            alt="Cover preview"
            sx={{ width: 72, height: 100, objectFit: "cover", border: 1, borderColor: "divider", flexShrink: 0 }}
          />
        )}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, maxWidth: "100%" }}>
          <Button
            component="label"
            variant="outlined"
            color={coverErr ? "error" : "primary"}
            disabled={checking || submitting}
            startIcon={cover ? <InsertDriveFileOutlinedIcon /> : <ImageOutlinedIcon />}
            sx={{ maxWidth: "100%", minWidth: 0, "& .MuiButton-startIcon": { flexShrink: 0 } }}
          >
            <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {cover ? cover.name : "Choose JPEG or PNG image"}
            </Box>
            <input type="file" hidden accept=".jpg,.jpeg,.png" onChange={pickCover} />
          </Button>
          {cover && (
            <IconButton aria-label="Remove cover image" onClick={() => setCover(null)} disabled={submitting}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </Stack>
      {cover && !coverErr && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {(cover.size / (1024 * 1024)).toFixed(2)} MB - looks good
        </Typography>
      )}
      {coverErr && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }} role="alert">
          {coverErr}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
        {`Optional. JPEG or PNG, up to ${MAX_BOOK_COVER_MB} MB. Used for your listing on the IJAAC Books page.`}
      </Typography>
    </Paper>
  );

  return (
    <Box component="form" noValidate onSubmit={onSubmit} sx={{ maxWidth: 820, minWidth: 0 }}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <Stack spacing={3}>
        {serverError && <Alert severity="error" sx={{ overflowWrap: "anywhere" }}>{serverError}</Alert>}

        <TextField
          label="Book Title"
          name="title"
          required
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          error={!!errors.title}
          helperText={errors.title}
          fullWidth
        />
        <TextField
          label="Subtitle (optional)"
          name="subtitle"
          value={values.subtitle}
          onChange={(e) => set("subtitle", e.target.value)}
          error={!!errors.subtitle}
          helperText={errors.subtitle}
          fullWidth
        />

        <Paper variant="outlined" sx={{ p: 2.5, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Authors
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Author Name"
              name="authorName"
              required
              size="small"
              value={values.authorName}
              onChange={(e) => set("authorName", e.target.value)}
              error={!!errors.authorName}
              helperText={errors.authorName ?? "As it should appear on the Books page"}
              fullWidth
            />
            {values.coAuthors.map((name, i) => (
              <Stack key={i} direction="row" spacing={1} alignItems="flex-start" sx={{ minWidth: 0 }}>
                <TextField
                  label={`Co-author ${i + 1}`}
                  name={`coAuthors.${i}`}
                  size="small"
                  value={name}
                  onChange={(e) => set("coAuthors", values.coAuthors.map((x, j) => (j === i ? e.target.value : x)))}
                  error={!!errors[`coAuthors.${i}`]}
                  helperText={errors[`coAuthors.${i}`]}
                  sx={{ flex: 1, minWidth: 0 }}
                />
                <IconButton
                  aria-label="Remove co-author"
                  onClick={() => set("coAuthors", values.coAuthors.filter((_, j) => j !== i))}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
          <Button
            startIcon={<AddIcon />}
            onClick={() => set("coAuthors", [...values.coAuthors, ""])}
            disabled={values.coAuthors.length >= 20}
            sx={{ mt: 2 }}
          >
            Add Co-author
          </Button>
          {errors.coAuthors && <FormHelperText error>{errors.coAuthors}</FormHelperText>}
        </Paper>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
          <TextField
            label="Email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            error={!!errors.email}
            helperText={errors.email ?? "Decision and receipt emails go here"}
            fullWidth
          />
          <TextField
            label="Mobile"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            inputProps={{ inputMode: "tel" }}
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            error={!!errors.phone}
            helperText={errors.phone ?? "10-15 digits with country code, e.g. +91 98765 43210"}
            fullWidth
          />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
          <TextField
            label="Affiliation (optional)"
            name="affiliation"
            value={values.affiliation}
            onChange={(e) => set("affiliation", e.target.value)}
            error={!!errors.affiliation}
            helperText={errors.affiliation ?? "University, institution or organisation"}
            fullWidth
          />
          <TextField
            label="Category / Subject"
            name="category"
            required
            value={values.category}
            onChange={(e) => set("category", e.target.value)}
            error={!!errors.category}
            helperText={errors.category ?? "e.g. Machine Learning, Computer Networks"}
            fullWidth
          />
        </Stack>

        <TextField
          label="Short Synopsis"
          name="synopsis"
          required
          multiline
          minRows={5}
          value={values.synopsis}
          onChange={(e) => set("synopsis", e.target.value)}
          error={!!errors.synopsis}
          helperText={
            <Box component="span" sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
              <span>{errors.synopsis ?? `${SYNOPSIS_MIN}-${SYNOPSIS_MAX} characters`}</span>
              <Box
                component="span"
                sx={{
                  flexShrink: 0,
                  fontVariantNumeric: "tabular-nums",
                  color:
                    synopsisLength > SYNOPSIS_MAX
                      ? "error.main"
                      : synopsisLength >= SYNOPSIS_MIN
                        ? "success.main"
                        : "text.secondary",
                }}
              >
                {synopsisLength} / {SYNOPSIS_MAX}
              </Box>
            </Box>
          }
          fullWidth
        />

        <TextField
          label="Approximate Page Count (optional)"
          name="pageCount"
          type="number"
          inputProps={{ min: 1, max: 10000, inputMode: "numeric" }}
          value={values.pageCount}
          onChange={(e) => set("pageCount", e.target.value)}
          error={!!errors.pageCount}
          helperText={errors.pageCount}
          sx={{ maxWidth: { sm: 320 } }}
        />

        <Alert severity="info" sx={{ overflowWrap: "anywhere" }}>
          No manuscript upload is needed here. After you submit this request, our editorial office will contact you
          by email to collect your manuscript and discuss the publication of your book.
        </Alert>

        {coverBox}

        <Paper variant="outlined" sx={{ p: 2.5, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Order Summary
          </Typography>
          <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 2, minWidth: 0 }}>
            <TextField
              label="Coupon Code (optional)"
              size="small"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                if (quoteInfo) setQuoteInfo(null);
                setCouponError(null);
              }}
              error={!!couponError}
              helperText={couponError ?? undefined}
              disabled={!!quoteInfo || submitting}
              sx={{ flex: 1, minWidth: 0 }}
            />
            {quoteInfo ? (
              <Button variant="outlined" onClick={removeCoupon} disabled={submitting} sx={{ height: 40 }}>
                Remove
              </Button>
            ) : (
              <Button
                variant="outlined"
                onClick={applyCoupon}
                disabled={applying || !couponCode.trim()}
                sx={{ height: 40 }}
              >
                {applying ? <CircularProgress size={18} /> : "Apply"}
              </Button>
            )}
          </Stack>
          <Stack spacing={0.75}>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Book publication fee
              </Typography>
              <Typography variant="body2">{formatInr(baseFee)}</Typography>
            </Stack>
            {quoteInfo && quoteInfo.discountPercent > 0 && (
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Typography variant="body2" color="success.main" sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                  Coupon {quoteInfo.couponCode} ({quoteInfo.discountPercent}% off)
                </Typography>
                <Typography variant="body2" color="success.main" sx={{ flexShrink: 0 }}>
                  - {formatInr(quoteInfo.baseAmountPaise - quoteInfo.finalAmountPaise)}
                </Typography>
              </Stack>
            )}
            <Stack direction="row" justifyContent="space-between" sx={{ pt: 1, mt: 0.5, borderTop: 1, borderColor: "divider" }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Total
              </Typography>
              <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                {formatInr(payable)}
              </Typography>
            </Stack>
          </Stack>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
            {payable === 0
              ? "Your coupon covers the full fee - no payment needed."
              : "You pay securely via Razorpay. A receipt is emailed after payment. The fee is non-refundable."}
          </Typography>
        </Paper>

        <Box id="book-field-consent">
          <FormControlLabel
            control={
              <Checkbox
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  if (e.target.checked) setErrors((x) => ({ ...x, consent: "" }));
                }}
              />
            }
            label={
              <Typography variant="body2">
                I confirm this book is my original work, I hold the rights to publish it (and all co-authors agree),
                and it does not infringe anyone else&apos;s copyright. I agree to the{" "}
                <MuiLink component={NextLink} href="/terms-and-conditions" target="_blank">
                  Terms and Conditions
                </MuiLink>{" "}
                and understand the publication fee is{" "}
                <MuiLink component={NextLink} href="/refund-policy" target="_blank">
                  non-refundable
                </MuiLink>
                , regardless of the editorial decision.
              </Typography>
            }
            sx={{ alignItems: "flex-start", mr: 0, "& .MuiCheckbox-root": { pt: 0.25 } }}
          />
          {touchedSubmit && !consent && (
            <FormHelperText error sx={{ ml: 4 }}>
              Please confirm the declaration to continue
            </FormHelperText>
          )}
        </Box>

        {progress && (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {progress.label}... {progress.pct}%
            </Typography>
            <LinearProgress variant="determinate" value={progress.pct} />
          </Box>
        )}

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitting || checking}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {submitting
            ? progress
              ? "Uploading..."
              : "Processing..."
            : pendingPaymentRef.current
              ? "Retry Submission (already paid)"
              : payable === 0
                ? "Submit Publication Request"
                : `Proceed to Pay ${formatInr(payable)}`}
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
