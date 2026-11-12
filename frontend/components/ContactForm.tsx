"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema } from "@ijaac/shared";
import type { z } from "zod";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";

type FormValues = z.infer<typeof contactFormSchema>;

export default function ContactForm() {
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(contactFormSchema) });

  const onSubmit = async (values: FormValues) => {
    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
    }
  };

  return (
    <Stack component="form" spacing={2.5} onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 560 }}>
      {status === "success" && <Alert severity="success">Message sent. We'll get back to you soon.</Alert>}
      {status === "error" && <Alert severity="error">Something went wrong. Please try again.</Alert>}

      <TextField
        label="Name"
        {...register("name")}
        error={!!errors.name}
        helperText={errors.name?.message}
        fullWidth
      />
      <TextField
        label="Email"
        {...register("email")}
        error={!!errors.email}
        helperText={errors.email?.message}
        fullWidth
      />
      <TextField label="Subject" {...register("subject")} fullWidth />
      <TextField
        label="Message"
        {...register("message")}
        error={!!errors.message}
        helperText={errors.message?.message}
        multiline
        rows={5}
        fullWidth
      />
      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={status === "submitting"}
        startIcon={status === "submitting" ? <CircularProgress size={18} /> : undefined}
      >
        Send Message
      </Button>
    </Stack>
  );
}
