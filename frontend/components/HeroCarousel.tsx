"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

interface Slide {
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
}

const SLIDES: Slide[] = [
  {
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80",
    eyebrow: "Peer-Reviewed - Open Access",
    title: "International Journal of Applied AI & Computing",
    subtitle:
      "Publishing original research in applied artificial intelligence, machine learning, data science, and computing.",
    ctaLabel: "Submit Your Paper",
    ctaHref: "/submit-paper",
  },
  {
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1920&q=80",
    eyebrow: "Rigorous Review",
    title: "A Trusted Platform for Computing Research",
    subtitle: "Every submission is screened and peer-reviewed by subject-matter experts worldwide.",
    ctaLabel: "Meet Our Reviewers",
    ctaHref: "/reviewers",
  },
  {
    image: "/stock/indian-researcher-2.jpg",
    eyebrow: "Current Issue",
    title: "Read the Latest Published Research",
    subtitle: "Explore our current issue and browse the full archive of past publications.",
    ctaLabel: "View Current Issue",
    ctaHref: "/current-issue",
  },
  {
    image: "/stock/indian-researcher-1.jpg",
    eyebrow: "Join the Community",
    title: "Become Part of Our Editorial Network",
    subtitle: "Reviewers and editorial board members from leading institutions guide every decision.",
    ctaLabel: "Editorial Board",
    ctaHref: "/editorial-board",
  },
];

const AUTO_ADVANCE_MS = 6000;

export default function HeroCarousel() {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, []);

  const goTo = (i: number) => setIndex((i + SLIDES.length) % SLIDES.length);

  return (
    <Box sx={{ position: "relative", height: { xs: 560, sm: 520, md: 560 }, overflow: "hidden" }}>
      {SLIDES.map((slide, i) => (
        <Box
          key={slide.image}
          sx={{
            position: "absolute",
            inset: 0,
            opacity: i === index ? 1 : 0,
            transition: "opacity 0.8s ease",
          }}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            priority={i === 0}
            style={{ objectFit: "cover" }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(115deg, rgba(85,19,25,0.92) 0%, rgba(122,31,43,0.75) 45%, rgba(85,19,25,0.35) 100%)",
            }}
          />
        </Box>
      ))}

      <Container
        maxWidth="lg"
        sx={{
          position: "relative",
          height: "100%",
          display: "flex",
          alignItems: "center",
          color: "white",
          pb: { xs: 5, sm: 0 },
        }}
      >
        <Box sx={{ maxWidth: 680, width: "100%" }}>
          <Typography
            variant="overline"
            sx={{ color: "secondary.light", fontWeight: 700, letterSpacing: 1.5, fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
          >
            {SLIDES[index].eyebrow}
          </Typography>
          <Typography
            variant="h3"
            component="h2"
            fontWeight={700}
            gutterBottom
            sx={{ mt: 1, fontSize: { xs: "1.6rem", sm: "2.2rem", md: "3rem" }, lineHeight: 1.2 }}
          >
            {SLIDES[index].title}
          </Typography>
          <Typography
            variant="h6"
            sx={{ opacity: 0.9, mb: 3, fontWeight: 400, fontSize: { xs: "0.9rem", sm: "1.1rem", md: "1.25rem" } }}
          >
            {SLIDES[index].subtitle}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ width: { xs: "100%", sm: "auto" } }}>
            <Button
              component={Link}
              href={SLIDES[index].ctaHref}
              variant="contained"
              color="secondary"
              size="large"
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              {SLIDES[index].ctaLabel}
            </Button>
            <Button
              component={Link}
              href="/current-issue"
              variant="outlined"
              color="inherit"
              size="large"
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              View Current Issue
            </Button>
          </Stack>
        </Box>
      </Container>

      <IconButton
        aria-label="Previous slide"
        onClick={() => goTo(index - 1)}
        sx={{
          position: "absolute",
          top: "50%",
          left: 16,
          color: "white",
          bgcolor: "rgba(0,0,0,0.25)",
          "&:hover": { bgcolor: "rgba(0,0,0,0.4)" },
          display: { xs: "none", sm: "inline-flex" },
        }}
      >
        <ArrowBackIosNewIcon fontSize="small" />
      </IconButton>
      <IconButton
        aria-label="Next slide"
        onClick={() => goTo(index + 1)}
        sx={{
          position: "absolute",
          top: "50%",
          right: 16,
          color: "white",
          bgcolor: "rgba(0,0,0,0.25)",
          "&:hover": { bgcolor: "rgba(0,0,0,0.4)" },
          display: { xs: "none", sm: "inline-flex" },
        }}
      >
        <ArrowForwardIosIcon fontSize="small" />
      </IconButton>

      <Stack
        direction="row"
        spacing={1}
        sx={{ position: "absolute", bottom: { xs: 10, sm: 20 }, left: 0, right: 0, justifyContent: "center" }}
      >
        {SLIDES.map((slide, i) => (
          <Box
            key={slide.image}
            component="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i)}
            sx={{
              width: i === index ? 28 : 10,
              height: 4,
              border: "none",
              p: 0,
              cursor: "pointer",
              bgcolor: i === index ? "secondary.main" : "rgba(255,255,255,0.5)",
              transition: "width 0.3s ease, background-color 0.3s ease",
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}
