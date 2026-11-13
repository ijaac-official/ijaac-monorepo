import type { Reviewer, Submission } from "@ijaac/shared";
import { getFromAddress, getTransporter } from "./transporter";
import {
  reviewerApplicationEditorTemplate,
  reviewerApplicationReceivedTemplate,
  reviewerApprovedTemplate,
  reviewerAssignmentTemplate,
  reviewerRejectedTemplate,
} from "./templates/reviewer";

function adminUrl(): string {
  return (process.env.ADMIN_URL ?? "http://localhost:3001").replace(/\/$/, "");
}

function frontendUrl(): string {
  return (process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Address reviewers should write to - the editors' inbox, falling back to the sending account. */
function editorialAddress(): string | undefined {
  return process.env.EDITOR_NOTIFICATION_EMAIL || process.env.GMAIL_USER || undefined;
}

async function send(to: string, mail: { subject: string; html: string }, replyTo?: string): Promise<void> {
  await getTransporter().sendMail({
    from: getFromAddress(),
    to,
    subject: mail.subject,
    html: mail.html,
    ...(replyTo ? { replyTo } : {}),
  });
}

export function reviewerProfileUrl(reviewerId: string): string {
  return `${frontendUrl()}/reviewers/${reviewerId}`;
}

/** Acknowledgement to the applicant. */
export async function sendReviewerApplicationReceivedEmail(reviewer: Reviewer): Promise<void> {
  if (!reviewer.email) return;
  await send(reviewer.email, reviewerApplicationReceivedTemplate(reviewer), editorialAddress());
}

/** Heads-up to the editors (EDITOR_NOTIFICATION_EMAIL) - skipped when not configured. */
export async function sendReviewerApplicationEditorNotification(reviewer: Reviewer): Promise<void> {
  const editorEmail = process.env.EDITOR_NOTIFICATION_EMAIL;
  if (!editorEmail) return;
  await send(
    editorEmail,
    reviewerApplicationEditorTemplate(reviewer, `${adminUrl()}/reviewers/applications`),
    reviewer.email
  );
}

export async function sendReviewerApprovedEmail(reviewer: Reviewer): Promise<void> {
  if (!reviewer.email) return;
  await send(reviewer.email, reviewerApprovedTemplate(reviewer, reviewerProfileUrl(reviewer.id)), editorialAddress());
}

export async function sendReviewerRejectedEmail(reviewer: Reviewer, note?: string): Promise<void> {
  if (!reviewer.email) return;
  await send(reviewer.email, reviewerRejectedTemplate(reviewer, note), editorialAddress());
}

/**
 * Invitation to review a paper. Contains title, abstract excerpt and keywords only -
 * the manuscript itself is shared separately by the editorial office.
 */
export async function sendReviewerAssignmentEmail(
  reviewer: Reviewer,
  submission: Pick<Submission, "id" | "title" | "abstract" | "keywords" | "articleNumber">
): Promise<void> {
  if (!reviewer.email) throw new Error(`Reviewer ${reviewer.name} has no email address`);
  const editorial = editorialAddress();
  await send(reviewer.email, reviewerAssignmentTemplate(reviewer, submission, editorial), editorial);
}
