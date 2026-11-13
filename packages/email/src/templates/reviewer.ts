import type { Reviewer } from "@ijaac/shared";
import { emailLayout } from "./layout";

type Mail = { subject: string; html: string };

const BUTTON_STYLE =
  "background:#7a1f2b;color:#ffffff;padding:11px 22px;text-decoration:none;display:inline-block;font-weight:bold;";
const BOX_STYLE = "background:#f7f5f2;border-left:3px solid #d4a017;padding:12px 16px;margin:12px 0;";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function firstName(name: string): string {
  return escapeHtml(name.trim().split(/\s+/)[0] || name);
}

function row(label: string, value?: string | number): string {
  if (value === undefined || value === null || value === "") return "";
  return `<tr>
    <td style="padding:4px 12px 4px 0;color:#8a8f98;vertical-align:top;white-space:nowrap;">${label}</td>
    <td style="padding:4px 0;vertical-align:top;">${escapeHtml(String(value))}</td>
  </tr>`;
}

function expertiseList(areas: string[]): string {
  if (!areas.length) return "";
  return areas
    .map(
      (a) =>
        `<span style="display:inline-block;border:1px solid #7a1f2b;color:#7a1f2b;padding:2px 10px;margin:0 6px 6px 0;border-radius:12px;font-size:12px;">${escapeHtml(
          a
        )}</span>`
    )
    .join("");
}

/** Acknowledgement sent to the applicant right after they submit the form. */
export function reviewerApplicationReceivedTemplate(reviewer: Reviewer): Mail {
  return {
    subject: "We received your IJAAC reviewer application",
    html: emailLayout(
      "Application Received",
      `<p>Dear ${firstName(reviewer.name)},</p>
       <p>Thank you for volunteering to join the IJAAC reviewer panel. Your application has been received
       and is now <b>pending review by our editorial team</b>.</p>
       <div style="${BOX_STYLE}">
         <table cellpadding="0" cellspacing="0" style="font-size:14px;">
           ${row("Name", reviewer.name)}
           ${row("Designation", reviewer.designation)}
           ${row("Affiliation", reviewer.affiliation)}
           ${row("Country", reviewer.country)}
         </table>
         <div style="margin-top:8px;">${expertiseList(reviewer.areasOfInterest)}</div>
       </div>
       <p>We usually respond within a few working days. You will receive another email as soon as a
       decision has been made. Once approved, you will get a public reviewer profile on our website and
       a certificate of reviewing for every review you complete.</p>
       <p>Regards,<br/>Editorial Office, IJAAC</p>`
    ),
  };
}

/** Notification to the editors that a new application is waiting. */
export function reviewerApplicationEditorTemplate(reviewer: Reviewer, applicationsUrl: string): Mail {
  return {
    subject: `New reviewer application: ${reviewer.name}`,
    html: emailLayout(
      "New Reviewer Application",
      `<p>A new reviewer application is waiting for your decision:</p>
       <div style="${BOX_STYLE}">
         <table cellpadding="0" cellspacing="0" style="font-size:14px;">
           ${row("Name", reviewer.name)}
           ${row("Email", reviewer.email)}
           ${row("Mobile", reviewer.phone)}
           ${row("Designation", reviewer.designation)}
           ${row("Affiliation", reviewer.affiliation)}
           ${row("Country", reviewer.country)}
           ${row("Qualification", reviewer.qualification)}
           ${row("Experience", reviewer.experienceYears !== undefined ? `${reviewer.experienceYears} years` : undefined)}
           ${row("ORCID", reviewer.orcid)}
           ${row("LinkedIn", reviewer.linkedinUrl)}
         </table>
         <div style="margin-top:8px;">${expertiseList(reviewer.areasOfInterest)}</div>
       </div>
       ${reviewer.motivation ? `<p><b>Motivation:</b></p><p style="white-space:pre-wrap;">${escapeHtml(reviewer.motivation)}</p>` : ""}
       <p><a href="${applicationsUrl}" style="${BUTTON_STYLE}">Review Applications</a></p>`
    ),
  };
}

