import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { listPaymentRequests, listSubmissions } from "@ijaac/data-store";
import PaymentsManager, { type SubmissionOption } from "@/components/PaymentsManager";

export const revalidate = 0;

export default async function PaymentsPage() {
  const [requests, submissions] = await Promise.all([listPaymentRequests(), listSubmissions()]);

  const submissionOptions: SubmissionOption[] = submissions.map((s) => {
    const corresponding = s.authors.find((a) => a.isCorresponding) ?? s.authors[0];
    return {
      id: s.id,
      title: s.title,
      articleNumber: s.articleNumber,
      authorName: corresponding?.name,
      email: s.correspondingEmail,
      phone: s.correspondingPhone,
    };
  });

  return (
    <>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 1, sm: 2 }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        sx={{ mb: 1 }}
      >
        <Typography variant="h5" fontWeight={600} sx={{ flexGrow: 1 }}>
          Payments
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" color="text.secondary">
            Accept payments with
          </Typography>
          <Box component="img" src="/razorpay-logo.svg" alt="Razorpay" sx={{ height: 22, width: "auto" }} />
        </Stack>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Raise a custom payment request and share it as a link or QR code. A Payment Link accepts UPI,
        cards, netbanking and wallets; a UPI QR code can be scanned by any UPI app. Statuses are pulled
        from Razorpay when you press refresh.
      </Typography>
      <PaymentsManager initialRequests={requests} submissions={submissionOptions} />
    </>
  );
}
