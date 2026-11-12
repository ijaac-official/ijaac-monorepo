import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null = null;

/**
 * Gmail SMTP via an App Password (not your normal Gmail password).
 * See README "Email setup" for how to generate one - you need 2-Step
 * Verification turned on for the Google account first, then create an
 * App Password at https://myaccount.google.com/apppasswords.
 */
export function getTransporter(): Transporter {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD are not set");
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  return transporter;
}

export function getFromAddress(): string {
  const name = process.env.MAIL_FROM_NAME ?? "Editorial Office";
  const user = process.env.GMAIL_USER;
  return `"${name}" <${user}>`;
}
