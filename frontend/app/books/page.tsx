import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { Suspense } from "react";
import CardGridSkeleton from "@/components/CardGridSkeleton";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { listBooks } from "@ijaac/data-store";
import BookCard from "@/components/BookCard";
import PageHero from "@/components/PageHero";
import MotionCard from "@/components/MotionCard";
import PublishBookSection from "@/components/PublishBookSection";

export const metadata = pageMetadata({
  title: "Books",
  description:
    "Books on applied AI and computing authored or edited by members of the IJAAC editorial and reviewer community.",
  path: "/books",
});
export const revalidate = 0;

async function BooksContent() {
  const books = await listBooks().catch(() => []);

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={3}>
          {books.map((book, i) => (
            <Grid item xs={12} sm={6} md={4} key={book.id}>
              <MotionCard delay={(i % 3) * 0.08}>
                <BookCard book={book} />
              </MotionCard>
            </Grid>
          ))}
        </Grid>
        {books.length === 0 && (
          <Typography color="text.secondary">No books published yet.</Typography>
        )}
      </Container>
    </>
  );
}

/** Banner renders immediately; only the S3-backed content waits behind a skeleton. */
export default function BooksPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Books", path: "/books" }])} />
      <PageHero
        title="Published Books"
        subtitle="Books authored or edited by our editorial and reviewer community."
        icon="books"
      />
      <Suspense fallback={<CardGridSkeleton bare count={6} />}>
        <BooksContent />
      </Suspense>
      <Suspense fallback={null}>
        <PublishBookSection />
      </Suspense>
    </>
  );
}
