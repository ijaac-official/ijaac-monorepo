import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { getSettings } from "@ijaac/data-store";
import FeesSettingsForm from "@/components/FeesSettingsForm";

export const revalidate = 0;

export default async function SettingsPage() {
  const settings = await getSettings().catch(() => null);
  return (
    <>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Fees &amp; Charges
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 860 }}>
        Set the fees authors pay at checkout. Prices are always calculated on the server from these values, so a
        change takes effect for the next checkout on the public site. Coupons from Promotions can be limited to papers,
        books, or both.
      </Typography>
      {settings ? (
        <FeesSettingsForm initial={settings} neverSaved={new Date(settings.updatedAt).getTime() === 0} />
      ) : (
        <Alert severity="error">Could not load the current fees. Please refresh the page.</Alert>
      )}
    </>
  );
}
