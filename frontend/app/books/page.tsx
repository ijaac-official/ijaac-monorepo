import { Suspense } from "react";
import CardGridSkeleton from "@/components/CardGridSkeleton";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { listBooks } from "@ijaac/data-store";
import BookCard from "@/components/BookCard";
import PageHero from "@/components/PageHero";
import MotionCard from "@/components/MotionCard";

export const metadata = { title: "Books - IJAAC Journal" };
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
      <PageHero
        title="Published Books"
        subtitle="Books authored or edited by our editorial and reviewer community."
        icon="books"
      />
      <Suspense fallback={<CardGridSkeleton bare count={6} />}>
        <BooksContent />
      </Suspense>
    </>
  );
}
