import PolicyPage from "@/components/PolicyPage";

export const metadata = { title: "Refund & Cancellation Policy - IJAAC Journal" };

export default function RefundPolicyPage() {
  return (
    <PolicyPage
      title="Refund & Cancellation Policy"
      lastUpdated="12 November 2026"
      sections={[
        {
          heading: "1. No Refunds",
          body: [
            "All manuscript submission fees are non-refundable once payment is confirmed. This applies regardless of the outcome of editorial screening or peer review, including rejection, withdrawal, or any other reason.",
          ],
        },
        {
          heading: "2. Duplicate or Erroneous Charges",
          body: [
            "If you were charged more than once for the same submission due to a technical error, contact ijaac.official@gmail.com with your submission ID and payment reference so we can correct it.",
          ],
        },
        {
          heading: "3. Contact",
          body: ["Questions about this policy can be directed to ijaac.official@gmail.com."],
        },
      ]}
    />
  );
}
