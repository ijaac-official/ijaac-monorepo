import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Skeleton from "@mui/material/Skeleton";

/** Placeholder for pages whose whole content (including the title) comes from S3. */
export default function DetailSkeleton() {
  return (
    <Box aria-busy="true">
      <Box sx={{ background: "linear-gradient(120deg, #4a1017 0%, #7a1f2b 55%, #8f2a37 100%)", py: { xs: 6, md: 9 } }}>
        <Container maxWidth="lg">
          <Skeleton variant="text" width="55%" height={56} sx={{ bgcolor: "rgba(255,255,255,0.15)" }} />
          <Skeleton variant="text" width="35%" sx={{ bgcolor: "rgba(255,255,255,0.15)" }} />
        </Container>
      </Box>
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Skeleton variant="text" width={120} />
        <Skeleton variant="text" width="70%" height={32} />
        <Skeleton variant="rectangular" height={160} sx={{ my: 3 }} />
        <Skeleton variant="text" />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="80%" />
      </Container>
    </Box>
  );
}
