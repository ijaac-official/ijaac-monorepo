"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

export default function Carousel({
  children,
  itemWidth = 320,
}: {
  children: React.ReactNode[];
  itemWidth?: number;
}) {
  const trackRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = (card?.offsetWidth ?? itemWidth) + 16;
    el.scrollBy({ left: direction === "left" ? -step : step, behavior: "smooth" });
  };

  return (
    <Box sx={{ position: "relative" }}>
      <Box
        ref={trackRef}
        sx={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollBehavior: "smooth",
          pb: 1,
          "&::-webkit-scrollbar": { height: 6 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "divider", borderRadius: 4 },
        }}
      >
        {children.map((child, i) => (
          <Box
            key={i}
            sx={{
              flex: { xs: "0 0 78%", sm: `0 0 ${itemWidth}px` },
              maxWidth: { xs: 340, sm: "none" },
              scrollSnapAlign: "start",
            }}
          >
            {child}
          </Box>
        ))}
      </Box>

      {children.length > 2 && (
        <>
          <IconButton
            aria-label="Scroll left"
            onClick={() => scroll("left")}
            size="small"
            sx={{
              position: "absolute",
              top: "40%",
              left: -8,
              bgcolor: "background.paper",
              boxShadow: 2,
              "&:hover": { bgcolor: "background.paper" },
              display: { xs: "none", sm: "inline-flex" },
            }}
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
          <IconButton
            aria-label="Scroll right"
            onClick={() => scroll("right")}
            size="small"
            sx={{
              position: "absolute",
              top: "40%",
              right: -8,
              bgcolor: "background.paper",
              boxShadow: 2,
              "&:hover": { bgcolor: "background.paper" },
              display: { xs: "none", sm: "inline-flex" },
            }}
          >
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </>
      )}
    </Box>
  );
}
