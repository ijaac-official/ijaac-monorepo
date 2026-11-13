import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { Suspense } from "react";
import CardGridSkeleton from "@/components/CardGridSkeleton";
import Container from "@mui/material/Container";
import { listPublishedPapersPage } from "@ijaac/data-store";
import PageHero from "@/components/PageHero";
import PublicationsList from "@/components/PublicationsList";

export const metadata = pageMetadata({
  title: "All Publications",
  description:
    "Search and browse all peer-reviewed, open-access articles published in the International Journal of Applied AI & Computing (IJAAC).",
  path: "/publications",
});
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
      <JsonLd data={breadcrumbJsonLd([{ name: "Publications", path: "/publications" }])} />
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
