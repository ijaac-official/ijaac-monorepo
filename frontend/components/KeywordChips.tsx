import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Link from "next/link";

/**
 * Rounded, outlined keyword tags in the journal crimson.
 * Set `linked` only where the chips are NOT already inside another link
 * (e.g. the publication detail page) - each chip then searches publications.
 */
export default function KeywordChips({
  keywords,
  max,
  linked = false,
  size = "small",
  nowrap = false,
}: {
  keywords: string[];
  max?: number;
  linked?: boolean;
  size?: "small" | "medium";
  /** Keep chips on one line, clipping the overflow (for fixed-height cards). */
  nowrap?: boolean;
}) {
  const list = (keywords ?? []).map((k) => k.trim()).filter(Boolean);
  if (list.length === 0) return null;
  const shown = typeof max === "number" ? list.slice(0, max) : list;
  const hidden = list.length - shown.length;

  const chipSx = {
    borderRadius: 999,
    borderColor: "primary.main",
    color: "primary.main",
    bgcolor: "transparent",
    fontWeight: 500,
    maxWidth: "100%",
    transition: "background-color 0.15s ease, border-color 0.15s ease",
    "&:hover": { bgcolor: "rgba(122, 31, 43, 0.06)", borderColor: "primary.dark" },
    "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" },
  } as const;

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: nowrap ? "nowrap" : "wrap",
        overflow: nowrap ? "hidden" : undefined,
        gap: 0.75,
        minWidth: 0,
      }}
    >
      {shown.map((kw) =>
        linked ? (
          <Chip
            key={kw}
            label={kw}
            size={size}
            variant="outlined"
            clickable
            component={Link}
            href={`/publications?q=${encodeURIComponent(kw)}`}
            sx={{ ...chipSx, flexShrink: nowrap ? 0 : undefined }}
          />
        ) : (
          <Chip
            key={kw}
            label={kw}
            size={size}
            variant="outlined"
            sx={{ ...chipSx, flexShrink: nowrap ? 0 : undefined }}
          />
        )
      )}
      {hidden > 0 && (
        <Chip
          label={`+${hidden}`}
          size={size}
          variant="outlined"
          sx={{ ...chipSx, flexShrink: 0, color: "text.secondary", borderColor: "divider" }}
        />
      )}
    </Box>
  );
}
