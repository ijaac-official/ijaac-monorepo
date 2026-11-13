import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import PolicyPage from "@/components/PolicyPage";

export const metadata = pageMetadata({
  title: "Publication Ethics & Copyright",
  description:
    "Publication ethics at IJAAC: peer review, originality and plagiarism, authorship, AI-tool use, conflicts of interest, CC BY 4.0 licensing, corrections and retractions.",
  path: "/publication-ethics",
});

export default function PublicationEthicsPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Publication Ethics", path: "/publication-ethics" }])} />
    <PolicyPage
      title="Publication Ethics & Copyright"
      lastUpdated="13 November 2026"
      sections={[
        {
          heading: "1. Peer Review Process",
          body: [
            "Every submission undergoes an initial editorial screening for scope, completeness and quality, followed by double-blind peer review by at least two subject-matter reviewers drawn from our reviewer panel. The editorial board makes the final decision to accept, request revisions or reject, based on the reviewers' reports.",
          ],
        },
        {
          heading: "2. Responsibilities of Authors",
          body: [
            "Authors must submit original work that is not published or under consideration elsewhere, report their methods and results honestly and in enough detail to be reproduced, cite all sources properly, and disclose funding, conflicts of interest and the use of AI tools. Authors must notify the editorial office promptly if they discover a significant error in their submitted or published work.",
          ],
        },
        {
          heading: "3. Originality and Plagiarism",
          body: [
            "Manuscripts may be checked for text overlap with published sources. Plagiarism (including undisclosed reuse of the authors' own published text), fabricated or manipulated data or images, and duplicate submission or publication lead to rejection. If discovered after publication, they result in retraction with a public notice.",
          ],
        },
        {
          heading: "4. Authorship",
          body: [
            "All listed authors must have made a significant contribution to the conception, execution or interpretation of the work, and must have approved the submitted version. Changes to the author list after submission (additions, removals or reordering) must be agreed in writing by all original authors and approved by the editorial office. AI tools cannot be listed as authors.",
          ],
        },
        {
          heading: "5. Use of AI Tools",
          body: [
            "Authors must disclose any use of generative AI tools in preparing the manuscript, data analysis, code or images, stating which tool was used and for what purpose. Authors remain fully responsible for all content. Reviewers and editors must not upload confidential manuscripts to public AI services.",
          ],
        },
        {
          heading: "6. Responsibilities of Reviewers",
          body: [
            "Reviewers treat manuscripts as confidential, do not use unpublished material for their own research, give objective and constructive feedback, and decline invitations where they have a conflict of interest or lack the relevant expertise. Reviewer identities are not disclosed to authors.",
          ],
        },
        {
          heading: "7. Responsibilities of Editors",
          body: [
            "Editors judge manuscripts on their academic merit and relevance to the journal's scope, without regard to the authors' nationality, institution, gender, religion or political beliefs. Editors keep submissions confidential and do not handle manuscripts in which they have a conflict of interest.",
          ],
        },
        {
          heading: "8. Conflicts of Interest",
          body: [
            "Authors, reviewers and editors must disclose any financial or personal relationship that could be perceived as influencing the research or its review.",
          ],
        },
        {
          heading: "9. Research Involving People or Sensitive Data",
          body: [
            "Research involving human participants, patient data or animals must have approval from an appropriate ethics committee, and informed consent where required. Datasets containing personal information must be handled in line with applicable law and anonymised before publication.",
          ],
        },
        {
          heading: "10. Copyright and Licensing",
          body: [
            "Published articles are distributed under a Creative Commons Attribution 4.0 International License (CC BY 4.0). Authors retain copyright of their work and grant the journal the right to publish it as the version of record. Under CC BY 4.0, anyone may share and adapt the published work, provided appropriate credit is given to the original authors and the journal.",
          ],
        },
        {
          heading: "11. Corrections and Retractions",
          body: [
            "Significant errors identified after publication are corrected through a published correction linked to the original article. Serious ethical violations discovered after publication result in formal retraction, with the retraction notice linked to the original article. The original article remains accessible but is clearly marked.",
          ],
        },
        {
          heading: "12. Reporting Concerns",
          body: [
            "Anyone who suspects misconduct in a manuscript or published article can write to ijaac.official@gmail.com with details. Concerns are handled confidentially and the authors are given an opportunity to respond before any action is taken.",
          ],
        },
      ]}
    />
    </>
  );
}
