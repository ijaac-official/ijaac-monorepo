"use client";

import * as React from "react";
import Link from "next/link";
import type { Issue } from "@ijaac/shared";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MAX_WIDTH = { sm: 160, md: 240, lg: 320 } as const;

/** "November 2026" for monthly issues, else the year. */
export function issuePeriodLabel(issue: Pick<Issue, "month" | "year">): string {
  return issue.month && issue.month >= 1 && issue.month <= 12
    ? `${MONTHS[issue.month - 1]} ${issue.year}`
    : String(issue.year);
}

export function issueVolumeLabel(issue: Pick<Issue, "volume" | "number">): string {
  return `Vol ${issue.volume}, Issue ${issue.number}`;
}

/**
 * Issue cover card. 3:4 aspect, uploaded cover image (object-fit: cover)
 * or a designed crimson fallback cover. Fills its container width up to a
 * max width set by `size`. Pass `href` to make the whole card a link.
 */
export default function IssueCover({
  issue,
  size = "md",
  href,
}: {
  issue: Issue;
  size?: "sm" | "md" | "lg";
  href?: string;
}) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const showImage = !!issue.coverImageUrl && !imageFailed;
  const volumeLabel = issueVolumeLabel(issue);
  const periodLabel = issuePeriodLabel(issue);
  const scale = size === "sm" ? 0.7 : size === "lg" ? 1.25 : 1;
  const label = `${issue.title ?? volumeLabel} cover - ${volumeLabel}, ${periodLabel}`;

  const card = (
    <Box
      role="img"
      aria-label={label}
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: MAX_WIDTH[size],
        aspectRatio: "3 / 4",
        overflow: "hidden",
        bgcolor: "primary.dark",
        boxShadow: "0 8px 22px rgba(40, 10, 15, 0.22)",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        ...(href && {
          "@media (hover: hover)": {
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: "0 14px 30px rgba(40, 10, 15, 0.3)",
            },
          },
        }),
      }}
    >
      {showImage ? (
        <>
          <Box
            component="img"
            src={issue.coverImageUrl}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          {/* Caption strip so volume / issue is always readable over any image */}
          <Box
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              px: 1.5 * scale,
              py: 1 * scale,
              background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(20,6,9,0.85) 100%)",
              color: "#fff",
              pt: 4 * scale,
            }}
          >
            <Typography sx={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13 * scale, lineHeight: 1.2 }}>
              {volumeLabel}
            </Typography>
            <Typography sx={{ fontSize: 11 * scale, opacity: 0.85, lineHeight: 1.3 }}>{periodLabel}</Typography>
          </Box>
        </>
      ) : (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            color: "#fff",
            background: "linear-gradient(155deg, #9c3347 0%, #7a1f2b 45%, #4a0f18 100%)",
            display: "flex",
            flexDirection: "column",
            p: 2 * scale,
          }}
        >
          {/* Decorative frame and pattern */}
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 8 * scale,
              border: "1px solid rgba(212, 160, 23, 0.55)",
              pointerEvents: "none",
            }}
          />
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              right: -40 * scale,
              bottom: -40 * scale,
              width: 180 * scale,
              height: 180 * scale,
              borderRadius: "50%",
              border: `${18 * scale}px solid rgba(212, 160, 23, 0.12)`,
              pointerEvents: "none",
            }}
          />
          <Box sx={{ position: "relative", mt: 1 * scale, textAlign: "center" }}>
            <Typography
              sx={{
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                letterSpacing: 3 * scale,
                fontSize: 26 * scale,
                lineHeight: 1,
                color: "#d4a017",
              }}
            >
              IJAAC
            </Typography>
            <Typography sx={{ fontSize: 9.5 * scale, lineHeight: 1.35, mt: 0.75 * scale, opacity: 0.9, px: 1 }}>
              International Journal of Applied AI &amp; Computing
            </Typography>
            <Box sx={{ width: "40%", height: 2, bgcolor: "#d4a017", mx: "auto", mt: 1.25 * scale }} />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ position: "relative", textAlign: "center", mb: 1.5 * scale }}>
            <Typography
              sx={{
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 17 * scale,
                lineHeight: 1.2,
              }}
            >
              {volumeLabel}
            </Typography>
            <Typography
              sx={{
                fontSize: 12 * scale,
                mt: 0.5 * scale,
                textTransform: "uppercase",
                letterSpacing: 1.5 * scale,
                color: "#f1d27a",
              }}
            >
              {periodLabel}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );

  if (!href) return card;
  return (
    <Box
      component={Link}
      href={href}
      aria-label={`Open ${issue.title ?? volumeLabel}`}
      sx={{
        display: "block",
        width: "100%",
        maxWidth: MAX_WIDTH[size],
        color: "inherit",
        textDecoration: "none",
        "&:focus-visible": { outline: "3px solid #d4a017", outlineOffset: 3 },
      }}
    >
      {card}
    </Box>
  );
}
