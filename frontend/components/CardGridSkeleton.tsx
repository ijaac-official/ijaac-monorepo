import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Box from "@mui/material/Box";

export default function CardGridSkeleton({
  count = 6,
  mediaHeight = 220,
  bare = false,
}: {
  count?: number;
  mediaHeight?: number;
  /** Skip the banner-shaped block - use when the real banner is already rendered */
  bare?: boolean;
}) {
  return (
    <>
      {!bare && <Box sx={{ bgcolor: "primary.light", opacity: 0.3, height: { xs: 200, md: 280 } }} />}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={3}>
          {Array.from({ length: count }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={mediaHeight} />
              <Skeleton variant="text" sx={{ mt: 1.5 }} width="80%" height={28} />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="90%" />
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
}
