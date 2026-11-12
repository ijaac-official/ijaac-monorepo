import Typography from "@mui/material/Typography";
import { getSettings } from "@ijaac/data-store";
import PromotionsForm from "@/components/PromotionsForm";

export const revalidate = 0;

export default async function PromotionsPage() {
  const settings = await getSettings();

  return (
    <>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Promotions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Toggle a free-submission coupon. While enabled, authors who enter the coupon code at
        checkout skip the payment step entirely - the server checks this setting on every
        submission, not just the client.
      </Typography>
      <PromotionsForm initialSettings={settings} />
    </>
  );
}
