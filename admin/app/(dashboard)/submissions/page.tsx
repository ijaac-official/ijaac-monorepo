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
import AddIcon from "@mui/icons-material/Add";
import Link from "next/link";
import { filterSubmissions, listAllSubmissionsRaw, listIssues, type SubmissionFilter } from "@ijaac/data-store";
import { SUBMISSION_STATUSES, formatInr, type SubmissionStatus } from "@ijaac/shared";
import SubmissionFilters from "@/components/submissions/SubmissionFilters";
import VisibilityToggle from "@/components/submissions/VisibilityToggle";
import { FILTER_KEYS, STATUS_COLORS, STATUS_LABELS, issueLabel, type FilterValues } from "@/components/submissions/meta";

export const revalidate = 0;

type SearchParams = Partial<Record<keyof FilterValues | "status", string | string[]>>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

export default async function SubmissionsPage({ searchParams }: { searchParams: SearchParams }) {
  const values = Object.fromEntries(FILTER_KEYS.map((k) => [k, one(searchParams[k])])) as FilterValues;
  const rawStatus = one(searchParams.status);
  const activeStatus = (SUBMISSION_STATUSES as string[]).includes(rawStatus) ? (rawStatus as SubmissionStatus) : "ALL";

  // Status is applied in memory so each tab can show its count for the other filters.
  const filter: SubmissionFilter = {
    query: values.q || undefined,
    author: values.author || undefined,
    issueId: values.issue || undefined,
    visibility: values.visibility === "public" || values.visibility === "private" ? values.visibility : undefined,
    paid: values.paid === "paid" ? true : values.paid === "waived" ? false : undefined,
    from: isDate(values.from) ? values.from : undefined,
    to: isDate(values.to) ? values.to : undefined,
  };

  const [allSubmissions, issues] = await Promise.all([
    listAllSubmissionsRaw().catch(() => []),
    listIssues().catch(() => []),
  ]);
  const matching = filterSubmissions(allSubmissions, filter);
  const issueById = new Map(issues.map((i) => [i.id, i]));

  const counts: Record<string, number> = { ALL: matching.length };
  for (const s of matching) counts[s.status] = (counts[s.status] ?? 0) + 1;
  const submissions = activeStatus === "ALL" ? matching : matching.filter((s) => s.status === activeStatus);

  const tabHref = (status: string) => {
    const params = new URLSearchParams();
    for (const k of FILTER_KEYS) if (values[k]) params.set(k, values[k]);
    if (status !== "ALL") params.set("status", status);
    const qs = params.toString();
    return qs ? `/submissions?${qs}` : "/submissions";
  };

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          Submissions
        </Typography>
        <Button component={Link} href="/submissions/new" variant="contained" startIcon={<AddIcon />}>
          Add Paper
        </Button>
      </Stack>

      <SubmissionFilters
        initial={values}
        issues={issues}
        resultCount={submissions.length}
        totalCount={allSubmissions.length}
      />

      <Paper variant="outlined">
        <Tabs
          value={activeStatus}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 1, borderBottom: 1, borderColor: "divider" }}
        >
          {(["ALL", ...SUBMISSION_STATUSES] as const).map((status) => (
            <Tab
              key={status}
              value={status}
              label={`${status === "ALL" ? "All" : STATUS_LABELS[status]} (${counts[status] ?? 0})`}
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
                <TableCell>Authors</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Issue</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Fee</TableCell>
                <TableCell align="center">Public</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.map((s) => {
                const first = s.authors[0];
                const issue = s.issueId ? issueById.get(s.issueId) : undefined;
                return (
                  <TableRow key={s.id} hover>
                    <TableCell sx={{ maxWidth: 380, minWidth: 220 }}>
                      <Link href={`/submissions/${s.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          {s.title}
                        </Typography>
                      </Link>
                      {s.source === "ADMIN" && (
                        <Chip label="Admin entry" size="small" variant="outlined" sx={{ mt: 0.5, height: 20, fontSize: 11 }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ minWidth: 160 }}>
                      <Typography variant="body2">{first?.name ?? s.correspondingEmail}</Typography>
                      {s.authors.length > 1 && (
                        <Typography variant="caption" color="text.secondary">
                          +{s.authors.length - 1} more
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={STATUS_LABELS[s.status]} color={STATUS_COLORS[s.status]} size="small" />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {issue ? issueLabel(issue) : s.volume ? `Vol. ${s.volume}, Issue ${s.issueNumber ?? "-"}` : "-"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{new Date(s.submittedAt).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {s.payment ? (
                        formatInr(s.payment.amountInPaise)
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {s.source === "ADMIN" ? "None" : "Waived"}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <VisibilityToggle submissionId={s.id} isPublic={s.isPublic !== false} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
        {submissions.length === 0 && (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            No submissions match these filters.
          </Typography>
        )}
      </Paper>
    </>
  );
}
