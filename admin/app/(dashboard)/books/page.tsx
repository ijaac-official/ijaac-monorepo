import Typography from "@mui/material/Typography";
import { listBooks } from "@ijaac/data-store";
import BooksManager from "@/components/BooksManager";

export const revalidate = 0;

export default async function BooksAdminPage() {
  const books = await listBooks().catch(() => []);
  return (
    <>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Books
      </Typography>
      <BooksManager initialBooks={books} />
    </>
  );
}
