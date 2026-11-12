import { getServerSession, type Session } from "next-auth";
import { authOptions } from "./auth";

export async function requireSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  return session?.user ? session : null;
}
