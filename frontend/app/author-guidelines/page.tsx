import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import MuiLink from "@mui/material/Link";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { ARTICLE_TYPES, PUBLICATION_FEE_INR } from "@/lib/journal-content";

export const metadata = pageMetadata({
  title: "Author Guidelines - Manuscript Preparation & Submission",
  description:
    "How to prepare a manuscript for IJAAC: structure, abstract and keyword limits, formatting, APA or IEEE references, figures, PDF/DOC/DOCX files up to 20 MB, plagiarism and AI-tool policies, and what happens after acceptance.",
  path: "/author-guidelines",
});

const TOC: [string, string][] = [
  ["before-you-submit", "Before you submit"],
  ["article-types", "Article types"],
  ["structure", "Manuscript structure"],
  ["title-abstract", "Title, abstract and keywords"],
  ["formatting", "Formatting"],
  ["references", "References"],
  ["figures", "Figures and tables"],
  ["files", "File format and size"],
  ["originality", "Originality and plagiarism"],
  ["ai-tools", "Use of AI tools"],
  ["declarations", "Declarations"],
  ["fee", "Publication fee"],
  ["after-acceptance", "After acceptance"],
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <Box component="section" aria-labelledby={`${id}-h`} sx={{ mb: 5, scrollMarginTop: 96 }} id={id}>
      <Typography id={`${id}-h`} variant="h5" component="h2" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="body1" paragraph sx={{ lineHeight: 1.75 }}>
      {children}
    </Typography>
  );
}

function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <Box component="ul" sx={{ pl: 3, mt: 0, mb: 2, "& li": { mb: 0.75, lineHeight: 1.7 } }}>
      {items.map((item, i) => (
        <Typography component="li" variant="body1" key={i}>
          {item}
        </Typography>
      ))}
    </Box>
  );
}

