import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Image from "next/image";

export default function PageHero({
  title,
  subtitle,
  image,
}: {
  title: string;
  subtitle?: string;
  image?: string;
}) {
  return (
    <Box
      sx={{
        position: "relative",
        bgcolor: "primary.main",
        color: "white",
        py: { xs: 6, md: 9 },
        overflow: "hidden",
      }}
    >
      {image && (
        <>
          <Image src={image} alt="" fill style={{ objectFit: "cover" }} priority />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(115deg, rgba(85,19,25,0.92) 0%, rgba(122,31,43,0.8) 55%, rgba(85,19,25,0.55) 100%)",
            }}
          />
        </>
      )}
      <Container maxWidth="lg" sx={{ position: "relative" }}>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 760, fontWeight: 400 }}>
            {subtitle}
          </Typography>
        )}
      </Container>
    </Box>
  );
}
