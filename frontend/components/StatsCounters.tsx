"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";

const ICONS = {
  papers: ArticleOutlinedIcon,
  visits: VisibilityOutlinedIcon,
  reviewers: GroupsOutlinedIcon,
  reviews: FactCheckOutlinedIcon,
  authors: PeopleAltOutlinedIcon,
} as const;

export interface StatItem {
  label: string;
  value: number;
  icon?: keyof typeof ICONS;
  suffix?: string;
}

const DURATION_MS = 1600;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function useInViewOnce<T extends Element>() {
  const ref = React.useRef<T>(null);
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView]);
  return { ref, inView };
}

function Counter({ value, start, suffix }: { value: number; start: boolean; suffix?: string }) {
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    if (!start) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || value <= 0) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / DURATION_MS);
      setDisplay(Math.round(easeOutCubic(p) * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, value]);

  return (
    <>
      {display.toLocaleString("en-IN")}
      {suffix}
    </>
  );
}

/** Crimson stats band; numbers count up once when scrolled into view. */
export default function StatsCounters({ items }: { items: StatItem[] }) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();

  return (
    <Box
      ref={ref}
      component="section"
      aria-label="Journal statistics"
      sx={{
        bgcolor: "primary.main",
        color: "common.white",
        py: { xs: 4, md: 5 },
        borderBottom: "3px solid",
        borderColor: "secondary.main",
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: `repeat(${Math.min(items.length, 3)}, minmax(0, 1fr))`,
              md: `repeat(${items.length}, minmax(0, 1fr))`,
            },
            gap: { xs: 3, md: 2 },
          }}
        >
          {items.map((item, i) => {
            const Icon = item.icon ? ICONS[item.icon] : null;
            const lastOdd = items.length % 2 === 1 && i === items.length - 1;
            return (
              <Box
                key={item.label}
                sx={{
                  textAlign: "center",
                  minWidth: 0,
                  gridColumn: { xs: lastOdd ? "1 / -1" : undefined, sm: "auto" },
                }}
              >
                {Icon && <Icon sx={{ color: "secondary.light", fontSize: 28, mb: 0.5 }} />}
                <Typography
                  component="p"
                  sx={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: 700,
                    fontSize: { xs: "2rem", md: "2.6rem" },
                    lineHeight: 1.1,
                    color: "secondary.light",
                    fontVariantNumeric: "tabular-nums",
                  }}
                  aria-label={`${item.value.toLocaleString("en-IN")}${item.suffix ?? ""} ${item.label}`}
                >
                  <Counter value={item.value} start={inView} suffix={item.suffix} />
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ opacity: 0.88, mt: 0.5, textTransform: "uppercase", letterSpacing: 0.6, fontSize: "0.78rem" }}
                >
                  {item.label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
