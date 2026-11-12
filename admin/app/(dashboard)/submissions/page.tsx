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
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import Link from "next/link";
import { listSubmissions } from "@ijaac/data-store";
import type { SubmissionStatus } from "@ijaac/shared";

export const revalidate = 0;

const TABS: { value: string; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "PUBLISHED", label: "Published" },
  { value: "REJECTED", label: "Rejected" },
];

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const activeStatus = searchParams.status ?? "ALL";
  const query = searchParams.q ?? "";
  const submissions = await listSubmissions({
    status: activeStatus === "ALL" ? undefined : (activeStatus as SubmissionStatus),
    query: query || undefined,
  }).catch(() => []);

  const tabHref = (status: string) => {
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    if (query) params.set("q", query);
    const qs = params.toString();
    return qs ? `/submissions?${qs}` : "/submissions";
  };

  return (
    <>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Submissions
      </Typography>

      <Box component="form" method="GET" sx={{ mb: 2, maxWidth: 420 }}>
        {activeStatus !== "ALL" && <input type="hidden" name="status" value={activeStatus} />}
        <TextField
          name="q"
          defaultValue={query}
          placeholder="Search by title, keyword, or author"
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconButton type="submit" size="small" edge="start">
                  <SearchIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Paper variant="outlined">
        <Tabs value={activeStatus} sx={{ px: 1, borderBottom: 1, borderColor: "divider" }}>
          {TABS.map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} component={Link} href={tabHref(tab.value)} />
          ))}
        </Tabs>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Corresponding Author</TableCell>
              <TableCell>Submitted</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissions.map((s) => (
              <TableRow key={s.id} hover>
                <TableCell sx={{ maxWidth: 420 }}>
                  <Link href={`/submissions/${s.id}`} style={{ color: "inherit", textDecoration: "none", fontWeight: 500 }}>
                    {s.title}
                  </Link>
                </TableCell>
                <TableCell>{s.correspondingEmail}</TableCell>
                <TableCell>{new Date(s.submittedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip label={s.status.replace("_", " ")} size="small" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {submissions.length === 0 && (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            No submissions match this search.
          </Typography>
        )}
      </Paper>
    </>
  );
}