export function reviewerApprovedTemplate(reviewer: Reviewer, profileUrl: string): Mail {
  return {
    subject: "Welcome to the IJAAC reviewer panel",
    html: emailLayout(
      "Your Application Has Been Approved",
      `<p>Dear ${firstName(reviewer.name)},</p>
       <p>We are delighted to welcome you to the <b>IJAAC reviewer panel</b>. Your application has been
       approved and you are now a <b>Verified IJAAC Reviewer</b>.</p>
       <p>Your public reviewer profile is live. It shows your expertise and the number of reviews you have
       completed (the papers you review always remain confidential).</p>
       <p><a href="${profileUrl}" style="${BUTTON_STYLE}">View Your Reviewer Profile</a></p>
       <p>What happens next:</p>
       <ul>
         <li>When a manuscript matches your expertise, the editorial office will email you an invitation.</li>
         <li>You can accept or decline each invitation by replying to the editorial office.</li>
         <li>For every completed review you will receive a certificate of reviewing.</li>
       </ul>
       <p>If any of your profile details need to change, just let the editorial office know.</p>
       <p>Thank you for supporting rigorous, fair peer review.</p>
       <p>Regards,<br/>Editorial Office, IJAAC</p>`
    ),
  };
}

export function reviewerRejectedTemplate(reviewer: Reviewer, note?: string): Mail {
  return {
    subject: "Update on your IJAAC reviewer application",
    html: emailLayout(
      "Reviewer Application Update",
      `<p>Dear ${firstName(reviewer.name)},</p>
       <p>Thank you for your interest in reviewing for IJAAC and for the time you took to apply.</p>
       <p>After careful consideration, we are unable to add you to the reviewer panel at this time. This is
       often due to the current match between our submissions and a reviewer's areas of expertise, and is
       not a judgement of your scholarly standing.</p>
       ${note ? `<p><b>Note from the editors:</b></p><div style="${BOX_STYLE}white-space:pre-wrap;">${escapeHtml(note)}</div>` : ""}
       <p>You are very welcome to apply again in the future as your research portfolio grows or as the
       journal expands into new areas.</p>
       <p>With best wishes,<br/>Editorial Office, IJAAC</p>`
    ),
  };
}

export interface ReviewInvitationPaper {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  articleNumber?: string;
}

/** Invitation to review a manuscript. Deliberately contains no link to the private file. */
export function reviewerAssignmentTemplate(
  reviewer: Reviewer,
  paper: ReviewInvitationPaper,
  editorialEmail?: string
): Mail {
  const abstract = paper.abstract.length > 700 ? `${paper.abstract.slice(0, 700).trimEnd()}...` : paper.abstract;
  const ref = paper.articleNumber ?? paper.id.slice(0, 8).toUpperCase();
  const contact = editorialEmail
    ? `the editorial office at <a href="mailto:${escapeHtml(editorialEmail)}?subject=${encodeURIComponent(
        `Review ${ref}`
      )}" style="color:#7a1f2b;">${escapeHtml(editorialEmail)}</a>`
    : "the editorial office";
  return {
    subject: `New paper for review: "${paper.title}"`,
    html: emailLayout(
      "You Have Received a New Paper for Review",
      `<p>Dear ${firstName(reviewer.name)},</p>
       <p>Based on your expertise, the IJAAC editors would like to invite you to review the following
       manuscript:</p>
       <div style="${BOX_STYLE}">
         <p style="margin:0 0 8px;font-weight:bold;font-size:15px;">${escapeHtml(paper.title)}</p>
         <p style="margin:0 0 8px;color:#8a8f98;font-size:12px;">Reference: ${escapeHtml(ref)}</p>
         <p style="margin:0 0 8px;white-space:pre-wrap;">${escapeHtml(abstract)}</p>
         ${paper.keywords.length ? `<div>${expertiseList(paper.keywords)}</div>` : ""}
       </div>
       <p><b>Next steps:</b> please write to ${contact} (quoting reference <b>${escapeHtml(ref)}</b>) to let us
       know whether you can accept this review. The editorial office will then share the full manuscript
       with you securely, along with the review guidelines and the expected timeline.</p>
       <p>If you have a conflict of interest or cannot take this on right now, simply let us know and we
       will reassign it - no problem at all.</p>
       <p>This manuscript is confidential. Please do not share its contents or your involvement in its
       review with anyone.</p>
       <p>Thank you for supporting IJAAC.</p>
       <p>Regards,<br/>Editorial Office, IJAAC</p>`
    ),
  };
}
