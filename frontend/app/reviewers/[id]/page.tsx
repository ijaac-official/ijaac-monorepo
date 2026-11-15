import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
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
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { isApprovedReviewer } from "@ijaac/shared";
import type { Reviewer } from "@ijaac/shared";
import { getReviewer, listAllSubmissionsRaw } from "@ijaac/data-store";
import ReviewerStatTile from "@/components/reviewers/ReviewerStatTile";
import JsonLd from "@/components/JsonLd";
import { JUSTIFIED_SX, bioParagraphs, bioText } from "@/lib/text";
import { ORGANIZATION_ID, absoluteUrl, breadcrumbJsonLd, clip, pageMetadata } from "@/lib/seo";
import { cache } from "react";

export const revalidate = 0;

const getPublicReviewer = cache(async (id: string): Promise<Reviewer | null> => {
  const r = await getReviewer(id).catch(() => null);
  if (!r || !r.isActive || !isApprovedReviewer(r)) return null;
  return r;
});

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const r = await getPublicReviewer(params.id);
  if (!r) return { title: "Reviewer not found", robots: { index: false } };
  const role = [r.designation, r.affiliation].filter(Boolean).join(", ");
  const description = clip(
    `${r.name}${role ? `, ${role}` : ""} is a verified reviewer for the International Journal of Applied AI & Computing (IJAAC)${
      r.areasOfInterest.length ? `, with expertise in ${r.areasOfInterest.slice(0, 5).join(", ")}` : ""
    }.`
  );
  const meta = pageMetadata({
    title: `${r.name} - Reviewer Profile`,
    description,
    path: `/reviewers/${encodeURIComponent(r.id)}`,
    ogType: "profile",
  });
  return r.photoUrl && !r.photoUrl.includes("placehold.co")
    ? { ...meta, openGraph: { ...meta.openGraph, images: [{ url: r.photoUrl, alt: r.name }] } }
    : meta;
}

function personJsonLd(r: Reviewer) {
  const url = absoluteUrl(`/reviewers/${encodeURIComponent(r.id)}`);
  const sameAs = [r.linkedinUrl, r.orcid ? orcidHref(r.orcid) : undefined].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${url}#person`,
    name: r.name,
    url,
    ...(r.photoUrl && !r.photoUrl.includes("placehold.co") ? { image: r.photoUrl } : {}),
    ...(r.designation ? { jobTitle: r.designation } : {}),
    ...(r.affiliation ? { affiliation: { "@type": "Organization", name: r.affiliation } } : {}),
    ...(r.areasOfInterest.length ? { knowsAbout: r.areasOfInterest } : {}),
    ...(r.bio ? { description: clip(r.bio, 300) } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    memberOf: { "@id": ORGANIZATION_ID },
  };
}

function orcidHref(orcid: string): string {
  return /^https?:\/\//i.test(orcid) ? orcid : `https://orcid.org/${orcid}`;
}

