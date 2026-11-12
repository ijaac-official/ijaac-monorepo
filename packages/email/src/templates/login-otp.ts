import { emailLayout } from "./layout";

export function loginOtpTemplate(code: string, ttlMinutes: number): { subject: string; html: string } {
  return {
    subject: `${code} is your IJAAC admin sign-in code`,
    html: emailLayout(
      "Admin Sign-in Code",
      `<p>Use this code to sign in to the IJAAC admin dashboard:</p>
       <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#7a1f2b;margin:24px 0;">${code}</p>
       <p>It expires in ${ttlMinutes} minutes and can only be used once.</p>
       <p style="color:#8a8f98;">If you didn't try to sign in, you can ignore this email - nobody can sign in without this code.</p>`
    ),
  };
}
