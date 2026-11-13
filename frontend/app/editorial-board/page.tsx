import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { Suspense } from "react";
import CardGridSkeleton from "@/components/CardGridSkeleton";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { listEditorialBoard } from "@ijaac/data-store";
import type { EditorialBoardMember } from "@ijaac/shared";
import PersonCard from "@/components/PersonCard";
import PageHero from "@/components/PageHero";
import MotionCard from "@/components/MotionCard";

export const metadata = pageMetadata({
  title: "Editorial Board",
  description:
    "Meet the editors and board members of the International Journal of Applied AI & Computing (IJAAC) who oversee peer review and editorial standards.",
  path: "/editorial-board",
});
export const revalidate = 0;

const ROLE_LABELS: Record<string, string> = {
  EDITOR_IN_CHIEF: "Editor-in-Chief",
  ASSOCIATE_EDITOR: "Associate Editors",
  MEMBER: "Editorial Board Members",
  ADVISORY_BOARD: "Advisory Board",
};

async function EditorialBoardContent() {
  const members = await listEditorialBoard({ activeOnly: true }).catch(() => []);
  const grouped = members.reduce<Record<string, EditorialBoardMember[]>>((acc, m) => {
    (acc[m.role] ??= []).push(m);
    return acc;
  }, {});

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {Object.entries(ROLE_LABELS).map(([role, label]) =>
          grouped[role]?.length ? (
            <Grid container spacing={3} sx={{ mb: 5 }} key={role}>
              <Grid item xs={12}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  {label}
                </Typography>
              </Grid>
              {grouped[role].map((m, i) => (
                <Grid item xs={12} sm={6} md={4} key={m.id}>
                  <MotionCard delay={(i % 3) * 0.08}>
                    <PersonCard
                      name={m.name}
                      designation={m.designation}
                      affiliation={m.affiliation}
                      country={m.country}
                      photoUrl={m.photoUrl}
                      bio={m.bio}
                      linkedinUrl={m.linkedinUrl}
                    />
                  </MotionCard>
                </Grid>
              ))}
            </Grid>
          ) : null
        )}
        {members.length === 0 && (
          <Typography color="text.secondary">
            Editorial board information will be published here shortly.
          </Typography>
        )}
      </Container>
    </>
  );
}

/** Banner renders immediately; only the S3-backed content waits behind a skeleton. */
export default function EditorialBoardPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Editorial Board", path: "/editorial-board" }])} />
      <PageHero
        title="Editorial Board"
        subtitle="Meet the editors and board members who guide the journal's academic standards."
        icon="board"
      />
      <Suspense fallback={<CardGridSkeleton bare count={6} />}>
        <EditorialBoardContent />
      </Suspense>
    </>
  );
}
