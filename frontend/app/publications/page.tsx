import { Suspense } from "react";
import CardGridSkeleton from "@/components/CardGridSkeleton";
import Container from "@mui/material/Container";
import { listPublishedPapersPage } from "@ijaac/data-store";
import PageHero from "@/components/PageHero";
import PublicationsList from "@/components/PublicationsList";

export const metadata = { title: "All Publications - IJAAC Journal" };
export const revalidate = 0;

async function PublicationsContent({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = (searchParams.q ?? "").trim().replace(/\s+/g, " ");
  const { items, total } = await listPublishedPapersPage({ offset: 0, limit: 10, query }).catch(
    () => ({ items: [], total: 0 })
  );

  return (
    <>
      <Container maxWidth="md" sx={{ py: 6 }}>
        <PublicationsList key={query} initialItems={items} total={total} initialQuery={query} />
      </Container>
    </>
  );
}

/** Banner renders immediately; only the S3-backed content waits behind a skeleton. */
export default function PublicationsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  return (
    <>
      <PageHero
        title="All Publications"
        subtitle="Every peer-reviewed paper published by the journal."
        icon="publications"
      />
      <Suspense fallback={<CardGridSkeleton bare count={4} mediaHeight={120} />}>
        <PublicationsContent searchParams={searchParams}/>
      </Suspense>
    </>
  );
}
