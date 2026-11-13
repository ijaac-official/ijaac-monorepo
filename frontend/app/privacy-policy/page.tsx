import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import PolicyPage from "@/components/PolicyPage";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How IJAAC collects, uses, stores and protects the personal information of authors, reviewers and visitors.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Privacy Policy", path: "/privacy-policy" }])} />
    <PolicyPage
      title="Privacy Policy"
      lastUpdated="13 November 2026"
      sections={[
        {
          heading: "1. Information We Collect",
          body: [
            "When you submit a manuscript, we collect the information you provide directly: your name, email address, phone number, institutional affiliation, co-author details, and the manuscript file itself. When you contact us, we collect your name, email, and message content.",
            "When you make a payment, our payment processor (Razorpay) collects and processes your payment details directly - we do not store your card, UPI, or bank account information on our servers.",
          ],
        },
        {
          heading: "2. How We Use Your Information",
          body: [
            "We use the information you provide to process your submission, communicate editorial decisions, issue certificates of publication, and respond to inquiries. We do not sell or rent your personal information to third parties.",
          ],
        },
        {
          heading: "3. Data Storage and Security",
          body: [
            "Manuscripts and related metadata are stored on Amazon Web Services (AWS) infrastructure. Access to unpublished manuscripts and author contact details is restricted to editorial staff. Published papers and limited bibliographic metadata (title, authors, abstract) are made publicly accessible as part of the open-access publication process.",
          ],
        },
        {
          heading: "4. Information That Becomes Public",
          body: [
            "When a paper is published, the title, abstract, keywords, author names and affiliations are shown on the article page, its verification page and each author's credential page. Author email addresses and phone numbers are never published.",
            "Approved reviewers have a public profile showing the details they chose to provide (such as name, photo, designation, affiliation, areas of expertise and profile links) and the number of reviews completed - never which manuscripts they reviewed.",
          ],
        },
        {
          heading: "5. Cookies and Visit Counting",
          body: [
            "We count site visits in aggregate using a first-party cookie and browser session storage, so that a visit is counted once per session. We do not use advertising cookies or sell browsing data. Our payment partner may set its own cookies during checkout.",
          ],
        },
        {
          heading: "6. Third-Party Services",
          body: [
            "We use Razorpay for payment processing, Google (Gmail) for transactional email delivery, and Amazon Web Services for file storage. Each of these providers has its own privacy policy governing how they handle data passed to them.",
          ],
        },
        {
          heading: "7. Data Retention",
          body: [
            "We retain submission records, including rejected submissions, for internal record-keeping and audit purposes. Published papers and their metadata are retained indefinitely as part of the permanent scholarly record.",
          ],
        },
        {
          heading: "8. Your Rights",
          body: [
            "You may request access to, correction of, or deletion of your personal information by contacting us at ijaac.official@gmail.com. Note that bibliographic metadata of already-published papers cannot be deleted, as doing so would compromise the scholarly record - this is standard practice across academic publishing.",
          ],
        },
        {
          heading: "9. Contact",
          body: ["Questions about this policy can be directed to ijaac.official@gmail.com."],
        },
      ]}
    />
    </>
  );
}
