import { notFound } from "next/navigation";
import Link from "next/link";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import { getIssue, listSubmissions } from "@ijaac/data-store";

export const revalidate = 0;

export default async function AdminIssueDetailPage({ params }: { params: { id: string } }) {
  const issue = await getIssue(params.id);
  if (!issue) notFound();

  const papers = (await listSubmissions({ status: "PUBLISHED" }).catch(() => [])).filter(
    (s) => s.issueId === issue.id
  );

  return (
    <>
      <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 3 }}>
        <Avatar variant="rounded" src={issue.coverImageUrl} sx={{ width: 64, height: 90 }} />
        <Stack>
          <Typography variant="h5" fontWeight={600}>
            {issue.title ?? `Volume ${issue.volume}, Issue ${issue.number}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Volume {issue.volume}, Issue {issue.number} - {issue.year}
          </Typography>
        </Stack>
      </Stack>

      {issue.description && (
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="body1">{issue.description}</Typography>
        </Paper>
      )}

      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Published Papers ({papers.length})
      </Typography>
      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Authors</TableCell>
              <TableCell align="right">PDF</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {papers.map((paper) => (
              <TableRow key={paper.id}>
                <TableCell>{paper.title}</TableCell>
                <TableCell>{paper.authors.map((a) => a.name).join(", ")}</TableCell>
                <TableCell align="right">
                  <Link href={`${process.env.FRONTEND_URL ?? ""}/article/view/${paper.id}`} target="_blank">
                    View PDF
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {papers.length === 0 && (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            No papers published in this issue yet.
          </Typography>
        )}
      </Paper>
    </>
  );
}
