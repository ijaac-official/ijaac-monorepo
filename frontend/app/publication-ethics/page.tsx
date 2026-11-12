import PolicyPage from "@/components/PolicyPage";

export const metadata = { title: "Publication Ethics & Copyright - IJAAC Journal" };

export default function PublicationEthicsPage() {
  return (
    <PolicyPage
      title="Publication Ethics & Copyright"
      lastUpdated="12 November 2026"
      sections={[
        {
          heading: "1. Peer Review Process",
          body: [
            "Every submission undergoes an initial editorial screening for scope and quality, followed by peer review by subject-matter reviewers drawn from our reviewer panel. The editorial board makes the final decision to approve, reject, or request revisions based on reviewer feedback.",
          ],
        },
        {
          heading: "2. Originality and Plagiarism",
          body: [
            "Authors must ensure submitted work is original and properly cites all sources. Manuscripts found to contain plagiarized content, fabricated data, or duplicate publication of previously published work will be rejected, and in cases discovered after publication, retracted with a public notice.",
          ],
        },
        {
          heading: "3. Authorship",
          body: [
            "All listed authors must have made a significant contribution to the work and have agreed to its submission. Changes to the author list after submission (additions, removals, or reordering) must be approved in writing by all original authors and the editorial office.",
          ],
        },
        {
          heading: "4. Conflicts of Interest",
          body: [
            "Authors and reviewers must disclose any financial or personal relationships that could be perceived as influencing the research or its review.",
          ],
        },
        {
          heading: "5. Copyright and Licensing",
          body: [
            "Published articles are distributed under a Creative Commons Attribution 4.0 International License (CC BY 4.0). Authors retain copyright of their work and grant the journal the right to publish it as the version of record. Under CC BY 4.0, anyone may share and adapt the published work, provided appropriate credit is given to the original authors.",
          ],
        },
        {
          heading: "6. Corrections and Retractions",
          body: [
            "Significant errors identified after publication will be corrected via a published erratum. Serious ethical violations (plagiarism, data fabrication, duplicate publication) discovered post-publication will result in formal retraction, with the retraction notice linked to the original article.",
          ],
        },
      ]}
    />
  );
}
