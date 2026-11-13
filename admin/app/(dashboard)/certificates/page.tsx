"use client";

import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

export default function CertificatesPage() {
  return (
    <>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Certificate Template
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        This is the certificate automatically generated and emailed to every author when a
        submission is approved (and again on publication if not yet sent). Placeholder values are shown below - the real certificate uses the
        author's name, affiliation, paper title, volume/issue, article number and a verification link (www.ijaac.in/credentials/author/...).
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, mb: 3, maxWidth: 480 }}>
        <Button
          variant="contained"
          startIcon={<OpenInNewIcon />}
          href="/api/certificates/preview"
          target="_blank"
          rel="noopener noreferrer"
        >
          Preview Sample Certificate
        </Button>
      </Paper>

      <Box
        component="iframe"
        src="/api/certificates/preview"
        title="Certificate preview"
        sx={{ width: "100%", maxWidth: 900, height: 640, border: "1px solid", borderColor: "divider" }}
      />
    </>
  );
}
