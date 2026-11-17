import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { Suspense } from "react";
import CardGridSkeleton from "@/components/CardGridSkeleton";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { listEditorialBoard } from "@ijaac/data-store";
import type { EditorialBoardMember } from "@ijaac/shared";
import BoardMemberCard from "@/components/BoardMemberCard";
import Box from "@mui/material/Box";
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

function SectionTitle({ label, count }: { label: string; count: number }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
      <Box aria-hidden sx={{ width: 28, height: 3, bgcolor: "secondary.main", flexShrink: 0 }} />
      <Typography variant="h5" component="h2" fontWeight={700}>
        {label}
      </Typography>
      <Typography component="span" variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
        ({count})
      </Typography>
    </Box>
  );
}

async function EditorialBoardContent() {
  const members = await listEditorialBoard({ activeOnly: true }).catch(() => []);
  const grouped = members.reduce<Record<string, EditorialBoardMember[]>>((acc, m) => {
    (acc[m.role] ??= []).push(m);
    return acc;
  }, {});

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
      {Object.entries(ROLE_LABELS).map(([role, label]) => {
        const list = grouped[role];
        if (!list?.length) return null;
        const featured = role === "EDITOR_IN_CHIEF";
        return (
          <Box component="section" key={role} sx={{ mb: { xs: 5, md: 6 } }}>
            <SectionTitle label={label} count={list.length} />
            <Grid container spacing={3}>
              {list.map((m, i) => (
                <Grid item xs={12} sm={featured ? 12 : 6} md={featured ? 12 : 4} key={m.id}>
                  <MotionCard delay={(i % 3) * 0.08}>
                    <BoardMemberCard member={m} featured={featured} />
                  </MotionCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      })}
      {members.length === 0 && (
        <Typography color="text.secondary">
          Editorial board information will be published here shortly.
        </Typography>
      )}
    </Container>
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
        image="/stock/editorial-review.jpg"
      />
      <Suspense fallback={<CardGridSkeleton bare count={6} />}>
        <EditorialBoardContent />
      </Suspense>
    </>
  );
}
