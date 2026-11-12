import PolicyPage from "@/components/PolicyPage";

export const metadata = { title: "Privacy Policy - IJAAC Journal" };

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      lastUpdated="12 November 2026"
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
          heading: "4. Third-Party Services",
          body: [
            "We use Razorpay for payment processing, Google (Gmail) for transactional email delivery, and Amazon Web Services for file storage. Each of these providers has its own privacy policy governing how they handle data passed to them.",
          ],
        },
        {
          heading: "5. Data Retention",
          body: [
            "We retain submission records, including rejected submissions, for internal record-keeping and audit purposes. Published papers and their metadata are retained indefinitely as part of the permanent scholarly record.",
          ],
        },
        {
          heading: "6. Your Rights",
          body: [
            "You may request access to, correction of, or deletion of your personal information by contacting us at ijaac.official@gmail.com. Note that bibliographic metadata of already-published papers cannot be deleted, as doing so would compromise the scholarly record - this is standard practice across academic publishing.",
          ],
        },
        {
          heading: "7. Contact",
          body: ["Questions about this policy can be directed to ijaac.official@gmail.com."],
        },
      ]}
    />
  );
}
