import type { Submission } from "@ijaac/shared";
import { getFromAddress, getTransporter } from "./transporter";
import {
  submissionDecisionTemplate,
  submissionEditorNotificationTemplate,
  submissionReceivedTemplate,
} from "./templates/submission";
import { certificateEmailTemplate } from "./templates/certificate";
import { receiptEmailTemplate } from "./templates/receipt";
import { loginOtpTemplate } from "./templates/login-otp";

export async function sendLoginOtpEmail(to: string, code: string, ttlMinutes: number): Promise<void> {
  const { subject, html } = loginOtpTemplate(code, ttlMinutes);
  await getTransporter().sendMail({ from: getFromAddress(), to, subject, html });
}

export async function sendPaymentReceiptEmail(input: {
  to: string;
  paperTitle: string;
  amountLabel: string;
  receiptNumber: string;
  receiptPdf: Uint8Array;
}): Promise<void> {
  const { subject, html } = receiptEmailTemplate(input.paperTitle, input.amountLabel, input.receiptNumber);
  await getTransporter().sendMail({
    from: getFromAddress(),
    to: input.to,
    subject,
    html,
    attachments: [
      {
        filename: `receipt-${input.receiptNumber}.pdf`,
        content: Buffer.from(input.receiptPdf),
        contentType: "application/pdf",
      },
    ],
  });
}

export async function sendSubmissionReceivedEmail(submission: Submission): Promise<void> {
  const { subject, html } = submissionReceivedTemplate(submission);
  await getTransporter().sendMail({
    from: getFromAddress(),
    to: submission.correspondingEmail,
    subject,
    html,
  });
}

export async function sendSubmissionEditorNotification(submission: Submission): Promise<void> {
  const adminUrl = process.env.ADMIN_URL ?? "http://localhost:3001";
  const editorEmail = process.env.EDITOR_NOTIFICATION_EMAIL;
  if (!editorEmail) return; // optional

  const { subject, html } = submissionEditorNotificationTemplate(
    submission,
    `${adminUrl}/submissions/${submission.id}`
  );
  await getTransporter().sendMail({
    from: getFromAddress(),
    to: editorEmail,
    subject,
    html,
  });
}

export async function sendSubmissionDecisionEmail(
  submission: Submission,
  status: "APPROVED" | "REJECTED"
): Promise<void> {
  const { subject, html } = submissionDecisionTemplate(submission, status);
  await getTransporter().sendMail({
    from: getFromAddress(),
    to: submission.correspondingEmail,
    subject,
    html,
  });
}

export interface CertificateAttachment {
  authorEmail: string;
  authorName: string;
  certificatePdf: Uint8Array;
  manuscript: { buffer: Buffer; fileName: string };
}

export async function sendCertificateEmail(
  paperTitle: string,
  attachment: CertificateAttachment
): Promise<void> {
  const { subject, html } = certificateEmailTemplate(attachment.authorName, paperTitle);
  await getTransporter().sendMail({
    from: getFromAddress(),
    to: attachment.authorEmail,
    subject,
    html,
    attachments: [
      {
        filename: "certificate-of-publication.pdf",
        content: Buffer.from(attachment.certificatePdf),
        contentType: "application/pdf",
      },
      {
        filename: attachment.manuscript.fileName,
        content: attachment.manuscript.buffer,
      },
    ],
  });
}
