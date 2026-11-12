import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

export default function Loading() {
  return (
    <>
      <Box sx={{ bgcolor: "primary.light", opacity: 0.3, height: { xs: 200, md: 280 } }} />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Stack spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Box key={i} sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
              <Skeleton variant="text" width="70%" height={32} />
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" width="30%" />
            </Box>
          ))}
        </Stack>
      </Container>
    </>
  );
}
