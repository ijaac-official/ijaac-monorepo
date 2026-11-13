"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import { keyframes } from "@mui/material/styles";

const setInert = (el: HTMLElement | null) => {
  if (el && !el.hasAttribute("inert")) el.setAttribute("inert", "");
};

const scroll = keyframes`
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(-50%, 0, 0); }
`;

/**
 * Continuous, seamless auto-scrolling strip. The item list is repeated until
 * a single "half" is wide enough, then the half is rendered twice and the
 * track slides by exactly -50%, so the loop restarts invisibly.
 * Pauses on hover and keyboard focus; with prefers-reduced-motion it becomes
 * a plain horizontally scrollable row.
 */
export default function Marquee({
  children,
  itemWidth = 320,
  mobileItemWidth = 270,
  gap = 16,
  secondsPerItem = 7,
  minItemsPerHalf = 8,
  ariaLabel,
}: {
  children: React.ReactNode[];
  itemWidth?: number;
  mobileItemWidth?: number;
  gap?: number;
  /** Speed: time each item takes to pass; total duration scales with item count. */
  secondsPerItem?: number;
  /** Repeat short lists so one half always overflows wide screens. */
  minItemsPerHalf?: number;
  ariaLabel?: string;
}) {
  const items = React.Children.toArray(children);
  if (items.length === 0) return null;

  const repeats = Math.max(1, Math.ceil(minItemsPerHalf / items.length));
  const half = Array.from({ length: repeats }, () => items).flat();
  const duration = Math.max(20, half.length * secondsPerItem);

  const renderHalf = (copy: number) =>
    half.map((child, i) => {
      // Only the first occurrence of each item is reachable by keyboard/AT.
      const isPrimary = copy === 0 && i < items.length;
      return (
        <Box
          key={`${copy}-${i}`}
          aria-hidden={isPrimary ? undefined : true}
          // inert (set via the DOM - React 18 has no inert prop) keeps clones out of the tab order
          ref={isPrimary ? undefined : setInert}
          data-marquee-copy={isPrimary ? undefined : "clone"}
          sx={{
            flex: "0 0 auto",
            width: { xs: mobileItemWidth, sm: itemWidth },
            mr: `${gap}px`,
            display: "flex",
            "& > *": { width: "100%" },
          }}
        >
          {child}
        </Box>
      );
    });

  return (
    <Box
      role="region"
      aria-label={ariaLabel}
      sx={{
        position: "relative",
        overflow: "hidden",
        // soft fade at both edges
        maskImage: "linear-gradient(to right, transparent, #000 4%, #000 96%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, #000 4%, #000 96%, transparent)",
        "&:hover .marquee-track, &:focus-within .marquee-track": { animationPlayState: "paused" },
        "@media (prefers-reduced-motion: reduce)": {
          overflowX: "auto",
          maskImage: "none",
          WebkitMaskImage: "none",
          "& .marquee-track": { animation: "none", transform: "none" },
          "& [data-marquee-copy='clone']": { display: "none" },
        },
      }}
    >
      <Box
        className="marquee-track"
        sx={{
          display: "flex",
          width: "max-content",
          py: 1,
          animation: `${scroll} ${duration}s linear infinite`,
          willChange: "transform",
        }}
      >
        {renderHalf(0)}
        {renderHalf(1)}
      </Box>
    </Box>
  );
}
