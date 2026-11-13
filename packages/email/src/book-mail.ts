import type { BookSubmission } from "@ijaac/shared";
import { getFromAddress, getTransporter } from "./transporter";
import { emailLayout } from "./templates/layout";

function escapeHtml(input: string): string {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function adminUrl(): string {
  return (process.env.ADMIN_URL ?? "http://localhost:3001").replace(/\/$/, "");
}

function frontendUrl(): string {
  return (process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Where author replies should go - the editors' inbox, falling back to the sending account. */
function editorialAddress(): string | undefined {
  return process.env.EDITOR_NOTIFICATION_EMAIL || process.env.GMAIL_USER || undefined;
}

async function send(
  to: string,
  mail: { subject: string; html: string },
  extra: { replyTo?: string; attachments?: { filename: string; content: Buffer; contentType: string }[] } = {}
): Promise<void> {
  await getTransporter().sendMail({
    from: getFromAddress(),
    to,
    subject: mail.subject,
    html: mail.html,
    ...(extra.replyTo ? { replyTo: extra.replyTo } : {}),
    ...(extra.attachments ? { attachments: extra.attachments } : {}),
  });
}

const button = (href: string, label: string) =>
  `<p><a href="${href}" style="background:#7a1f2b;color:#fff;padding:10px 20px;text-decoration:none;display:inline-block;">${escapeHtml(label)}</a></p>`;

const titleLine = (b: Pick<BookSubmission, "title" | "subtitle">) =>
  `<p style="font-weight:bold;">${escapeHtml(b.title)}${b.subtitle ? `: ${escapeHtml(b.subtitle)}` : ""}</p>`;

/** Acknowledgement to the author. */
export async function sendBookSubmissionReceivedEmail(book: BookSubmission): Promise<void> {
  await send(
    book.email,
    {
      subject: `Book publication request received: "${book.title}"`,
      html: emailLayout(
        "Book Publication Request Received",
        `<p>Dear ${escapeHtml(book.authorName)},</p>
         <p>Thank you for your book publication request with IJAAC Books:</p>
         ${titleLine(book)}
         <p>IJAAC supports authors in publishing their books internationally, with editorial guidance and
         formatting and preparation of the book for international publication. Published titles are listed on
         the IJAAC Books page.</p>
         <p><b>Next step:</b> our editorial office will contact you by email to collect your manuscript and
         discuss the publication of your book. You do not need to send the manuscript until we contact you.</p>
         <p>Submission ID: <code>${escapeHtml(book.id)}</code></p>
         <p>Regards,<br/>Editorial Office</p>`
      ),
    },
    { replyTo: editorialAddress() }
  );
}

/** Heads-up to the editors - skipped when EDITOR_NOTIFICATION_EMAIL is not configured. */
export async function sendBookSubmissionEditorNotification(book: BookSubmission): Promise<void> {
  const editorEmail = process.env.EDITOR_NOTIFICATION_EMAIL;
  if (!editorEmail) return;
  const paid = book.payment
    ? `Rs ${(book.payment.amountInPaise / 100).toLocaleString("en-IN")} (${escapeHtml(book.payment.paymentId)})`
    : book.couponCode
      ? `Waived via coupon ${escapeHtml(book.couponCode)}`
      : "Not paid";
  await send(
    editorEmail,
    {
      subject: `New book publication request: "${book.title}"`,
      html: emailLayout(
        "New Book Publication Request",
        `<p>A new book publication request has been received. No manuscript file is uploaded online - please
         contact the author by email to collect the manuscript and discuss the publication:</p>
         ${titleLine(book)}
         <p>Author: ${escapeHtml(book.authorName)} (${escapeHtml(book.email)}, ${escapeHtml(book.phone)})<br/>
         Category: ${escapeHtml(book.category ?? "-")}<br/>
         Fee: ${paid}</p>
         ${button(`${adminUrl()}/book-submissions/${book.id}`, "Review in Admin Dashboard")}`
      ),
    },
    { replyTo: book.email }
  );
}

/** Payment receipt with the generated PDF attached. */
export async function sendBookPaymentReceiptEmail(input: {
  to: string;
  authorName: string;
  bookTitle: string;
  amountLabel: string;
  receiptNumber: string;
  receiptPdf: Uint8Array;
}): Promise<void> {
  await send(
    input.to,
    {
      subject: `Payment receipt ${input.receiptNumber} - IJAAC book publication fee`,
      html: emailLayout(
        "Payment Received",
        `<p>Dear ${escapeHtml(input.authorName)},</p>
         <p>We have received your payment of <b>${escapeHtml(input.amountLabel)}</b> towards the book publication
         fee for:</p>
         <p style="font-weight:bold;">${escapeHtml(input.bookTitle)}</p>
         <p>Your receipt (<b>${escapeHtml(input.receiptNumber)}</b>) is attached to this email as a PDF.</p>
         <p>Please note that the publication fee is non-refundable once payment is confirmed.</p>
         <p>Regards,<br/>Editorial Office</p>`
      ),
    },
    {
      replyTo: editorialAddress(),
      attachments: [
        {
          filename: `receipt-${input.receiptNumber}.pdf`,
          content: Buffer.from(input.receiptPdf),
          contentType: "application/pdf",
        },
      ],
    }
  );
}

/** Decision email to the author. */
export async function sendBookSubmissionDecisionEmail(
  book: BookSubmission,
  status: "ACCEPTED" | "REJECTED" | "PUBLISHED"
): Promise<void> {
  const comment = book.reviewComment
    ? `<p><b>Editor comments:</b></p><p style="background:#f4f5f7;padding:12px;">${escapeHtml(book.reviewComment).replace(/\n/g, "<br/>")}</p>`
    : "";
  const content: Record<typeof status, { subject: string; title: string; body: string }> = {
    ACCEPTED: {
      subject: `Your book has been accepted: "${book.title}"`,
      title: "Book Accepted",
      body: `<p>We are pleased to inform you that your book publication request has been <b>accepted</b> by the
             editorial team. We will contact you by email about editorial guidance, formatting and preparation of
             your book for international publication, and listing it on the IJAAC Books page.</p>`,
    },
    REJECTED: {
      subject: `Decision on your book publication request: "${book.title}"`,
      title: "Book Publication Request Decision",
      body: `<p>After careful review, we regret to inform you that your book publication request has <b>not been accepted</b>
             at this time.</p>`,
    },
    PUBLISHED: {
      subject: `Your book is now listed on IJAAC Books: "${book.title}"`,
      title: "Book Published",
      body: `<p>Your book is now listed on the IJAAC Books page.</p>${button(`${frontendUrl()}/books`, "View IJAAC Books")}`,
    },
  };
  const c = content[status];
  await send(
    book.email,
    {
      subject: c.subject,
      html: emailLayout(
        c.title,
        `<p>Dear ${escapeHtml(book.authorName)},</p>
         <p>Regarding your book publication request:</p>
         ${titleLine(book)}
         ${c.body}
         ${comment}
         <p>Regards,<br/>Editorial Office</p>`
      ),
    },
    { replyTo: editorialAddress() }
  );
}
