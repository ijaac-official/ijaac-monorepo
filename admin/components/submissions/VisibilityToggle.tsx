"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Tooltip from "@mui/material/Tooltip";
import { readError } from "./meta";

export default function VisibilityToggle({
  submissionId,
  isPublic,
  showLabel = false,
  size = "small",
}: {
  submissionId: string;
  isPublic: boolean;
  showLabel?: boolean;
  size?: "small" | "medium";
}) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [checked, setChecked] = React.useState(isPublic);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => setChecked(isPublic), [isPublic]);

  const onChange = async (next: boolean) => {
    setChecked(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/visibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: next }),
      });
      if (!res.ok) throw new Error(await readError(res, "Could not change visibility"));
      enqueueSnackbar(next ? "Paper is now public" : "Paper is now private", { variant: "success" });
      router.refresh();
    } catch (err) {
      setChecked(!next);
      enqueueSnackbar(err instanceof Error ? err.message : "Could not change visibility", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const control = (
    <Switch
      size={size}
      checked={checked}
      disabled={saving}
      onChange={(e) => onChange(e.target.checked)}
      inputProps={{ "aria-label": "Public visibility" }}
    />
  );

  const title = checked
    ? "Public - shown on the website once published"
    : "Private - hidden from the public website";

  if (!showLabel) {
    return (
      <Tooltip title={title}>
        <span>{control}</span>
      </Tooltip>
    );
  }
  return (
    <Tooltip title={title}>
      <FormControlLabel control={control} label={checked ? "Public" : "Private"} />
    </Tooltip>
  );
}
