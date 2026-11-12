import PolicyPage from "@/components/PolicyPage";

export const metadata = { title: "Terms & Conditions - IJAAC Journal" };

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms & Conditions"
      lastUpdated="12 November 2026"
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
          heading: "4. Submission Fees",
          body: [
            "A manuscript processing fee is charged at the time of submission to cover editorial screening and processing costs. Fees are described on the submission page and are subject to change. See our Refund & Cancellation Policy for details on when fees may be refunded.",
          ],
        },
        {
          heading: "5. License and Copyright",
          body: [
            "Published papers are made available under a Creative Commons Attribution 4.0 International License (CC BY 4.0). See our Publication Ethics & Copyright policy for details on what this means for authors and readers.",
          ],
        },
        {
          heading: "6. Limitation of Liability",
          body: [
            "The journal and its editorial team make reasonable efforts to ensure the accuracy of published content but are not liable for errors, omissions, or any consequences arising from the use of published research.",
          ],
        },
        {
          heading: "7. Governing Law",
          body: ["These terms are governed by the laws of India."],
        },
        {
          heading: "8. Contact",
          body: ["Questions about these terms can be directed to ijaac.official@gmail.com."],
        },
      ]}
    />
  );
}
