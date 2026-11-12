import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getAdminUserByEmail, touchLastLogin } from "@ijaac/data-store";

/**
 * Thrown from authorize() to tell the login page to reveal the 6-digit code
 * field and re-submit, instead of a flat "invalid credentials" failure.
 */
export class TotpRequiredError extends Error {
  constructor() {
    super("TOTP_REQUIRED");
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8 hours
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await getAdminUserByEmail(credentials.email);
        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        if (user.twoFactorEnabled && user.totpSecret) {
          if (!credentials.totpCode) throw new TotpRequiredError();
          const codeValid = authenticator.verify({ token: credentials.totpCode, secret: user.totpSecret });
          if (!codeValid) return null;
        }

        await touchLastLogin(user.id).catch(() => undefined);

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
