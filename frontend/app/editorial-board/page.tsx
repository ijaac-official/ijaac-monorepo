import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { listEditorialBoard } from "@ijaac/data-store";
import type { EditorialBoardMember } from "@ijaac/shared";
import PersonCard from "@/components/PersonCard";
import PageHero from "@/components/PageHero";

export const metadata = { title: "Editorial Board - IJAAC Journal" };
export const revalidate = 0;

const ROLE_LABELS: Record<string, string> = {
  EDITOR_IN_CHIEF: "Editor-in-Chief",
  ASSOCIATE_EDITOR: "Associate Editors",
  MEMBER: "Editorial Board Members",
  ADVISORY_BOARD: "Advisory Board",
};

export default async function EditorialBoardPage() {
  const members = await listEditorialBoard({ activeOnly: true }).catch(() => []);
  const grouped = members.reduce<Record<string, EditorialBoardMember[]>>((acc, m) => {
    (acc[m.role] ??= []).push(m);
    return acc;
  }, {});

  return (
    <>
      <PageHero
        title="Editorial Board"
        subtitle="Meet the editors and board members who guide the journal's academic standards."
        image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=80"
      />
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {Object.entries(ROLE_LABELS).map(([role, label]) =>
          grouped[role]?.length ? (
            <Grid container spacing={3} sx={{ mb: 5 }} key={role}>
              <Grid item xs={12}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  {label}
                </Typography>
              </Grid>
              {grouped[role].map((m) => (
                <Grid item xs={12} sm={6} md={4} key={m.id}>
                  <PersonCard
                    name={m.name}
                    designation={m.designation}
                    affiliation={m.affiliation}
                    country={m.country}
                    photoUrl={m.photoUrl}
                    bio={m.bio}
                    linkedinUrl={m.linkedinUrl}
                  />
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
