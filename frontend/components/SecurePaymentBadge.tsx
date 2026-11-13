import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";

/** "Payments secured by Razorpay" tag - light (on white) or dark (on crimson) tone. */
export default function SecurePaymentBadge({ tone = "light" }: { tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        py: 0.75,
        borderRadius: 999,
        border: "1px solid",
        borderColor: dark ? "rgba(255,255,255,0.35)" : "success.light",
        bgcolor: dark ? "rgba(255,255,255,0.08)" : "rgba(46,125,50,0.06)",
        color: dark ? "white" : "success.dark",
      }}
    >
      <LockOutlinedIcon sx={{ fontSize: 16 }} />
      <Typography variant="caption" fontWeight={600} sx={{ lineHeight: 1.2 }}>
        Payments secured by Razorpay
      </Typography>
      <VerifiedUserOutlinedIcon sx={{ fontSize: 16, opacity: 0.8 }} />
    </Box>
  );
}
