import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminUserById } from "@ijaac/data-store";
import Typography from "@mui/material/Typography";
import TwoFactorSetup from "@/components/TwoFactorSetup";

export const revalidate = 0;

export default async function SecurityPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const user = userId ? await getAdminUserById(userId) : null;

  return (
    <>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Security
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Two-factor authentication restricts admin access to whoever holds this account's
        authenticator app, in addition to the password.
      </Typography>
      <TwoFactorSetup enabled={user?.twoFactorEnabled ?? false} />
    </>
  );
}
