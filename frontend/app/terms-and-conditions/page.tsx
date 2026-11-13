import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import PolicyPage from "@/components/PolicyPage";

export const metadata = pageMetadata({
  title: "Terms & Conditions",
  description:
    "Terms and conditions for submitting to and publishing in the International Journal of Applied AI & Computing (IJAAC).",
  path: "/terms-and-conditions",
});

export default function TermsPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Terms & Conditions", path: "/terms-and-conditions" }])} />
    <PolicyPage
      title="Terms & Conditions"
      lastUpdated="13 November 2026"
      sections={[
        {
          heading: "1. Acceptance of Terms",
          body: [
            "By submitting a manuscript to the International Journal of Applied AI & Computing (IJAAC), you agree to these Terms & Conditions, our Privacy Policy, Refund & Cancellation Policy, and Publication Ethics policy.",
          ],
        },
        {
          heading: "2. Submission Requirements",
          body: [
            "You confirm that the submitted manuscript is original work, has not been published elsewhere, and is not under simultaneous consideration by another journal. All listed co-authors must have consented to the submission and agree to its content.",
          ],
        },
        {
          heading: "3. Editorial Decisions",
          body: [
            "All decisions regarding peer review outcomes, acceptance, and rejection rest solely with the editorial board. Decisions are final and are not subject to appeal, though authors may request clarification of the reasons for rejection.",
          ],
        },
        {
          heading: "4. Publication Fee",
          body: [
            "A publication fee of INR 1,200 is payable online at the time of submission. It covers editorial screening, peer-review coordination, typesetting, hosting and certificates. The fee is non-refundable once payment is confirmed, whatever the outcome of review; see our Refund & Cancellation Policy for how duplicate or erroneous charges are handled.",
          ],
        },
        {
          heading: "5. License and Copyright",
          body: [
            "Published papers are made available under a Creative Commons Attribution 4.0 International License (CC BY 4.0). See our Publication Ethics & Copyright policy for details on what this means for authors and readers.",
          ],
        },
        {
          heading: "6. Use of Published Content",
          body: [
            "Readers may read, download, share and adapt published articles under the terms of CC BY 4.0, provided the original authors and IJAAC are credited. The IJAAC name, logo and website design are not covered by the CC BY licence and may not be used to suggest endorsement.",
          ],
        },
        {
          heading: "7. Website Use",
          body: [
            "You agree not to misuse this website, including by attempting to gain unauthorised access, submitting false information, uploading malicious files, or using automated means to overload the service. We may refuse or remove submissions that breach these terms.",
          ],
        },
        {
          heading: "8. Limitation of Liability",
          body: [
            "The journal and its editorial team make reasonable efforts to ensure the accuracy of published content but are not liable for errors, omissions, or any consequences arising from the use of published research.",
          ],
        },
        {
          heading: "9. Governing Law",
          body: ["These terms are governed by the laws of India."],
        },
        {
          heading: "10. Contact",
          body: ["Questions about these terms can be directed to ijaac.official@gmail.com."],
        },
      ]}
    />
    </>
  );
}
