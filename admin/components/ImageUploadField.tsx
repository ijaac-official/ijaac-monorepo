"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import UploadFileIcon from "@mui/icons-material/UploadFile";

const ACCEPT_ATTR = "image/jpeg,image/png,image/webp,image/gif";

export default function ImageUploadField({
  label,
  value,
  onChange,
  folder,
  variant = "circle",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: "books" | "reviewers" | "editorial-board" | "issues";
  variant?: "circle" | "rect";
}) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/uploads/image", { method: "POST", body: formData });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Upload failed");
      onChange(body.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        {variant === "circle" ? (
          <Avatar src={value} sx={{ width: 64, height: 64 }} />
        ) : (
          <Box
            sx={{
              width: 56,
              height: 80,
              bgcolor: "action.hover",
              backgroundImage: value ? `url(${value})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              flexShrink: 0,
            }}
          />
        )}
        <Button component="label" variant="outlined" size="small" startIcon={uploading ? <CircularProgress size={14} /> : <UploadFileIcon />} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload Image"}
          <input type="file" hidden accept={ACCEPT_ATTR} onChange={handleFileChange} />
        </Button>
      </Stack>
      {error && (
        <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
          {error}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
        JPEG, PNG, WEBP, or GIF. Maximum 5 MB.
      </Typography>
    </Box>
  );
}
