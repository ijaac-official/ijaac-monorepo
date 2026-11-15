import Box from "@mui/material/Box";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { JUSTIFIED_SX, bioParagraphs } from "@/lib/text";

type ProseTextProps = {
  /** Free text (blank lines split paragraphs) or a list of paragraphs. */
  text?: string | string[] | null;
  variant?: "body1" | "body2";
  color?: TypographyProps["color"];
  /** Extra styles for the wrapper Box. */
  sx?: SxProps<Theme>;
  /** Tighter padding and paragraph gaps, for use inside cards and accordions. */
  dense?: boolean;
};

/**
 * Normalised, evenly spaced paragraphs (standard left-aligned setting) with comfortable padding.
 * Mirrors the bio treatment on the editorial board profile page.
 */
export default function ProseText({
  text,
  variant = "body1",
  color = "text.primary",
  sx,
  dense = false,
}: ProseTextProps) {
  const paragraphs = (Array.isArray(text) ? text : [text ?? ""]).flatMap((t) =>
    bioParagraphs(t)
  );
  if (!paragraphs.length) return null;
  const lineHeight = variant === "body1" ? 1.7 : 1.65;
  const gap = dense ? 1.25 : 2;
  return (
    <Box
      lang="en"
      sx={[
        { px: dense ? { xs: 0, sm: 0.5 } : { xs: 0, md: 1.5 }, py: dense ? 0 : 0.5, minWidth: 0 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {paragraphs.map((para, i) => (
        <Typography
          key={i}
          variant={variant}
          color={color}
          sx={{ ...JUSTIFIED_SX, lineHeight, mb: i < paragraphs.length - 1 ? gap : 0 }}
        >
          {para}
        </Typography>
      ))}
    </Box>
  );
}
