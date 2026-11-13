"use client";

import * as React from "react";
import Link from "next/link";
import { useSnackbar } from "notistack";
import { reviewerApplicationSchema } from "@ijaac/shared";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import PsychologyOutlinedIcon from "@mui/icons-material/PsychologyOutlined";
import LinkIcon from "@mui/icons-material/Link";
import EditNoteIcon from "@mui/icons-material/EditNote";
import SendIcon from "@mui/icons-material/Send";

type Values = {
  name: string;
  email: string;
  phone: string;
  designation: string;
  affiliation: string;
  country: string;
  qualification: string;
  experienceYears: string;
  areasOfInterest: string[];
  linkedinUrl: string;
  orcid: string;
  photoUrl: string;
  bio: string;
  motivation: string;
};

type FieldErrors = Partial<Record<keyof Values, string>>;

const INITIAL: Values = {
  name: "",
  email: "",
  phone: "",
  designation: "",
  affiliation: "",
  country: "",
  qualification: "",
  experienceYears: "",
  areasOfInterest: [],
  linkedinUrl: "",
  orcid: "",
  photoUrl: "",
  bio: "",
  motivation: "",
};

const EXPERTISE_SUGGESTIONS = [
  "Machine Learning",
  "Deep Learning",
  "Natural Language Processing",
  "Computer Vision",
  "Reinforcement Learning",
  "Generative AI",
  "Large Language Models",
  "Data Science",
  "Big Data Analytics",
  "Internet of Things",
  "Cloud Computing",
  "Edge Computing",
  "Cyber Security",
  "Blockchain",
  "Robotics",
  "Explainable AI",
  "Healthcare AI",
  "Signal Processing",
  "Optimization",
  "Software Engineering",
  "Human-Computer Interaction",
  "Wireless Networks",
];

const MAX_BIO = 2000;

function toPayload(v: Values) {
  const years = v.experienceYears.trim();
  return {
    name: v.name,
    email: v.email,
    phone: v.phone,
    designation: v.designation,
    affiliation: v.affiliation,
    country: v.country,
    qualification: v.qualification,
    experienceYears: years === "" ? undefined : Number(years),
    areasOfInterest: v.areasOfInterest,
    linkedinUrl: v.linkedinUrl.trim(),
    orcid: v.orcid.trim() || undefined,
    photoUrl: v.photoUrl.trim(),
    bio: v.bio.trim() || undefined,
    motivation: v.motivation.trim() || undefined,
  };
}

function validate(v: Values): FieldErrors {
  const errors: FieldErrors = {};
  const years = v.experienceYears.trim();
  if (years !== "" && !/^\d+$/.test(years)) errors.experienceYears = "Enter a whole number of years";
  const parsed = reviewerApplicationSchema.safeParse(toPayload(v));
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>;
    for (const [key, msgs] of Object.entries(fe)) {
      if (!msgs?.length || errors[key as keyof Values]) continue;
      errors[key as keyof Values] = friendly(key as keyof Values, msgs[0]!);
    }
  }
  if (v.orcid.trim() && !/^(https?:\/\/orcid\.org\/)?\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i.test(v.orcid.trim())) {
    errors.orcid = "Use the format 0000-0000-0000-0000";
  }
  return errors;
}

function friendly(key: keyof Values, msg: string): string {
  if (key === "linkedinUrl" || key === "photoUrl") return "Enter a full URL starting with https://";
  if (key === "experienceYears") return "Enter a number between 0 and 70";
  if (key === "bio" || key === "motivation") return `Please keep this under ${MAX_BIO} characters`;
  if (key === "areasOfInterest" && /at least/i.test(msg)) return msg;
  if (key === "areasOfInterest") return "Each area must be at least 2 characters (maximum 15 areas)";
  return msg;
}

function SectionHeader({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          bgcolor: "primary.main",
          color: "white",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h6" lineHeight={1.2}>
          {title}
        </Typography>
        {hint && (
          <Typography variant="body2" color="text.secondary">
            {hint}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: { xs: 2.5, md: 3.5 }, borderTop: "3px solid", borderTopColor: "secondary.main" }}
    >
      {children}
    </Paper>
  );
}

