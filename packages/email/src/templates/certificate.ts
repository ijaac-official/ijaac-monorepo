import { emailLayout } from "./layout";

export interface CertificateEmailOptions {
  /** Public verification page for this author's credential. */
  credentialUrl?: string;
  /** "published" = final typeset article attached; "manuscript" = accepted manuscript attached. */
  paperKind?: "published" | "manuscript";
  /** e.g. "Volume 1, Issue 11 (November 2026)" */
  issueLabel?: string;
  /** False while the paper is approved but not yet published (credential page not live yet). */
  credentialLive?: boolean;
}

export function certificateEmailTemplate(
  authorName: string,
  paperTitle: string,
  options: CertificateEmailOptions = {}
): { subject: string; html: string } {
  const paperLine =
    options.paperKind === "published"
      ? "the final published version of the paper"
      : "a copy of the accepted manuscript";
  const credentialBlock = options.credentialUrl
    ? `<p style="margin:20px 0;">
         <a href="${escapeHtml(options.credentialUrl)}"
            style="display:inline-block;background:#7a1f2b;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:bold;">
           View your verified credential
         </a>
       </p>
       <p style="font-size:12px;color:#666666;">
         Anyone can verify your certificate at:<br/>
         <a href="${escapeHtml(options.credentialUrl)}" style="color:#7a1f2b;">${escapeHtml(options.credentialUrl)}</a>
         ${
           options.credentialLive === false
             ? "<br/>The verification page becomes active once the paper is published online."
             : "<br/>You can also add it to your LinkedIn profile from that page."
         }
       </p>`
    : "";

  return {
    subject: `Your certificate of publication - "${paperTitle}"`,
    html: emailLayout(
      "Certificate of Publication",
      `<p>Dear ${escapeHtml(authorName)},</p>
       <p>Congratulations! Your paper has been accepted for publication in the International Journal of Applied AI &amp; Computing (IJAAC)${
         options.issueLabel ? `, ${escapeHtml(options.issueLabel)}` : ""
       }:</p>
       <p style="font-weight:bold;">${escapeHtml(paperTitle)}</p>
       <p>Please find attached your personal certificate of publication along with ${paperLine}.</p>
       ${credentialBlock}
       <p>Regards,<br/>Editorial Office, IJAAC</p>`
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
