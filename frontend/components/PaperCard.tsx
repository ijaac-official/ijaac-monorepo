import type { Submission } from "@ijaac/shared";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import AuthorNames from "@/components/AuthorNames";
import KeywordChips from "@/components/KeywordChips";
import { JUSTIFIED_SX, bioText } from "@/lib/text";

export const clampLines = (lines: number) =>
  ({
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    wordBreak: "break-word",
  }) as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Publication card. Title clamps to 2 lines, authors to 1 line, abstract to 3.
 * - "grid": fills its cell (height 100%), title space reserved so rows align
 * - "list": full-width row for the publications listing
 */
export default function PaperCard({
  paper,
  variant = "grid",
  showAbstract = true,
  maxKeywords = 3,
}: {
  paper: Submission;
  variant?: "grid" | "list";
  showAbstract?: boolean;
  maxKeywords?: number;
}) {
  const grid = variant === "grid";
  const issueLabel =
    paper.volume && paper.issueNumber ? `Vol. ${paper.volume}, Issue ${paper.issueNumber}` : null;

  return (
    <Paper
      component={Link}
      href={`/publications/${paper.id}`}
      variant="outlined"
      sx={{
        p: grid ? 2.5 : 3,
        height: grid ? "100%" : undefined,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        minWidth: 0,
        textDecoration: "none",
        color: "inherit",
        borderTop: "3px solid",
        borderTopColor: "primary.main",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
        "@media (hover: hover)": {
          "&:hover": { transform: "translateY(-2px)", boxShadow: 3, borderTopColor: "secondary.main" },
        },
        "&:hover .paper-card-title, &:focus-visible .paper-card-title": { color: "primary.main" },
        "&:focus-visible": { outline: "2px solid", outlineColor: "secondary.main", outlineOffset: 2 },
      }}
    >
      <Typography
        variant={grid ? "subtitle1" : "h6"}
        component="h3"
        className="paper-card-title"
        fontWeight={600}
        title={paper.title}
        sx={{
          transition: "color 0.15s ease",
          ...clampLines(2),
          lineHeight: 1.35,
          minHeight: grid ? "2.7em" : undefined,
        }}
      >
        {paper.title}
      </Typography>

      <AuthorNames authors={paper.authors} correspondingEmail={paper.correspondingEmail} />

      {showAbstract && paper.abstract && (
        <Typography
          variant="body2"
          color="text.secondary"
          lang="en"
          sx={{ ...clampLines(3), ...JUSTIFIED_SX, lineHeight: 1.55, minHeight: grid ? "4.65em" : undefined }}
        >
          {bioText(paper.abstract)}
        </Typography>
      )}

      <Box sx={{ mt: "auto", pt: 0.5, display: "grid", gap: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          Published {formatDate(paper.publishedAt ?? paper.submittedAt)}
          {issueLabel ? ` - ${issueLabel}` : ""}
          {paper.articleNumber ? ` - Article ${paper.articleNumber}` : ""}
        </Typography>
        <KeywordChips keywords={paper.keywords} max={maxKeywords} nowrap={grid} />
      </Box>
    </Paper>
  );
}
