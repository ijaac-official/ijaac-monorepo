import Container from "@mui/material/Container";
import { listPublishedPapersPage } from "@ijaac/data-store";
import PageHero from "@/components/PageHero";
import PublicationsList from "@/components/PublicationsList";

export const metadata = { title: "All Publications - IJAAC Journal" };
export const revalidate = 0;

export default async function PublicationsPage() {
  const { items, total } = await listPublishedPapersPage({ offset: 0, limit: 10 }).catch(() => ({
    items: [],
    total: 0,
  }));

  return (
    <>
      <PageHero
        title="All Publications"
        subtitle="Every peer-reviewed paper published by the journal."
        image="https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80"
      />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <PublicationsList initialItems={items} total={total} />
      </Container>
    </>
  );
}
