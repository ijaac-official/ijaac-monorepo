import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookSubmission } from "@ijaac/data-store";
import { formatInr } from "@ijaac/shared";
import BookSubmissionActions from "@/components/book-submissions/BookSubmissionActions";
import { BOOK_STATUS_COLORS, BOOK_STATUS_LABELS, formatBytes } from "@/components/book-submissions/meta";

export const revalidate = 0;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Typography variant="body2" sx={{ mb: 0.75, overflowWrap: "anywhere" }}>
      <b>{label}:</b> {children}
    </Typography>
  );
}

const dt = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export default async function BookSubmissionDetailPage({ params }: { params: { id: string } }) {
  const b = await getBookSubmission(params.id);
  if (!b) notFound();

  const fileUrl = `/api/book-submissions/${b.id}/file`;
  const coverUrl = `${fileUrl}?which=cover`;
  const hasManuscript = !!b.manuscriptKey;
  const isPdf = b.manuscriptType === "application/pdf";

  return (
    <Box sx={{ minWidth: 0 }}>
      <Button component={Link} href="/book-submissions" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        All book submissions
      </Button>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "flex-start" }} sx={{ mb: 3, minWidth: 0 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" fontWeight={600} sx={{ overflowWrap: "anywhere" }}>
            {b.title}
          </Typography>
          {b.subtitle && (
            <Typography variant="subtitle1" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
              {b.subtitle}
            </Typography>
          )}
        </Box>
        <Chip label={BOOK_STATUS_LABELS[b.status]} color={BOOK_STATUS_COLORS[b.status]} sx={{ alignSelf: "flex-start" }} />
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8} sx={{ minWidth: 0 }}>
          <Stack spacing={3}>
            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Author
              </Typography>
              <Row label="Name">{b.authorName}</Row>
              {b.coAuthors && b.coAuthors.length > 0 && <Row label="Co-authors">{b.coAuthors.join(", ")}</Row>}
              <Row label="Email">
                <a href={`mailto:${b.email}`} style={{ color: "inherit" }}>
                  {b.email}
                </a>
              </Row>
              <Row label="Phone">
                <a href={`tel:${b.phone.replace(/[\s-]/g, "")}`} style={{ color: "inherit" }}>
                  {b.phone}
                </a>
              </Row>
              {b.affiliation && <Row label="Affiliation">{b.affiliation}</Row>}
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Book
              </Typography>
              <Row label="Category">{b.category ?? "-"}</Row>
              <Row label="Approx. pages">{b.pageCount ?? "-"}</Row>
              <Row label="Submitted">{dt(b.submittedAt)}</Row>
              {b.decidedAt && <Row label="Last decision">{dt(b.decidedAt)}</Row>}
              <Row label="Submission ID">
                <Box component="code" sx={{ overflowWrap: "anywhere" }}>
                  {b.id}
                </Box>
              </Row>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" gutterBottom>
                Synopsis
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                {b.synopsis}
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Manuscript &amp; Cover
              </Typography>
              {hasManuscript ? (
                <Row label="Manuscript (uploaded with an earlier request)">
                  {b.manuscriptName ?? "manuscript"}
                  {b.manuscriptSize ? ` (${formatBytes(b.manuscriptSize)})` : ""}
                </Row>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                  No manuscript is uploaded online. Contact the author at{" "}
                  <a href={`mailto:${b.email}`} style={{ color: "inherit" }}>
                    {b.email}
                  </a>{" "}
                  to collect the manuscript and discuss the publication.
                </Typography>
              )}
              {!b.coverKey && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  No cover image provided.
                </Typography>
              )}
              {(hasManuscript || b.coverKey) && (
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                  {hasManuscript && isPdf && (
                    <Button variant="outlined" size="small" startIcon={<OpenInNewIcon />} href={fileUrl} target="_blank">
                      Open PDF
                    </Button>
                  )}
                  {hasManuscript && (
                    <Button variant="outlined" size="small" startIcon={<DownloadIcon />} href={`${fileUrl}?download=1`}>
                      Download Manuscript
                    </Button>
                  )}
                  {b.coverKey && (
                    <Button variant="outlined" size="small" startIcon={<DownloadIcon />} href={`${coverUrl}&download=1`}>
                      Download Cover
                    </Button>
                  )}
                </Stack>
              )}
              {b.coverKey && (
                <Box
                  component="img"
                  src={coverUrl}
                  alt="Submitted cover"
                  sx={{ mt: 2, display: "block", width: 140, maxWidth: "100%", height: "auto", border: 1, borderColor: "divider" }}
                />
              )}
            </Paper>
          </Stack>
        </Grid>

        <Grid item xs={12} md={4} sx={{ minWidth: 0 }}>
          <Stack spacing={3}>
            <BookSubmissionActions
              id={b.id}
              status={b.status}
              publishedBookId={b.publishedBookId}
              reviewComment={b.reviewComment}
            />

            <Paper variant="outlined" sx={{ p: 2.5, minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Payment
              </Typography>
              {b.payment ? (
                <>
                  <Row label="Paid">
                    {formatInr(b.payment.amountInPaise)}
                    {b.payment.baseAmountInPaise && b.payment.baseAmountInPaise !== b.payment.amountInPaise
                      ? ` (of ${formatInr(b.payment.baseAmountInPaise)})`
                      : ""}
                  </Row>
                  {b.couponCode && (
                    <Row label="Coupon">
                      {b.couponCode} ({b.discountPercent}% off)
                    </Row>
                  )}
                  <Row label="Receipt">{b.payment.receiptNumber ?? "-"}</Row>
                  <Row label="Payment ID">{b.payment.paymentId}</Row>
                  <Row label="Order ID">{b.payment.orderId}</Row>
                  <Row label="Paid at">{dt(b.payment.paidAt)}</Row>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                  {b.couponCode ? `Fee waived with coupon ${b.couponCode} (${b.discountPercent}% off)` : "No payment recorded"}
                </Typography>
              )}
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
