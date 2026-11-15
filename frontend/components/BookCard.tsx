import type { Book } from "@ijaac/shared";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { JUSTIFIED_SX, bioText } from "@/lib/text";

const clamp = (lines: number) =>
  ({
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    wordBreak: "break-word",
  }) as const;

export default function BookCard({ book }: { book: Book }) {
  const authors = book.authors.join(", ");
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }} elevation={1}>
      <Box sx={{ position: "relative", aspectRatio: "3 / 4", bgcolor: "grey.100", overflow: "hidden" }}>
        <CardMedia
          component="img"
          image={book.coverImageUrl}
          alt={book.title}
          loading="lazy"
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        {book.featured && (
          <Chip
            label="Featured"
            size="small"
            color="secondary"
            sx={{ position: "absolute", top: 12, left: 12 }}
          />
        )}
      </Box>
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 0.75, minWidth: 0 }}>
        {book.category && (
          <Typography variant="overline" color="secondary.dark" sx={{ lineHeight: 1.4 }} noWrap>
            {book.category}
          </Typography>
        )}
        <Typography
          variant="h6"
          component="h3"
          title={book.title}
          sx={{ ...clamp(2), lineHeight: 1.3, minHeight: "2.6em" }}
        >
          {book.title}
        </Typography>
        <Typography variant="body2" color="primary.main" fontWeight={600} title={authors} noWrap>
          {authors}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          lang="en"
          sx={{ ...clamp(3), ...JUSTIFIED_SX, lineHeight: 1.55 }}
        >
          {bioText(book.description)}
        </Typography>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
          sx={{ mt: "auto", pt: 1.5 }}
        >
          <Typography variant="caption" color="text.secondary" noWrap sx={{ minWidth: 0 }}>
            {[book.publisher, book.publishedYear].filter(Boolean).join(" - ")}
          </Typography>
          <Button
            href={book.purchaseLink}
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            size="small"
            endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
            sx={{ flexShrink: 0 }}
          >
            Purchase
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
