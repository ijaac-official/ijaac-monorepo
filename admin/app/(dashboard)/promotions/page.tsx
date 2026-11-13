import Typography from "@mui/material/Typography";
import { defaultSettings, getSettings, listCoupons } from "@ijaac/data-store";
import CouponManager from "@/components/CouponManager";

export const revalidate = 0;

export default async function PromotionsPage() {
  const [coupons, settings] = await Promise.all([listCoupons(), getSettings().catch(() => defaultSettings())]);

  return (
    <>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Promotions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create a percentage-discount coupon with a fixed number of uses. A 100% coupon makes the
        submission free and skips checkout; anything less charges the discounted amount through
        Razorpay. Prices are calculated server-side on every use, never trusted from the client.
        &quot;Stop Immediately&quot; kills a coupon even if uses remain. Coupons can be edited at any time;
        only coupons that have never been used can be deleted.
      </Typography>
      <CouponManager
        initialCoupons={coupons}
        baseFeeInr={Math.round(settings.paperFeeInPaise / 100)}
        bookFeeInr={Math.round(settings.bookFeeInPaise / 100)}
      />
    </>
  );
}