function orcidLabel(orcid: string): string {
  return orcid.replace(/^https?:\/\/orcid\.org\//i, "");
}

export default async function ReviewerProfilePage({ params }: { params: { id: string } }) {
  const reviewer = await getPublicReviewer(params.id);
  if (!reviewer) notFound();

  // Only counts are exposed - which papers someone reviewed stays confidential.
  const submissions = await listAllSubmissionsRaw().catch(() => []);
  let completed = 0;
  let active = 0;
  for (const s of submissions) {
    for (const a of s.reviewAssignments ?? []) {
      if (a.reviewerId !== reviewer.id) continue;
      if (a.status === "COMPLETED") completed++;
      else if (a.status === "ASSIGNED") active++;
    }
  }
  const since = new Date(reviewer.approvedAt ?? reviewer.createdAt).getFullYear();
  const location = bioText([reviewer.affiliation, reviewer.country].filter(Boolean).join(", "));

  return (
    <>
      <JsonLd
        data={[
          personJsonLd(reviewer),
          breadcrumbJsonLd([
            { name: "Reviewers", path: "/reviewers" },
            { name: reviewer.name, path: `/reviewers/${encodeURIComponent(reviewer.id)}` },
          ]),
        ]}
      />
      <Box
        sx={{
          bgcolor: "primary.dark",
          background: "linear-gradient(115deg, #551319 0%, #7a1f2b 60%, #9c3347 100%)",
          color: "white",
          pt: { xs: 4, md: 6 },
          pb: { xs: 10, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <Button
            component={Link}
            href="/reviewers"
            startIcon={<ArrowBackIcon />}
            sx={{ color: "rgba(255,255,255,0.85)", mb: 3, px: 0, "&:hover": { boxShadow: "none" } }}
          >
            Reviewer Panel
          </Button>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 2.5, sm: 4 }} alignItems={{ sm: "center" }}>
            <Avatar
              src={reviewer.photoUrl}
              alt={reviewer.name}
              sx={{
                width: { xs: 112, md: 148 },
                height: { xs: 112, md: 148 },
                border: "4px solid",
                borderColor: "secondary.main",
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              }}
            />
            <Box>
              <Chip
                icon={<VerifiedIcon sx={{ color: "inherit !important" }} />}
                label="Verified IJAAC Reviewer"
                sx={{ bgcolor: "secondary.main", color: "secondary.contrastText", mb: 1.5 }}
              />
              <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 30, md: 42 } }}>
                {reviewer.name}
              </Typography>
              {reviewer.designation && (
                <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.92 }}>
                  {reviewer.designation}
                </Typography>
              )}
              <Stack direction="row" spacing={2} sx={{ mt: 1, flexWrap: "wrap", rowGap: 0.5, opacity: 0.85 }}>
                {location && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <PlaceOutlinedIcon fontSize="small" />
                    <Typography variant="body2">{location}</Typography>
                  </Stack>
                )}
                {reviewer.qualification && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <SchoolOutlinedIcon fontSize="small" />
                    <Typography variant="body2">{reviewer.qualification}</Typography>
                  </Stack>
                )}
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: { xs: -7, md: -8 }, pb: 8, position: "relative" }}>
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <ReviewerStatTile icon={<FactCheckOutlinedIcon />} value={completed} label="Reviews completed" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <ReviewerStatTile
              icon={<EventAvailableOutlinedIcon />}
              value={since}
              label="Reviewer since"
              accent="secondary"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <ReviewerStatTile icon={<PendingActionsOutlinedIcon />} value={active} label="Active assignments" />
          </Grid>
        </Grid>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3, md: 4 }, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                About
              </Typography>
              {(() => {
                const paragraphs = bioParagraphs(reviewer.bio);
                const text = paragraphs.length ? paragraphs : [`${reviewer.name} is a member of the IJAAC reviewer panel.`];
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
            {reviewer.areasOfInterest.length > 0 && (
              <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                <Typography variant="h5" gutterBottom>
                  Areas of expertise
                </Typography>
                <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mt: 1.5 }}>
                  {reviewer.areasOfInterest.map((a) => (
                    <Chip key={a} label={a} variant="outlined" color="primary" sx={{ borderRadius: 999 }} />
                  ))}
                </Stack>
              </Paper>
            )}
          </Grid>
          <Grid item xs={12} md={4}>
            {(reviewer.linkedinUrl || reviewer.orcid) && (
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Profiles
                </Typography>
                <Stack spacing={1.5}>
                  {reviewer.linkedinUrl && (
                    <Button
                      href={reviewer.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outlined"
                      startIcon={<LinkedInIcon sx={{ color: "#0a66c2" }} />}
                      sx={{ justifyContent: "flex-start" }}
                    >
                      LinkedIn
                    </Button>
                  )}
                  {reviewer.orcid && (
                    <Button
                      href={orcidHref(reviewer.orcid)}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outlined"
                      startIcon={
                        <Box
                          component="span"
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            bgcolor: "#a6ce39",
                            color: "white",
                            fontSize: 10,
                            fontWeight: 700,
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          iD
                        </Box>
                      }
                      sx={{ justifyContent: "flex-start", textTransform: "none" }}
                    >
                      ORCID {orcidLabel(reviewer.orcid)}
                    </Button>
                  )}
                </Stack>
              </Paper>
            )}
            <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: "background.default" }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <LockOutlinedIcon color="primary" fontSize="small" sx={{ mt: 0.25 }} />
                <Typography variant="body2" color="text.secondary" sx={JUSTIFIED_SX}>
                  IJAAC follows confidential peer review. Reviewer profiles show the number of completed reviews,
                  never which manuscripts were reviewed.
                </Typography>
              </Stack>
            </Paper>
            <Paper
              variant="outlined"
              sx={{ p: 3, borderTop: "3px solid", borderTopColor: "secondary.main" }}
            >
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Want a profile like this?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ...JUSTIFIED_SX, mb: 2 }}>
                Join the IJAAC reviewer panel and get recognised for every review.
              </Typography>
              <Button component={Link} href="/become-a-reviewer" variant="contained" fullWidth>
                Become a Reviewer
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
