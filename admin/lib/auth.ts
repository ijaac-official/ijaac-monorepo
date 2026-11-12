import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { otpVerifySchema } from "@ijaac/shared";
import { consumeLoginOtp } from "@ijaac/data-store";
import { otpMatches } from "./otp";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8 hours
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Email code",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        const parsed = otpVerifySchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await consumeLoginOtp(parsed.data.email, (u, storedHash) =>
          otpMatches(u.id, parsed.data.code, storedHash)
        );
        if (!user) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; role?: string }).id = token.id as string;
        (session.user as { id?: string; role?: string }).role = token.role as string;
      }
      return session;
    },
  },
};
