import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { listBooks } from "@ijaac/data-store";
import BookCard from "@/components/BookCard";
import PageHero from "@/components/PageHero";
import MotionCard from "@/components/MotionCard";

export const metadata = { title: "Books - IJAAC Journal" };
export const revalidate = 0;

export default async function BooksPage() {
  const books = await listBooks().catch(() => []);

  return (
    <>
      <PageHero
        title="Published Books"
        subtitle="Books authored or edited by our editorial and reviewer community."
        image="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1920&q=80"
      />
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
