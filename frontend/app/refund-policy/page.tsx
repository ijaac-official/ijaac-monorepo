import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import PolicyPage from "@/components/PolicyPage";

export const metadata = pageMetadata({
  title: "Refund & Cancellation Policy",
  description:
    "The IJAAC publication fee of INR 1,200 is non-refundable once paid. Read how duplicate or erroneous charges are handled.",
  path: "/refund-policy",
});

export default function RefundPolicyPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Refund Policy", path: "/refund-policy" }])} />
    <PolicyPage
      title="Refund & Cancellation Policy"
      lastUpdated="13 November 2026"
      sections={[
        {
          heading: "1. Publication Fee",
          body: [
            "IJAAC charges a publication fee of INR 1,200 per manuscript, paid online at the time of submission through our payment partner, Razorpay. The fee covers editorial screening, peer-review coordination, typesetting, online hosting of the published article and the issue of certificates. Readers are never charged.",
          ],
        },
        {
          heading: "2. No Refunds",
          body: [
            "The fee is non-refundable once payment is confirmed. This applies whatever the outcome of editorial screening or peer review, including rejection, and also applies if the authors withdraw the manuscript at any stage.",
            "This is because editorial work on a manuscript begins as soon as it is received.",
          ],
        },
        {
          heading: "3. Cancellation and Withdrawal",
          body: [
            "Authors may withdraw a manuscript at any time before publication by writing to ijaac.official@gmail.com from the corresponding author's email address and quoting the submission ID. Withdrawal does not lead to a refund. Once an article is published it becomes part of the scholarly record and can only be corrected or retracted as described in our Publication Ethics policy.",
          ],
        },
        {
          heading: "4. Duplicate or Erroneous Charges",
          body: [
            "If you were charged more than once for the same submission, or your payment was debited but no submission confirmation was received, contact ijaac.official@gmail.com with your submission ID (if any), the payment reference and the date of payment. We will investigate and, where a duplicate or erroneous charge is confirmed, refund the extra amount to the original payment method. Refund processing times depend on your bank and on Razorpay.",
          ],
        },
        {
          heading: "5. Contact",
          body: [
            "Questions about this policy can be directed to ijaac.official@gmail.com.",
          ],
        },
      ]}
    />
    </>
  );
}
