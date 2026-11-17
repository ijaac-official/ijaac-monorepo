import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import VerifiedIcon from "@mui/icons-material/Verified";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import { isApprovedReviewer } from "@ijaac/shared";
import type { EditorialBoardMember, Reviewer } from "@ijaac/shared";
import { countCompletedReviews, getEditorialBoardMember, listReviewers } from "@ijaac/data-store";
import ReviewerStatTile from "@/components/reviewers/ReviewerStatTile";
import JsonLd from "@/components/JsonLd";
import { JUSTIFIED_SX, bioParagraphs, bioText } from "@/lib/text";
import { ORGANIZATION_ID, absoluteUrl, breadcrumbJsonLd, clip, pageMetadata } from "@/lib/seo";

export const revalidate = 0;

const ROLE_LABELS: Record<string, string> = {
  EDITOR_IN_CHIEF: "Editor-in-Chief",
  ASSOCIATE_EDITOR: "Associate Editor",
  MEMBER: "Editorial Board Member",
  ADVISORY_BOARD: "Advisory Board Member",
};

const getPublicMember = cache(async (id: string): Promise<EditorialBoardMember | null> => {
  const m = await getEditorialBoardMember(id).catch(() => null);
  return m && m.isActive ? m : null;
});

/** The member's reviewer profile, if they are also an approved, active reviewer. */
async function linkedReviewer(m: EditorialBoardMember): Promise<Reviewer | null> {
  const reviewers = await listReviewers().catch(() => []);
  const email = m.email?.toLowerCase();
  return (
    reviewers.find(
      (r) =>
        r.isActive &&
        isApprovedReviewer(r) &&
        (r.sourceBoardMemberId === m.id || (!!email && r.email?.toLowerCase() === email))
    ) ?? null
  );
}

const hasRealPhoto = (url?: string) => !!url && !url.includes("placehold.co");

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const m = await getPublicMember(params.id);
  if (!m) return { title: "Editor not found", robots: { index: false } };
  const role = ROLE_LABELS[m.role] ?? "Editorial Board";
  const where = [m.designation, m.affiliation].filter(Boolean).join(", ");
  const meta = pageMetadata({
    title: `${m.name} - ${role}`,
    description: clip(
      `${m.name}${where ? `, ${where}` : ""}, serves as ${role} of the International Journal of Applied AI & Computing (IJAAC).`
    ),
    path: `/editorial-board/${encodeURIComponent(m.id)}`,
    ogType: "profile",
  });
  return hasRealPhoto(m.photoUrl)
    ? { ...meta, openGraph: { ...meta.openGraph, images: [{ url: m.photoUrl, alt: m.name }] } }
    : meta;
}

function personJsonLd(m: EditorialBoardMember, role: string) {
  const url = absoluteUrl(`/editorial-board/${encodeURIComponent(m.id)}`);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${url}#person`,
    name: m.name,
    url,
    ...(hasRealPhoto(m.photoUrl) ? { image: m.photoUrl } : {}),
    jobTitle: m.designation || role,
    ...(m.affiliation
      ? { affiliation: { "@type": "Organization", name: [m.department, m.affiliation].filter(Boolean).join(", ") } }
      : {}),
    ...(m.qualification
      ? {
          hasCredential: {
            "@type": "EducationalOccupationalCredential",
            name: m.qualification,
            ...(m.qualificationInstitution ? { recognizedBy: { "@type": "CollegeOrUniversity", name: m.qualificationInstitution } } : {}),
          },
        }
      : {}),
    ...(m.specialization ? { knowsAbout: [m.specialization] } : {}),
    ...(m.address ? { workLocation: { "@type": "Place", address: m.address } } : {}),
    ...(m.bio ? { description: clip(m.bio, 300) } : {}),
    ...(m.linkedinUrl ? { sameAs: [m.linkedinUrl] } : {}),
    memberOf: { "@id": ORGANIZATION_ID },
  };
}

