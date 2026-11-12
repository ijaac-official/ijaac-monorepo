import PolicyPage from "@/components/PolicyPage";

export const metadata = { title: "Refund & Cancellation Policy - IJAAC Journal" };

export default function RefundPolicyPage() {
  return (
    <PolicyPage
      title="Refund & Cancellation Policy"
      lastUpdated="12 November 2026"
      sections={[
        {
          heading: "1. General Policy",
          body: [
            "The manuscript processing fee covers the cost of initial editorial screening, which begins as soon as a submission is received. As this work begins immediately, submission fees are generally non-refundable once a manuscript has been submitted and payment confirmed.",
          ],
        },
        {
          heading: "2. Exceptions",
          body: [
            "A refund will be issued in the following cases: (a) a duplicate or erroneous payment was charged for the same submission, (b) a technical error on our platform prevented the manuscript from being successfully received despite a successful charge, or (c) the journal is unable to process the submission for reasons entirely attributable to us.",
          ],
        },
        {
          heading: "3. How to Request a Refund",
          body: [
            "Refund requests must be made within 7 days of payment by emailing ijaac.official@gmail.com with your submission ID and payment reference. Approved refunds are processed back to the original payment method within 5-7 business days via Razorpay.",
          ],
        },
        {
          heading: "4. Rejected Submissions",
          body: [
            "The submission fee is not refunded if a manuscript is rejected after editorial or peer review, as the fee covers the cost of that review process regardless of outcome.",
          ],
        },
      ]}
    />
  );
}
