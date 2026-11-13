import type { SubmissionAuthor } from "@ijaac/shared";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MuiLink from "@mui/material/Link";
import Tooltip from "@mui/material/Tooltip";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import Link from "next/link";

function isCorresponding(a: SubmissionAuthor, correspondingEmail?: string) {
  if (a.isCorresponding) return true;
  return !!correspondingEmail && a.email?.toLowerCase() === correspondingEmail.toLowerCase();
}

const nameSx = { color: "primary.main", fontWeight: 600 } as const;

/**
 * Author names in crimson/600 with the corresponding author marked by an
 * envelope icon.
 * - variant "inline": one line with ellipsis (cards)
 * - variant "full": one row per author with affiliation in secondary text;
 *   pass `credentialPaperId` to add "Verify credential" links
 *   (/credentials/author/<paperId>-<index+1>).
 */
export default function AuthorNames({
  authors,
  correspondingEmail,
  variant = "inline",
  credentialPaperId,
}: {
  authors: SubmissionAuthor[];
  correspondingEmail?: string;
  variant?: "inline" | "full";
  credentialPaperId?: string;
}) {
  const list = authors ?? [];
  if (list.length === 0) return null;

  if (variant === "inline") {
    return (
      <Typography
        variant="body2"
        component="p"
        title={list.map((a) => a.name).join(", ")}
        sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}
      >
        {list.map((a, i) => (
          <Box component="span" key={`${a.email}-${i}`}>
            <Box component="span" sx={nameSx}>
              {a.name}
            </Box>
            {isCorresponding(a, correspondingEmail) && (
              <MailOutlineIcon
                aria-label="Corresponding author"
                sx={{ fontSize: "0.95em", color: "primary.main", ml: 0.35, verticalAlign: "-0.12em" }}
              />
            )}
            {i < list.length - 1 && (
              <Box component="span" sx={{ color: "text.secondary" }}>
                ,{" "}
              </Box>
            )}
          </Box>
        ))}
      </Typography>
    );
  }

  return (
    <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gap: 1.25 }}>
      {list.map((a, i) => (
        <Box component="li" key={`${a.email}-${i}`} sx={{ minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: 1, rowGap: 0.25 }}>
            <Typography component="span" variant="subtitle1" sx={{ ...nameSx, lineHeight: 1.4 }}>
              {a.name}
            </Typography>
            {isCorresponding(a, correspondingEmail) && (
              <Tooltip title="Corresponding author">
                <MailOutlineIcon
                  aria-label="Corresponding author"
                  fontSize="small"
                  sx={{ color: "primary.main" }}
                />
              </Tooltip>
            )}
            {credentialPaperId && (
              <MuiLink
                component={Link}
                href={`/credentials/author/${credentialPaperId}-${i + 1}`}
                variant="caption"
                underline="hover"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.4,
                  color: "secondary.dark",
                  fontWeight: 600,
                }}
              >
                <VerifiedOutlinedIcon sx={{ fontSize: 14 }} />
                Verify credential
              </MuiLink>
            )}
          </Box>
          {a.affiliation && (
            <Typography variant="body2" color="text.secondary">
              {a.affiliation}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}
