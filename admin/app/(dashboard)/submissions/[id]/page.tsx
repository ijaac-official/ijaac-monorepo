import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubmission, listIssues } from "@ijaac/data-store";
import { formatInr } from "@ijaac/shared";
import DecisionPanel from "@/components/DecisionPanel";
import ReviewerAssignmentPanel from "@/components/ReviewerAssignmentPanel";
import CertificateSharePanel from "@/components/CertificateSharePanel";
import SubmissionEditDialog from "@/components/submissions/SubmissionEditDialog";
import VisibilityToggle from "@/components/submissions/VisibilityToggle";
import { STATUS_COLORS, STATUS_LABELS, issueLabel } from "@/components/submissions/meta";

export const revalidate = 0;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Typography variant="body2" sx={{ mb: 0.5, wordBreak: "break-word" }}>
      <b>{label}:</b> {children}
    </Typography>
  );
}

export default async function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const s = await getSubmission(params.id);
  if (!s) notFound();

  const issues = await listIssues().catch(() => []);
  const issue = s.issueId ? issues.find((i) => i.id === s.issueId) : undefined;
  const fileUrl = `/api/submissions/${s.id}/file`;
  const isPdf = s.fileType === "application/pdf";
  const isPublic = s.isPublic !== false;

  return (
    <>
      <Button component={Link} href="/submissions" startIcon={<ArrowBackIcon />} size="small" sx={{ mb: 1 }}>
        All submissions
      </Button>

      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ md: "flex-start" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom sx={{ overflowWrap: "anywhere" }}>
            {s.title}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label={STATUS_LABELS[s.status]} color={STATUS_COLORS[s.status]} size="small" />
            {s.source === "ADMIN" && <Chip label="Source: Admin entry" size="small" variant="outlined" color="secondary" />}
            {s.articleNumber && <Chip label={`Article ${s.articleNumber}`} size="small" variant="outlined" />}
            {!isPublic && <Chip label="Private" size="small" variant="outlined" color="warning" />}
          </Stack>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{ flexShrink: 0, maxWidth: "100%" }}>
          <VisibilityToggle submissionId={s.id} isPublic={isPublic} showLabel size="medium" />
          <SubmissionEditDialog submission={s} issues={issues} />
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8} sx={{ minWidth: 0 }}>
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Abstract
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {s.abstract}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Keywords
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              {s.keywords.map((kw) => (
                <Chip key={kw} label={kw} size="small" />
              ))}
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Authors
            </Typography>
            {s.authors.map((a, i) => (
              <Typography key={`${a.email}-${i}`} variant="body2" sx={{ mb: 0.5, overflowWrap: "anywhere" }}>
                {i + 1}. {a.name} ({a.email}){a.affiliation ? ` - ${a.affiliation}` : ""}
                {a.isCorresponding ? " - Corresponding" : ""}
              </Typography>
            ))}
          </Paper>

          <Box sx={{ mb: 3 }}>
            <DecisionPanel
              submissionId={s.id}
              currentStatus={s.status}
              issues={issues}
              issueId={s.issueId}
              publishedAt={s.publishedAt}
              articleNumber={s.articleNumber}
              decidedAt={s.decidedAt}
            />
          </Box>

          <ReviewerAssignmentPanel submissionId={s.id} assignments={s.reviewAssignments ?? []} />
        </Grid>

        <Grid item xs={12} md={4} sx={{ minWidth: 0 }}>
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Manuscript File
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ wordBreak: "break-all" }}>
              {s.fileName}
            </Typography>
            <Stack spacing={1}>
              <Button href={fileUrl} target="_blank" rel="noopener noreferrer" variant="contained" fullWidth>
                {isPdf ? "View Manuscript" : "Download Manuscript"}
              </Button>
              {s.publishedFileKey && (
                <Button
                  href={`${fileUrl}?version=published`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  fullWidth
                >
                  View Published (Typeset) PDF
                </Button>
              )}
            </Stack>
          </Paper>

          <Box sx={{ mb: 3 }}>
            <CertificateSharePanel
              submissionId={s.id}
              status={s.status}
              certificatesSentAt={s.certificatesSentAt}
              authorCount={s.authors.length}
            />
          </Box>

          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Publication
            </Typography>
            <Row label="Issue">{issue ? issueLabel(issue) : "Not assigned"}</Row>
            {(s.volume || s.issueNumber) && (
              <Row label="Volume / Issue">
                {s.volume ?? "-"} / {s.issueNumber ?? "-"}
              </Row>
            )}
            <Row label="Article Number">{s.articleNumber ?? "Not assigned"}</Row>
            <Row label="Published">{s.publishedAt ? new Date(s.publishedAt).toLocaleDateString() : "Not yet"}</Row>
            <Row label="Visibility">{isPublic ? "Public" : "Private (hidden from the website)"}</Row>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Payment
            </Typography>
            {s.payment ? (
              <>
                <Row label="Paid">
                  {formatInr(s.payment.amountInPaise)}
                  {s.payment.baseAmountInPaise && s.payment.baseAmountInPaise !== s.payment.amountInPaise
                    ? ` (of ${formatInr(s.payment.baseAmountInPaise)})`
                    : ""}
                </Row>
                {s.payment.receiptNumber && <Row label="Receipt">{s.payment.receiptNumber}</Row>}
                <Row label="Razorpay Payment">{s.payment.paymentId}</Row>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {s.source === "ADMIN" ? "No payment - entered by an editor." : "No payment - fee waived."}
              </Typography>
            )}
            {s.couponCode && (
              <Chip
                label={`${s.couponCode}${s.discountPercent ? ` - ${s.discountPercent}% off` : ""}`}
                size="small"
                color="secondary"
                sx={{ mt: 1, maxWidth: "100%" }}
              />
            )}
          </Paper>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Submission Details
            </Typography>
            <Row label="Corresponding Email">{s.correspondingEmail}</Row>
            {s.correspondingPhone && <Row label="Phone">{s.correspondingPhone}</Row>}
            <Row label="Submitted">{new Date(s.submittedAt).toLocaleString()}</Row>
            <Row label="Last Updated">{new Date(s.updatedAt).toLocaleString()}</Row>
            <Row label="ID">{s.id}</Row>
            {s.reviewComment && (
              <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
                <b>Last Comment:</b> {s.reviewComment}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
