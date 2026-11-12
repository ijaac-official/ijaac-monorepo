import Typography from "@mui/material/Typography";
import { listCoupons } from "@ijaac/data-store";
import CouponManager from "@/components/CouponManager";

export const revalidate = 0;

export default async function PromotionsPage() {
  const coupons = await listCoupons();

  return (
    <>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Promotions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create a percentage-discount coupon with a fixed number of uses. A 100% coupon makes the
        submission free and skips checkout; anything less charges the discounted amount through
        Razorpay. Prices are calculated server-side on every use, never trusted from the client.
        &quot;Stop Immediately&quot; kills a coupon even if uses remain.
      </Typography>
      <CouponManager
        initialCoupons={coupons}
        baseFeeInr={Number(process.env.SUBMISSION_FEE_INR ?? "1200")}
      />
    </>
  );
}
