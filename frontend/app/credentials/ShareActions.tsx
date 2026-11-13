"use client";

import * as React from "react";
import { useSnackbar } from "notistack";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

export interface LinkedInCertification {
  name: string;
  issueYear: number;
  issueMonth: number;
  certId: string;
}

/** Copy-link / share buttons for credential pages. */
export default function ShareActions({
  url,
  addToProfile,
}: {
  url: string;
  /** When set, shows LinkedIn's "Add to profile" (licenses & certifications) link. */
  addToProfile?: LinkedInCertification;
}) {
  const { enqueueSnackbar } = useSnackbar();

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const el = document.createElement("textarea");
        el.value = url;
        el.setAttribute("readonly", "");
        el.style.position = "absolute";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      enqueueSnackbar("Link copied to clipboard", { variant: "success" });
    } catch {
      enqueueSnackbar("Could not copy the link - please copy it from the address bar", { variant: "error" });
    }
  };

  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  let addUrl: string | undefined;
  if (addToProfile) {
    const params = new URLSearchParams({
      startTask: "CERTIFICATION_NAME",
      name: addToProfile.name,
      organizationName: "IJAAC",
      issueYear: String(addToProfile.issueYear),
      issueMonth: String(addToProfile.issueMonth),
      certUrl: url,
      certId: addToProfile.certId,
    });
    addUrl = `https://www.linkedin.com/profile/add?${params.toString()}`;
  }

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} useFlexGap flexWrap="wrap">
      {addUrl && (
        <Button
          href={addUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          sx={{ bgcolor: "#0a66c2", "&:hover": { bgcolor: "#004182" } }}
        >
          Add to LinkedIn profile
        </Button>
      )}
      <Button
        href={shareUrl}
        target="_blank"
        rel="noopener noreferrer"
        variant="outlined"
        startIcon={<LinkedInIcon />}
        sx={{ color: "#0a66c2", borderColor: "#0a66c2" }}
      >
        Share on LinkedIn
      </Button>
      <Button variant="outlined" color="inherit" startIcon={<ContentCopyIcon />} onClick={copy}>
        Copy link
      </Button>
    </Stack>
  );
}
