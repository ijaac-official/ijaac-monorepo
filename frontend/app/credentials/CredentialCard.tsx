import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import VerifiedIcon from "@mui/icons-material/Verified";
import Image from "next/image";

/** Shared frame for the public credential pages: masthead + green verified badge. */
export default function CredentialCard({
  kind,
  children,
}: {
  kind: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ bgcolor: "grey.50", py: { xs: 4, md: 8 } }}>
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            overflow: "hidden",
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 12px 40px rgba(85,19,25,0.08)",
          }}
        >
          <Box
            sx={{
              background: "linear-gradient(115deg, #551319 0%, #7a1f2b 60%, #8f2a37 100%)",
              color: "white",
              px: { xs: 2.5, md: 4 },
              py: { xs: 2.5, md: 3 },
              borderBottom: "4px solid #d4a017",
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ bgcolor: "white", borderRadius: 2, p: 0.75, display: "flex" }}>
                  <Image src="/logo.png" alt="IJAAC logo" width={56} height={38} style={{ objectFit: "contain" }} />
                </Box>
                <Box>
                  <Typography variant="overline" sx={{ opacity: 0.85, lineHeight: 1.4, display: "block" }}>
                    {kind}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700} lineHeight={1.3}>
                    International Journal of Applied AI &amp; Computing
                  </Typography>
                </Box>
              </Stack>
              <Chip
                icon={<VerifiedIcon sx={{ color: "#fff !important" }} />}
                label="Verified credential"
                sx={{ bgcolor: "#1e8e3e", color: "white", fontWeight: 700, px: 0.5 }}
              />
            </Stack>
          </Box>
          <Box sx={{ px: { xs: 2.5, md: 4 }, py: { xs: 3, md: 4 } }}>{children}</Box>
        </Paper>
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 2, textAlign: "center" }}>
          This record is generated live from the IJAAC publication database. If a paper is withdrawn
          or made private, its credentials stop verifying.
        </Typography>
      </Container>
    </Box>
  );
}

export function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.6, display: "block" }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} sx={{ wordBreak: "break-word" }}>
        {value}
      </Typography>
    </Box>
  );
}
