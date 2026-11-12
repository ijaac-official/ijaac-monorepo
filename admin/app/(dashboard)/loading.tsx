import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

export default function Loading() {
  return (
    <Box>
      <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
      <Stack spacing={1.5}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={56} />
        ))}
      </Stack>
    </Box>
  );
}
