import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import RuleOutlinedIcon from "@mui/icons-material/RuleOutlined";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

/**
 * Page banner. Uses a designed on-brand background (gradient + circuit-like
 * dot grid + a large outline icon that matches the page) instead of stock
 * photos, so the banner always fits the content in front of it.
 */
const ICONS = {
  issue: AutoStoriesOutlinedIcon,
  contact: MailOutlineIcon,
  reviewers: FactCheckOutlinedIcon,
  publications: ArticleOutlinedIcon,
  archives: Inventory2OutlinedIcon,
  about: SchoolOutlinedIcon,
  books: MenuBookOutlinedIcon,
  review: RateReviewOutlinedIcon,
  submit: UploadFileOutlinedIcon,
  guidelines: RuleOutlinedIcon,
  board: Groups2OutlinedIcon,
  policy: GavelOutlinedIcon,
  verified: VerifiedOutlinedIcon,
  person: PersonOutlineIcon,
} as const;

export type PageHeroIcon = keyof typeof ICONS;

export default function PageHero({
  title,
  subtitle,
  icon = "publications",
}: {
  title: string;
  subtitle?: string;
  icon?: PageHeroIcon;
}) {
  const Icon = ICONS[icon];
  return (
    <Box
      sx={{
        position: "relative",
        color: "white",
        py: { xs: 6, md: 9 },
        overflow: "hidden",
        background: "linear-gradient(120deg, #4a1017 0%, #7a1f2b 55%, #8f2a37 100%)",
      }}
    >
      {/* dot grid */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          opacity: 0.18,
          backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1.2px)",
          backgroundSize: "22px 22px",
          maskImage: "linear-gradient(90deg, transparent 0%, black 45%, black 100%)",
          WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 45%, black 100%)",
        }}
      />
      {/* gold accent line */}
      <Box aria-hidden sx={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 4, bgcolor: "secondary.main" }} />
      {/* page icon */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          right: { xs: -30, md: "6%" },
          top: "50%",
          transform: "translateY(-50%)",
          color: "rgba(255,255,255,0.12)",
          display: "flex",
        }}
      >
        <Icon sx={{ fontSize: { xs: 160, md: 240 } }} />
      </Box>
      <Container maxWidth="lg" sx={{ position: "relative" }}>
        <Typography variant="h3" component="h1" fontWeight={700} gutterBottom sx={{ fontSize: { xs: "2rem", md: "3rem" }, maxWidth: 900 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 760, fontWeight: 400 }}>
            {subtitle}
          </Typography>
        )}
      </Container>
    </Box>
  );
}
