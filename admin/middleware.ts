import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    /*
     * Protect everything except: /login, NextAuth API routes, and Next.js
     * internals/static assets.
     */
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico|logo.png|stamp.png|signature.png|certificate-bg.png|icon.png|apple-icon.png|razorpay-logo.svg).*)",
  ],
};
