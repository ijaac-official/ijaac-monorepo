import type { Book } from "@ijaac/shared";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";

export default function BookCard({ book }: { book: Book }) {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }} elevation={1}>
      <CardMedia
        component="img"
        image={book.coverImageUrl}
        alt={book.title}
        sx={{ height: 280, objectFit: "cover" }}
      />
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {book.featured && (
          <Chip label="Featured" size="small" color="secondary" sx={{ mb: 1, width: "fit-content" }} />
        )}
        <Typography variant="h6" gutterBottom>
          {book.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {book.authors.join(", ")}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, flexGrow: 1 }}>
          {book.description}
        </Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          {book.publishedYear && (
            <Typography variant="caption" color="text.secondary">
              {book.publishedYear}
            </Typography>
          )}
          <Button
            href={book.purchaseLink}
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            size="small"
          >
            Purchase
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
