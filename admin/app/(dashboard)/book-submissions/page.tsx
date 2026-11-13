import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Link from "next/link";
import { listBookSubmissions } from "@ijaac/data-store";
import { BOOK_SUBMISSION_STATUSES, formatInr, type BookSubmissionStatus } from "@ijaac/shared";
import { BOOK_STATUS_COLORS, BOOK_STATUS_LABELS } from "@/components/book-submissions/meta";

export const revalidate = 0;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function BookSubmissionsPage({
  searchParams,
}: {
  searchParams: { q?: string | string[]; status?: string | string[] };
}) {
  const q = one(searchParams.q).trim();
  const rawStatus = one(searchParams.status);
  const activeStatus = (BOOK_SUBMISSION_STATUSES as string[]).includes(rawStatus)
    ? (rawStatus as BookSubmissionStatus)
    : "ALL";

  const matching = await listBookSubmissions({ query: q || undefined }).catch(() => []);
  const counts: Record<string, number> = { ALL: matching.length };
  for (const b of matching) counts[b.status] = (counts[b.status] ?? 0) + 1;
  const rows = activeStatus === "ALL" ? matching : matching.filter((b) => b.status === activeStatus);

  const tabHref = (status: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status !== "ALL") params.set("status", status);
    const qs = params.toString();
    return qs ? `/book-submissions?${qs}` : "/book-submissions";
  };

  return (
    <>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Book Submissions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Book publication requests submitted through the public &quot;Publish Your Book&quot; page. Manuscripts are collected from authors by email.
      </Typography>

      <Box component="form" method="get" action="/book-submissions" sx={{ mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
          <TextField
            name="q"
            defaultValue={q}
            size="small"
            placeholder="Search title, author, email, phone, category, receipt..."
            sx={{ flex: 1, minWidth: 0, maxWidth: { sm: 520 } }}
          />
          {activeStatus !== "ALL" && <input type="hidden" name="status" value={activeStatus} />}
          <Stack direction="row" spacing={1}>
            <Button type="submit" variant="contained">
              Search
            </Button>
            {q && (
              <Button component={Link} href={activeStatus === "ALL" ? "/book-submissions" : `/book-submissions?status=${activeStatus}`}>
                Clear
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>

      <Paper variant="outlined" sx={{ minWidth: 0 }}>
        <Tabs value={activeStatus} variant="scrollable" scrollButtons="auto" sx={{ px: 1, borderBottom: 1, borderColor: "divider" }}>
          {(["ALL", ...BOOK_SUBMISSION_STATUSES] as const).map((status) => (
            <Tab
              key={status}
              value={status}
              label={`${status === "ALL" ? "All" : BOOK_STATUS_LABELS[status]} (${counts[status] ?? 0})`}
              component={Link}
              href={tabHref(status)}
              scroll={false}
            />
          ))}
        </Tabs>
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Paid</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((b) => (
                <TableRow key={b.id} hover>
                  <TableCell sx={{ maxWidth: 380, minWidth: 220 }}>
                    <Link href={`/book-submissions/${b.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          overflowWrap: "anywhere",
                          "&:hover": { textDecoration: "underline" },
                        }}
                      >
                        {b.title}
                      </Typography>
                    </Link>
                  </TableCell>
                  <TableCell sx={{ minWidth: 160, maxWidth: 260 }}>
                    <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                      {b.authorName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                      {b.email}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 120, maxWidth: 200, overflowWrap: "anywhere" }}>{b.category ?? "-"}</TableCell>
                  <TableCell>
                    <Chip label={BOOK_STATUS_LABELS[b.status]} color={BOOK_STATUS_COLORS[b.status]} size="small" />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{new Date(b.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {b.payment ? (
                      formatInr(b.payment.amountInPaise)
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Waived
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        {rows.length === 0 && (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            {q ? "No book submissions match this search." : "No book submissions yet."}
          </Typography>
        )}
      </Paper>
    </>
  );
}
