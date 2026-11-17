import Link from "next/link";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import type { EditorialBoardMember } from "@ijaac/shared";
import { bioText } from "@/lib/text";

const clamp = (lines: number) =>
  ({
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    wordBreak: "break-word",
  }) as const;

export const ROLE_TITLES: Record<string, string> = {
  EDITOR_IN_CHIEF: "Editor-in-Chief",
  ASSOCIATE_EDITOR: "Associate Editor",
  MEMBER: "Board Member",
  ADVISORY_BOARD: "Advisory Board",
};

/** "Professor & Head, Department of Advanced Computing" - the institution is shown separately. */
function positionText(m: EditorialBoardMember): string {
  const parts = [m.designation, m.department].map((p) => bioText(p)).filter(Boolean);
  return parts.join(", ");
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "20px minmax(0, 1fr)", columnGap: 1.25, alignItems: "start" }}>
      <Box aria-hidden sx={{ color: "primary.main", display: "flex", pt: "2px", "& svg": { fontSize: 18 } }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          component="span"
          sx={{
            display: "block",
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: "text.secondary",
            lineHeight: 1.4,
          }}
        >
          {label}
        </Typography>
        {children}
      </Box>
    </Box>
  );
}

export default function BoardMemberCard({
  member: m,
  featured = false,
}: {
  member: EditorialBoardMember;
  /** Wide layout used for the Editor-in-Chief. */
  featured?: boolean;
}) {
  const name = bioText(m.name) || m.name;
  const institution = bioText(m.affiliation);
  const position = positionText(m);
  const qualification = bioText(m.qualification);
  const awardedBy = bioText(m.qualificationInstitution);
  const specialization = bioText(m.specialization);
  const href = `/editorial-board/${encodeURIComponent(m.id)}`;
  const avatar = featured ? { xs: 84, md: 112 } : 72;

  const details = (
    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: featured ? { xs: "1fr", md: "1fr 1fr" } : "1fr" }}>
      {position && (
        <InfoRow icon={<WorkOutlineIcon />} label="Position">
          <Typography variant="body2" sx={{ lineHeight: 1.5, ...clamp(3) }} title={position}>
            {position}
          </Typography>
        </InfoRow>
      )}
      {qualification && (
        <InfoRow icon={<SchoolOutlinedIcon />} label="Qualification">
          <Typography variant="body2" sx={{ lineHeight: 1.5, fontWeight: 600, ...clamp(2) }} title={qualification}>
            {qualification}
          </Typography>
          {awardedBy && (
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45, ...clamp(2) }} title={awardedBy}>
              {awardedBy}
            </Typography>
          )}
        </InfoRow>
      )}
      {specialization && (
        <InfoRow icon={<ScienceOutlinedIcon />} label="Specialization">
          <Typography variant="body2" sx={{ lineHeight: 1.5, ...clamp(2) }} title={specialization}>
            {specialization}
          </Typography>
        </InfoRow>
      )}
    </Box>
  );

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        borderRadius: 2,
        borderTop: "3px solid",
        borderTopColor: featured ? "secondary.main" : "primary.main",
        transition: "box-shadow 0.2s, transform 0.2s",
        "@media (hover: hover)": {
          "&:hover": { boxShadow: 6, transform: "translateY(-3px)" },
          "&:hover .board-card-name": { color: "primary.main" },
        },
        "&:focus-within": { outline: "2px solid", outlineColor: "secondary.main", outlineOffset: 2 },
      }}
    >
      <Box
        sx={{
          p: { xs: 2.5, md: featured ? 3.5 : 2.5 },
          flexGrow: 1,
          display: "flex",
          flexDirection: featured ? { xs: "column", md: "row" } : "column",
          gap: featured ? { xs: 2.5, md: 4 } : 2,
          minWidth: 0,
        }}
      >
        {/* Identity */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            minWidth: 0,
            ...(featured && { flex: { md: "0 0 34%" }, alignSelf: { md: "center" } }),
          }}
        >
          <Avatar
            src={m.photoUrl}
            alt={name}
            sx={{
              width: avatar,
              height: avatar,
              flexShrink: 0,
              border: "3px solid",
              borderColor: "background.paper",
              boxShadow: "0 0 0 2px rgba(122,31,43,0.25)",
            }}
          />
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography
              sx={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: "secondary.dark",
                mb: 0.25,
              }}
            >
              {ROLE_TITLES[m.role] ?? "Board Member"}
            </Typography>
            <Typography
              component="h3"
              className="board-card-name"
              sx={{
                fontWeight: 700,
                fontSize: featured ? { xs: "1.15rem", md: "1.35rem" } : "1.05rem",
                lineHeight: 1.3,
                transition: "color 0.15s",
                ...clamp(2),
              }}
              title={name}
            >
              {/* Stretched link: whole card is clickable, LinkedIn stays separate. */}
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
            </Typography>
            {institution && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.4, ...clamp(2) }} title={institution}>
                {institution}
              </Typography>
            )}
          </Box>
          {m.linkedinUrl && (
            <IconButton
              href={m.linkedinUrl}
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

        {featured ? (
          <>
            <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" } }} />
            <Divider sx={{ display: { xs: "block", md: "none" } }} />
            <Box sx={{ flexGrow: 1, minWidth: 0, alignSelf: { xs: "stretch", md: "center" } }}>{details}</Box>
          </>
        ) : (
          (position || qualification || specialization) && (
            <>
              <Divider />
              {details}
            </>
          )
        )}
      </Box>

      <Box
        sx={{
          px: { xs: 2.5, md: featured ? 3.5 : 2.5 },
          py: 1.25,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "rgba(122,31,43,0.03)",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Typography
          component="span"
          aria-hidden
          sx={{ color: "primary.main", fontWeight: 600, fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: 0.5 }}
        >
          See Detailed Profile <ArrowForwardIcon sx={{ fontSize: 15 }} />
        </Typography>
      </Box>
    </Card>
  );
}
