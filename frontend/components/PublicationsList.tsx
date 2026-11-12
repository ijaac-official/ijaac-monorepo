"use client";

import * as React from "react";
import type { Submission } from "@ijaac/shared";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "next/link";

const PAGE_SIZE = 10;

export default function PublicationsList({
  initialItems,
  total,
}: {
  initialItems: Submission[];
  total: number;
}) {
  const [items, setItems] = React.useState(initialItems);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadMore = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/publications?offset=${items.length}&limit=${PAGE_SIZE}`);
      if (!res.ok) throw new Error("Could not load more publications");
      const body = await res.json();
      setItems((prev) => [...prev, ...body.items]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load more publications");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Stack spacing={2}>
        {items.map((paper) => (
          <Paper
            key={paper.id}
            component={Link}
            href={`/publications/${paper.id}`}
            variant="outlined"
            sx={{
              p: 3,
              display: "block",
              textDecoration: "none",
              color: "inherit",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              "&:hover": { transform: "translateY(-2px)", boxShadow: 3 },
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {paper.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {paper.authors.map((a) => a.name).join(", ")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Published{" "}
              {new Date(paper.publishedAt ?? paper.submittedAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              {paper.volume && paper.issueNumber
                ? ` - Vol. ${paper.volume}, Issue ${paper.issueNumber}`
                : ""}
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 1.5, gap: 0.5 }}>
              {paper.keywords.slice(0, 5).map((kw) => (
                <Chip key={kw} label={kw} size="small" />
              ))}
            </Stack>
          </Paper>
        ))}
      </Stack>

      {items.length === 0 && (
        <Typography color="text.secondary" sx={{ py: 4 }}>
          No publications yet.
        </Typography>
      )}

      {error && (
        <Typography color="error" variant="body2" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      {items.length < total && (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Button
            variant="outlined"
            onClick={loadMore}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : undefined}
          >
            {loading ? "Loading..." : "Load More"}
          </Button>
        </Box>
      )}
    </Box>
  );
}
