import type * as React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export default function ReviewerStatTile({
  icon,
  value,
  label,
  accent = "primary",
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  accent?: "primary" | "secondary";
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 2,
        borderTop: "3px solid",
        borderTopColor: accent === "primary" ? "primary.main" : "secondary.main",
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          bgcolor: accent === "primary" ? "rgba(122,31,43,0.08)" : "rgba(212,160,23,0.14)",
          color: accent === "primary" ? "primary.main" : "secondary.dark",
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{ fontSize: { xs: 32, md: 40 }, fontWeight: 700, lineHeight: 1, fontFamily: "var(--font-heading)" }}
        >
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {label}
        </Typography>
      </Box>
    </Paper>
  );
}