export default function AuthorGuidelinesPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Author Guidelines", path: "/author-guidelines" }])} />
      <PageHero
        title="Author Guidelines"
        subtitle="Everything you need to prepare and submit a manuscript to IJAAC."
        icon="guidelines"
      />
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={{ xs: 4, md: 6 }}>
          <Grid item xs={12} md={3} sx={{ display: { xs: "none", md: "block" } }}>
            <Box component="nav" aria-label="On this page" sx={{ position: "sticky", top: 96 }}>
              <Typography variant="overline" color="text.secondary">
                On this page
              </Typography>
              <Stack spacing={0.75} sx={{ mt: 1 }}>
                {TOC.map(([id, label]) => (
                  <MuiLink key={id} href={`#${id}`} variant="body2" color="text.primary">
                    {label}
                  </MuiLink>
                ))}
              </Stack>
            </Box>
          </Grid>

          <Grid item xs={12} md={9} sx={{ minWidth: 0 }}>
            <Section id="before-you-submit" title="Before you submit">
              <P>Please check that your manuscript meets these requirements. Submissions that do not may be returned without review.</P>
              <Bullets
                items={[
                  "The work is original and is not published or under consideration by another journal or conference.",
                  "The topic falls within the journal's aims and scope.",
                  "All co-authors have read and approved the final version and agree to its submission.",
                  "The abstract is 100 to 5,000 characters and you have 3 to 10 keywords ready.",
                  "References follow APA or IEEE style consistently.",
                  "The manuscript is a single PDF, DOC or DOCX file of 20 MB or less, with figures and tables embedded.",
                  "Declarations on conflicts of interest, funding, data availability and use of AI tools are included.",
                  "You have the corresponding author's email address and mobile number for the submission form.",
                ]}
              />
              <P>
                The scope is described on the{" "}
                <MuiLink component={Link} href="/about#scope">
                  About page
                </MuiLink>
                , and answers to common questions are in the{" "}
                <MuiLink component={Link} href="/faq">
                  FAQ
                </MuiLink>
                .
              </P>
            </Section>

            <Section id="article-types" title="Article types">
              <Bullets
                items={ARTICLE_TYPES.map((t) => (
                  <>
                    <b>{t.title}.</b> {t.description}
                  </>
                ))}
              />
              <P>There is no fixed word limit. Length should match the contribution - concise, well-organised papers are easier to review and to read.</P>
            </Section>

            <Section id="structure" title="Manuscript structure">
              <P>Original research articles should normally follow this structure. Reviews, short communications and case studies may adapt it, but should keep a clear introduction, body and conclusion.</P>
              <Bullets
                items={[
                  <><b>Title</b> - specific and informative.</>,
                  <><b>Abstract</b> - the problem, approach, main results and their significance, without citations.</>,
                  <><b>Keywords</b> - 3 to 10 terms.</>,
                  <><b>Introduction</b> - motivation, the gap being addressed, and a summary of contributions.</>,
                  <><b>Related work</b> - how the paper relates to existing research.</>,
                  <><b>Methodology</b> - data, models, algorithms, system design and experimental setup in enough detail to reproduce the work.</>,
                  <><b>Results</b> - findings with appropriate baselines, metrics and, where relevant, statistical tests.</>,
                  <><b>Discussion</b> - interpretation, limitations and threats to validity.</>,
                  <><b>Conclusion</b> - main takeaways and directions for future work.</>,
                  <><b>Declarations</b> - conflicts of interest, funding, data and code availability, AI-tool use and ethics approvals (see below).</>,
                  <><b>References</b>, followed by any <b>appendices</b>.</>,
                ]}
              />
              <P>
                Because review is double-blind, please keep author names, affiliations and
                acknowledgements that identify you out of the manuscript body and the file
                properties, and cite your own earlier work in the third person. Author details are
                collected through the submission form.
              </P>
            </Section>

            <Section id="title-abstract" title="Title, abstract and keywords">
              <Bullets
                items={[
                  "Title: at least 10 characters. Avoid unexplained abbreviations.",
                  "Abstract: 100 to 5,000 characters (the submission form enforces this range). For most papers a single paragraph of about 150 to 300 words works best.",
                  "Keywords: between 3 and 10, each at least 2 characters. Choose terms readers would search for, such as the task, method and application domain.",
                ]}
              />
              <P>The title, abstract and keywords you enter in the form are used for the published article page and search, so make sure they match the manuscript.</P>
            </Section>

            <Section id="formatting" title="Formatting">
              <Bullets
                items={[
                  "Write in clear English (British or American spelling, used consistently).",
                  "Use a single-column layout, a readable 11 or 12 pt font, and 1.15 to 1.5 line spacing.",
                  "Number sections, pages, equations, figures and tables.",
                  "Define abbreviations at first use and use SI units.",
                  "Present algorithms as pseudocode and keep long code listings in an appendix or a linked repository.",
                ]}
              />
              <P>You do not need to match the journal's final layout - accepted papers are typeset by the editorial office.</P>
            </Section>

            <Section id="references" title="References">
              <P>
                Use either <b>APA (7th edition)</b> or <b>IEEE</b> style and apply it consistently
                throughout - both in-text citations and the reference list. Do not mix styles.
              </P>
              <Bullets
                items={[
                  "Every in-text citation must appear in the reference list, and vice versa.",
                  "Include DOIs or stable URLs where they exist; for web sources, give the access date.",
                  "Cite datasets, software and pre-trained models you use, not just papers.",
                  "Prefer peer-reviewed sources; cite preprints as preprints.",
                  "Check every reference yourself - citations that do not exist are treated as a serious integrity problem.",
                ]}
              />
            </Section>

            <Section id="figures" title="Figures and tables">
              <Bullets
                items={[
                  "Embed figures and tables in the manuscript file close to where they are first mentioned.",
                  "Number them in order (Figure 1, Table 1) and refer to each one in the text.",
                  "Give each a self-explanatory caption; label axes and units.",
                  "Use legible text and sufficient resolution; prefer colour schemes that remain readable in greyscale and for colour-blind readers.",
                  "Obtain permission to reproduce any figure taken from another source, and cite it.",
                ]}
              />
            </Section>

            <Section id="files" title="File format and size">
              <P>
                Upload one manuscript file in <b>PDF</b>, <b>DOC</b> or <b>DOCX</b> format, no
                larger than <b>20 MB</b>. Supplementary material (large datasets, code) should be
                deposited in a public repository and linked from the manuscript.
              </P>
            </Section>

            <Section id="originality" title="Originality and plagiarism">
              <P>
                Submitted work must be the authors' own and must properly cite the work of others,
                including the authors' own previous publications. Manuscripts may be checked for text
                overlap with published sources. Plagiarism, self-plagiarism without disclosure,
                fabricated or manipulated data, and duplicate submission lead to rejection; if they
                are found after publication, the article is retracted with a public notice.
              </P>
              <P>
                If the paper extends your own earlier conference paper or thesis, disclose this in
                the manuscript (without breaking anonymity, for example by citing it in the third
                person) and explain clearly what is new.
              </P>
            </Section>

            <Section id="ai-tools" title="Use of AI tools">
              <Bullets
                items={[
                  "Generative AI tools (for example ChatGPT, Gemini, Claude or Copilot) cannot be listed as authors, because they cannot take responsibility for the work.",
                  "If you used such tools to write, edit, translate, analyse data or generate code or images, state which tool was used and for what purpose, in the Methods or Declarations section.",
                  "Routine spelling and grammar checking does not need to be disclosed.",
                  "Authors are fully responsible for the accuracy of all content, including any produced with AI assistance. AI tools must not be used to fabricate data, results, images or references.",
                  "Reviewers must not upload manuscripts under review to public AI services, as this breaks confidentiality.",
                ]}
              />
            </Section>

            <Section id="declarations" title="Declarations">
              <P>Include a short declarations section before the references covering:</P>
              <Bullets
                items={[
                  <><b>Conflict of interest</b> - any financial or personal relationship that could be seen as influencing the work, or a statement that there is none.</>,
                  <><b>Funding</b> - funding bodies and grant numbers, or a statement that the work received no specific funding.</>,
                  <><b>Data and code availability</b> - where the data and code can be accessed (repository link), or why they cannot be shared (for example privacy or licensing).</>,
                  <><b>Ethics approval and consent</b> - for research involving human participants, patient data or animals, the approving body and consent procedures.</>,
                  <><b>Use of AI tools</b> - as described above.</>,
                  <><b>Author contributions</b> (recommended) - who did what.</>,
                ]}
              />
              <P>
                The corresponding author handles all communication with the journal and must provide
                a valid email address and mobile number. Changes to the author list after submission
                need the written agreement of all authors.
              </P>
            </Section>

            <Section id="fee" title="Publication fee">
              <P>
                IJAAC charges a publication fee of <b>INR {PUBLICATION_FEE_INR}</b>, paid online at
                the time of submission through our secure payment partner. The fee covers editorial
                handling, peer-review coordination, typesetting, hosting and certificates. There are
                no charges for readers.
              </P>
              <P>
                The fee is <b>non-refundable</b> once payment is confirmed, whatever the outcome of
                screening or review. See the{" "}
                <MuiLink component={Link} href="/refund-policy">
                  refund &amp; cancellation policy
                </MuiLink>
                .
              </P>
            </Section>

            <Section id="after-acceptance" title="After acceptance">
              <Bullets
                items={[
                  <><b>Typesetting</b> - the editorial office formats the accepted manuscript in the journal layout.</>,
                  <><b>Publication</b> - the paper is assigned an article number and published in the next available monthly issue, open access under CC BY 4.0, with its own article page and downloadable PDF.</>,
                  <><b>Certificate</b> - every listed author receives a certificate of publication by email.</>,
                  <><b>Credential page</b> - each author gets a public, shareable credential page with a unique credential ID, and the article has a verification page, so anyone can confirm the publication.</>,
                ]}
              />
              <P>
                Corrections after publication are handled as described in the{" "}
                <MuiLink component={Link} href="/publication-ethics">
                  publication ethics policy
                </MuiLink>
                .
              </P>
            </Section>

            <Paper
              variant="outlined"
              sx={{ p: { xs: 3, md: 4 }, borderLeft: "4px solid", borderLeftColor: "secondary.main" }}
            >
              <Typography variant="h6" component="h2" gutterBottom>
                Ready to submit?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Questions not answered here? See the FAQ or email ijaac.official@gmail.com.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button component={Link} href="/submit-paper" variant="contained" size="large">
                  Proceed to submission
                </Button>
                <Button component={Link} href="/faq" variant="outlined" size="large">
                  Read the FAQ
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
