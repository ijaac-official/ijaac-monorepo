import type { Submission } from "@ijaac/shared";
import { emailLayout } from "./layout";

export function submissionReceivedTemplate(submission: Submission): { subject: string; html: string } {
  return {
    subject: `Manuscript received: "${submission.title}"`,
    html: emailLayout(
      "Manuscript Received",
      `<p>Dear Author,</p>
       <p>Thank you for submitting your manuscript titled:</p>
       <p style="font-weight:bold;">${escapeHtml(submission.title)}</p>
       <p>Your submission has been received and is now <b>pending initial screening</b>. You will receive a
       further email once the editorial team has made a decision.</p>
       <p>Submission ID: <code>${submission.id}</code></p>
       <p>Regards,<br/>Editorial Office</p>`
    ),
  };
}

export function submissionEditorNotificationTemplate(
  submission: Submission,
  adminReviewUrl: string
): { subject: string; html: string } {
  return {
    subject: `New submission for review: "${submission.title}"`,
    html: emailLayout(
      "New Manuscript Submitted",
      `<p>A new manuscript has been submitted and is awaiting review:</p>
       <p style="font-weight:bold;">${escapeHtml(submission.title)}</p>
       <p>Corresponding author: ${escapeHtml(submission.correspondingEmail)}</p>
       <p><a href="${adminReviewUrl}" style="background:#0d2b4e;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block;">Review in Admin Dashboard</a></p>`
    ),
  };
}

export function submissionDecisionTemplate(
  submission: Submission,
  status: "APPROVED" | "REJECTED"
): { subject: string; html: string } {
  const isApproved = status === "APPROVED";
  return {
    subject: isApproved
      ? `Your manuscript has been approved: "${submission.title}"`
      : `Decision on your manuscript: "${submission.title}"`,
    html: emailLayout(
      isApproved ? "Manuscript Approved" : "Manuscript Decision",
      `<p>Dear Author,</p>
       <p>Regarding your manuscript:</p>
       <p style="font-weight:bold;">${escapeHtml(submission.title)}</p>
       ${
         isApproved
           ? `<p>We are pleased to inform you that your manuscript has been <b>approved for publication</b>.
              Our editorial team will contact you shortly regarding the publication schedule and any further
              formatting requirements.</p>`
           : `<p>After careful review, we regret to inform you that your manuscript has <b>not been accepted</b>
              for publication at this time.</p>`
       }
       ${
         submission.reviewComment
           ? `<p><b>Reviewer / Editor comments:</b></p><p style="background:#f4f5f7;padding:12px;border-radius:4px;">${escapeHtml(
               submission.reviewComment
             )}</p>`
           : ""
       }
       <p>Regards,<br/>Editorial Office</p>`
    ),
  };
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
