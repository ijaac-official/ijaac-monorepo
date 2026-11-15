import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { JUSTIFIED_SX, bioText } from "@/lib/text";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "next/link";

const clamp = (lines: number) =>
  ({
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    wordBreak: "break-word",
  }) as const;

export default function PersonCard({
  name,
  designation,
  affiliation,
  country,
  photoUrl,
  bio,
  tags,
  linkedinUrl,
  href,
  stat,
  linkLabel = "View profile",
}: {
  name: string;
  designation?: string;
  affiliation?: string;
  country?: string;
  photoUrl: string;
  bio?: string;
  tags?: string[];
  linkedinUrl?: string;
  /** If set, the card links to this (e.g. a public profile page) */
  href?: string;
  /** Optional small highlighted stat, e.g. "12 reviews" */
  stat?: string;
  /** Text of the profile link shown when `href` is set (default "View profile") */
  linkLabel?: string;
}) {
  const place = [affiliation, country].filter(Boolean).join(", ");
  const shownTags = (tags ?? []).slice(0, 4);
  const extraTags = (tags?.length ?? 0) - shownTags.length;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        transition: "transform 0.2s, box-shadow 0.2s",
        "@media (hover: hover)": {
          "&:hover": { transform: "translateY(-4px)", boxShadow: 4 },
        },
        ...(href && {
          cursor: "pointer",
          "&:hover .person-card-name, &:focus-within .person-card-name": { color: "primary.main" },
          "&:focus-within": { outline: "2px solid", outlineColor: "secondary.main", outlineOffset: 2 },
        }),
      }}
      elevation={1}
    >
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
          <Avatar src={photoUrl} alt={name} sx={{ width: 64, height: 64, flexShrink: 0 }} />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              component="h3"
              className="person-card-name"
              fontWeight={600}
              title={name}
              sx={{ ...clamp(2), lineHeight: 1.3, transition: "color 0.15s ease" }}
            >
              {href ? (
                // Stretched link: the ::after overlay makes the whole card
                // clickable without nesting the LinkedIn anchor inside it.
                <Box
                  component={Link}
                  href={href}
                  sx={{
                    color: "inherit",
                    textDecoration: "none",
                    outline: "none",
                    "&::after": { content: '""', position: "absolute", inset: 0, zIndex: 1 },
                  }}
                >
                  {name}
                </Box>
              ) : (
                name
              )}
            </Typography>
            {designation && (
              <Typography variant="body2" color="text.secondary" sx={{ ...clamp(2), lineHeight: 1.4 }}>
                {designation}
              </Typography>
            )}
          </Box>
          {linkedinUrl && (
            <IconButton
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              aria-label={`${name} on LinkedIn`}
              sx={{ color: "#0a66c2", position: "relative", zIndex: 2, flexShrink: 0, alignSelf: "flex-start" }}
            >
              <LinkedInIcon />
            </IconButton>
          )}
        </Box>

        {place && (
          <Typography variant="body2" color="text.secondary" title={place} sx={clamp(2)}>
            {place}
          </Typography>
        )}

        {bio && (
          <Typography
            variant="body2"
            lang="en"
            sx={{ ...clamp(4), ...JUSTIFIED_SX, lineHeight: 1.55 }}
          >
            {bioText(bio)}
          </Typography>
        )}

        {(shownTags.length > 0 || stat || href) && (
          <Box sx={{ mt: "auto", pt: 1, display: "grid", gap: 1.25 }}>
            {shownTags.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, maxHeight: 56, overflow: "hidden" }}>
                {shownTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderRadius: 999,
                      borderColor: "primary.main",
                      color: "primary.main",
                      fontWeight: 500,
                      maxWidth: "100%",
                    }}
                  />
                ))}
                {extraTags > 0 && (
                  <Chip label={`+${extraTags}`} size="small" variant="outlined" sx={{ borderRadius: 999 }} />
                )}
              </Box>
            )}
            {(stat || href) && (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                {stat ? (
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      px: 1,
                      py: 0.25,
                      border: "1px solid",
                      borderColor: "secondary.main",
                      bgcolor: "rgba(212, 160, 23, 0.1)",
                      color: "secondary.dark",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      letterSpacing: 0.3,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {stat}
                  </Box>
                ) : (
                  <span />
                )}
                {href && (
                  <Typography
                    component="span"
                    variant="caption"
                    aria-hidden
                    sx={{ color: "primary.main", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 0.5 }}
                  >
                    {linkLabel} <ArrowForwardIcon sx={{ fontSize: 14 }} />
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
