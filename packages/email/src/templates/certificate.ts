import { emailLayout } from "./layout";

export function certificateEmailTemplate(
  authorName: string,
  paperTitle: string
): { subject: string; html: string } {
  return {
    subject: `Your certificate of publication - "${paperTitle}"`,
    html: emailLayout(
      "Certificate of Publication",
      `<p>Dear ${escapeHtml(authorName)},</p>
       <p>Congratulations! Your paper has been approved for publication:</p>
       <p style="font-weight:bold;">${escapeHtml(paperTitle)}</p>
       <p>Please find attached your certificate of publication along with a copy of the manuscript.</p>
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