export default async function EditorProfilePage({ params }: { params: { id: string } }) {
  const member = await getPublicMember(params.id);
  if (!member) notFound();

  const role = ROLE_LABELS[member.role] ?? "Editorial Board";
  const reviewer = await linkedReviewer(member);
  const reviews = reviewer ? (await countCompletedReviews().catch(() => ({} as Record<string, number>)))[reviewer.id] ?? 0 : 0;
  const since = new Date(member.createdAt).getFullYear();
  const location = bioText([member.affiliation, member.country].filter(Boolean).join(", "));
  const path = `/editorial-board/${encodeURIComponent(member.id)}`;

  return (
    <>
      <JsonLd
        data={[
          personJsonLd(member, role),
          breadcrumbJsonLd([
            { name: "Editorial Board", path: "/editorial-board" },
            { name: member.name, path },
          ]),
        ]}
      />
      <Box
        sx={{
          background: "linear-gradient(115deg, #551319 0%, #7a1f2b 60%, #9c3347 100%)",
          color: "white",
          pt: { xs: 4, md: 6 },
          pb: { xs: 10, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <Button
            component={Link}
            href="/editorial-board"
            startIcon={<ArrowBackIcon />}
            sx={{ color: "rgba(255,255,255,0.85)", mb: 3, px: 0, "&:hover": { boxShadow: "none" } }}
          >
            Editorial Board
          </Button>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 2.5, sm: 4 }} alignItems={{ sm: "center" }}>
            <Avatar
              src={member.photoUrl}
              alt={member.name}
              sx={{
                width: { xs: 112, md: 148 },
                height: { xs: 112, md: 148 },
                border: "4px solid",
                borderColor: "secondary.main",
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Chip
                icon={<VerifiedIcon sx={{ color: "inherit !important" }} />}
                label={role}
                sx={{ bgcolor: "secondary.main", color: "secondary.contrastText", mb: 1.5, maxWidth: "100%" }}
              />
              <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 30, md: 42 }, overflowWrap: "anywhere" }}>
                {bioText(member.name) || member.name}
              </Typography>
              {member.designation && (
                <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.92 }}>
                  {member.designation}
                </Typography>
              )}
              {location && (
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 1, opacity: 0.85 }}>
                  <PlaceOutlinedIcon fontSize="small" />
                  <Typography variant="body2">{location}</Typography>
                </Stack>
              )}
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: { xs: -7, md: -8 }, pb: 8, position: "relative" }}>
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={reviewer ? 4 : 6}>
            <ReviewerStatTile icon={<WorkspacePremiumOutlinedIcon />} value={role} label="Role at IJAAC" />
          </Grid>
          <Grid item xs={12} sm={reviewer ? 4 : 6}>
            <ReviewerStatTile icon={<EventAvailableOutlinedIcon />} value={since} label="On the board since" accent="secondary" />
          </Grid>
          {reviewer && (
            <Grid item xs={12} sm={4}>
              <ReviewerStatTile icon={<FactCheckOutlinedIcon />} value={reviews} label="Reviews completed" />
            </Grid>
          )}
        </Grid>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8} sx={{ minWidth: 0 }}>
            {(() => {
              const rows = [
                { label: "Name", value: member.name },
                { label: "Designation", value: member.designation },
                { label: "Department", value: member.department },
                { label: "Affiliation", value: [member.affiliation, member.country].filter(Boolean).join(", ") },
                { label: "Qualification", value: member.qualification },
                { label: "Awarded by", value: member.qualificationInstitution },
                { label: "Specialization", value: member.specialization },
                { label: "Address", value: member.address },
              ]
                .map((r) => ({ ...r, value: bioText(r.value) }))
                .filter((r) => r.value);
              return (
                <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3, md: 4 }, mb: 3 }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Profile Details
                  </Typography>
                  <Box
                    component="dl"
                    sx={{
                      m: 0,
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "160px minmax(0, 1fr)" },
                      columnGap: 3,
                      rowGap: { xs: 0.25, sm: 1.5 },
                    }}
                  >
                    {rows.map((r) => (
                      <Box key={r.label} sx={{ display: "contents" }}>
                        <Typography
                          component="dt"
                          variant="body2"
                          sx={{ color: "primary.main", fontWeight: 700, mt: { xs: 1.25, sm: 0 } }}
                        >
                          {r.label}
                        </Typography>
                        <Typography component="dd" variant="body1" sx={{ m: 0, overflowWrap: "anywhere", lineHeight: 1.6 }}>
                          {r.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              );
            })()}
            <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Biography
              </Typography>
              {(() => {
                const paragraphs = bioParagraphs(member.bio);
                const text = paragraphs.length
                  ? paragraphs
                  : [
                      `${member.name} serves as ${role} of the International Journal of Applied AI & Computing, helping uphold the journal's editorial and peer-review standards.`,
                    ];
                return (
                  <Box lang="en" sx={{ px: { xs: 0, md: 1.5 }, py: 0.5 }}>
                    {text.map((para, i) => (
                      <Typography
                        key={i}
                        variant="body1"
                        color={paragraphs.length ? "text.primary" : "text.secondary"}
                        sx={{ ...JUSTIFIED_SX, lineHeight: 1.7, mb: i < text.length - 1 ? 2 : 0 }}
                      >
                        {para}
                      </Typography>
                    ))}
                  </Box>
                );
              })()}
            </Paper>
          </Grid>
          <Grid item xs={12} md={4} sx={{ minWidth: 0 }}>
            {(member.linkedinUrl || member.email) && (
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Contact &amp; Profiles
                </Typography>
                <Stack spacing={1.5}>
                  {member.linkedinUrl && (
                    <Button
                      href={member.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outlined"
                      startIcon={<LinkedInIcon sx={{ color: "#0a66c2" }} />}
                      sx={{ justifyContent: "flex-start" }}
                    >
                      LinkedIn
                    </Button>
                  )}
                  {member.email && (
                    <Button
                      href={`mailto:${member.email}`}
                      variant="outlined"
                      startIcon={<MailOutlineIcon />}
                      sx={{ justifyContent: "flex-start", textTransform: "none", overflowWrap: "anywhere" }}
                    >
                      {member.email}
                    </Button>
                  )}
                </Stack>
              </Paper>
            )}
            {reviewer && (
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Also an IJAAC Reviewer
                </Typography>
                <Button
                  component={Link}
                  href={`/reviewers/${encodeURIComponent(reviewer.id)}`}
                  endIcon={<ArrowForwardIcon />}
                  sx={{ px: 0 }}
                >
                  View reviewer profile
                </Button>
              </Paper>
            )}
            <Paper variant="outlined" sx={{ p: 3, borderTop: "3px solid", borderTopColor: "secondary.main" }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Publish with IJAAC
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ...JUSTIFIED_SX, mb: 2 }}>
                Submit your research in applied AI and computing for peer review by our editorial board.
              </Typography>
              <Button component={Link} href="/submit-paper" variant="contained" fullWidth>
                Submit a Paper
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