export default function ReviewerApplicationForm() {
  const { enqueueSnackbar } = useSnackbar();
  const [values, setValues] = React.useState<Values>(INITIAL);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [attempted, setAttempted] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [done, setDone] = React.useState<{ name: string; email: string } | null>(null);
  const [areaInput, setAreaInput] = React.useState("");
  const honeypot = React.useRef<HTMLInputElement>(null);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    const next = { ...values, [key]: value };
    setValues(next);
    if (attempted) setErrors(validate(next));
  };

  const field = (key: Exclude<keyof Values, "areasOfInterest">) => ({
    value: values[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(key, e.target.value),
    error: !!errors[key],
    fullWidth: true,
    name: key,
    id: `reviewer-${key}`,
  });

  const addArea = (raw: string) => {
    const parts = raw
      .split(/[,;\n]/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const existing = new Set(values.areasOfInterest.map((a) => a.toLowerCase()));
    const merged = [...values.areasOfInterest];
    for (const p of parts) if (!existing.has(p.toLowerCase())) merged.push(p);
    set("areasOfInterest", merged.slice(0, 15));
    setAreaInput("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setAttempted(true);
    // commit any half-typed expertise area
    let current = values;
    if (areaInput.trim()) {
      const extra = areaInput.split(/[,;]/).map((p) => p.trim()).filter(Boolean);
      current = { ...values, areasOfInterest: [...values.areasOfInterest, ...extra].slice(0, 15) };
      setValues(current);
      setAreaInput("");
    }
    const found = validate(current);
    setErrors(found);
    if (Object.keys(found).length) {
      enqueueSnackbar("Please correct the highlighted fields", { variant: "warning" });
      const first = Object.keys(found)[0];
      document.getElementById(`reviewer-${first}`)?.focus();
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/reviewers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...toPayload(current), website: honeypot.current?.value ?? "" }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        fieldErrors?: Record<string, string[] | undefined>;
      };
      if (!res.ok) {
        if (res.status === 409) {
          setErrors((prev) => ({ ...prev, email: data.error ?? "This email is already registered" }));
        }
        if (data.fieldErrors) {
          const mapped: FieldErrors = {};
          for (const [k, msgs] of Object.entries(data.fieldErrors)) {
            if (msgs?.[0]) mapped[k as keyof Values] = friendly(k as keyof Values, msgs[0]);
          }
          setErrors((prev) => ({ ...prev, ...mapped }));
        }
        enqueueSnackbar(data.error ?? "Something went wrong. Please try again.", { variant: "error" });
        return;
      }
      enqueueSnackbar("Application submitted - thank you!", { variant: "success" });
      setDone({ name: current.name.trim(), email: current.email.trim() });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      enqueueSnackbar("Network error. Please check your connection and try again.", { variant: "error" });
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 4, md: 6 },
          textAlign: "center",
          borderTop: "4px solid",
          borderTopColor: "secondary.main",
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 72, color: "success.main", mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Application received
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560, mx: "auto", mb: 1 }}>
          Thank you, {done.name.split(/\s+/)[0]}. Our editors will review your application and you will get an
          email at <b>{done.email}</b> as soon as a decision is made.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560, mx: "auto", mb: 4 }}>
          We have also sent you an acknowledgement email - if you do not see it, please check your spam folder.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
          <Button component={Link} href="/reviewers" variant="contained">
            Meet our reviewers
          </Button>
          <Button component={Link} href="/" variant="outlined">
            Back to home
          </Button>
        </Stack>
      </Paper>
    );
  }

  const errorCount = Object.keys(errors).length;

  return (
    <Box component="form" noValidate onSubmit={onSubmit}>
      {/* Honeypot - hidden from humans and assistive tech */}
      <Box
        aria-hidden
        sx={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}
      >
        <label htmlFor="reviewer-website">Website</label>
        <input id="reviewer-website" name="website" type="text" tabIndex={-1} autoComplete="off" ref={honeypot} />
      </Box>

      <Stack spacing={3}>
        {attempted && errorCount > 0 && (
          <Alert severity="warning">
            Please fix {errorCount} {errorCount === 1 ? "field" : "fields"} highlighted below.
          </Alert>
        )}

        <Section>
          <SectionHeader icon={<PersonOutlineIcon />} title="Personal details" hint="How we will contact you" />
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField label="Full name" required autoComplete="name" {...field("name")} helperText={errors.name} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                type="email"
                required
                autoComplete="email"
                {...field("email")}
                helperText={errors.email ?? "Decision emails are sent here"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Mobile number"
                type="tel"
                required
                autoComplete="tel"
                placeholder="+91 98765 43210"
                {...field("phone")}
                helperText={errors.phone ?? "Include country code"}
              />
            </Grid>
          </Grid>
        </Section>

        <Section>
          <SectionHeader icon={<WorkOutlineIcon />} title="Professional details" hint="Your current role and background" />
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Designation"
                required
                placeholder="e.g. Associate Professor"
                {...field("designation")}
                helperText={errors.designation}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Affiliation / Institution"
                required
                autoComplete="organization"
                {...field("affiliation")}
                helperText={errors.affiliation}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Country"
                required
                autoComplete="country-name"
                {...field("country")}
                helperText={errors.country}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Highest qualification"
                required
                placeholder="e.g. PhD in Computer Science"
                {...field("qualification")}
                helperText={errors.qualification}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Years of experience"
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                {...field("experienceYears")}
                helperText={errors.experienceYears ?? "Research / teaching / industry"}
                InputProps={{ endAdornment: <InputAdornment position="end">years</InputAdornment> }}
              />
            </Grid>
          </Grid>
        </Section>

        <Section>
          <SectionHeader
            icon={<PsychologyOutlinedIcon />}
            title="Areas of expertise"
            hint="We match manuscripts to reviewers using these"
          />
          <Autocomplete
            multiple
            freeSolo
            options={EXPERTISE_SUGGESTIONS.filter(
              (s) => !values.areasOfInterest.some((a) => a.toLowerCase() === s.toLowerCase())
            )}
            value={values.areasOfInterest}
            inputValue={areaInput}
            onInputChange={(_e, v, reason) => {
              if (reason === "reset") return;
              if (/[,;]/.test(v)) addArea(v);
              else setAreaInput(v);
            }}
            onChange={(_e, v) => {
              const cleaned = Array.from(
                new Map((v as string[]).map((x) => x.trim()).filter(Boolean).map((x) => [x.toLowerCase(), x])).values()
              );
              set("areasOfInterest", cleaned.slice(0, 15));
              setAreaInput("");
            }}
            renderTags={(tags, getTagProps) =>
              tags.map((tag, index) => {
                const { key, ...rest } = getTagProps({ index });
                return (
                  <Chip
                    key={key}
                    label={tag}
                    variant="outlined"
                    color="primary"
                    size="small"
                    sx={{ borderRadius: 999 }}
                    {...rest}
                  />
                );
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                id="reviewer-areasOfInterest"
                label="Areas of interest"
                required
                placeholder={values.areasOfInterest.length ? "Add another" : "Type and press Enter, or pick a suggestion"}
                error={!!errors.areasOfInterest}
                helperText={
                  errors.areasOfInterest ??
                  `${values.areasOfInterest.length}/15 added - press Enter or comma after each area`
                }
                onBlur={() => areaInput.trim() && addArea(areaInput)}
              />
            )}
          />
        </Section>

        <Section>
          <SectionHeader icon={<LinkIcon />} title="Links" hint="Optional, but they help editors verify your profile" />
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="LinkedIn profile URL"
                placeholder="https://www.linkedin.com/in/..."
                {...field("linkedinUrl")}
                helperText={errors.linkedinUrl}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="ORCID iD" placeholder="0000-0002-1825-0097" {...field("orcid")} helperText={errors.orcid} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Photo URL"
                placeholder="https://..."
                {...field("photoUrl")}
                helperText={errors.photoUrl ?? "A link to a square headshot, shown on your public profile"}
              />
            </Grid>
          </Grid>
        </Section>

        <Section>
          <SectionHeader icon={<EditNoteIcon />} title="About you" hint="Shown on your public profile once approved" />
          <Stack spacing={2.5}>
            <TextField
              label="Short bio"
              multiline
              minRows={4}
              {...field("bio")}
              helperText={errors.bio ?? `${values.bio.length}/${MAX_BIO}`}
            />
            <TextField
              label="Why would you like to review for IJAAC?"
              multiline
              minRows={3}
              {...field("motivation")}
              helperText={errors.motivation ?? "Only visible to the editors"}
            />
          </Stack>
        </Section>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between">
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520 }}>
            By applying you agree that the editors may contact you about review invitations. Your email and mobile
            number are never shown publicly.
          </Typography>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={sending}
            endIcon={sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
            sx={{ minWidth: 220, py: 1.5 }}
          >
            {sending ? "Submitting..." : "Submit application"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
