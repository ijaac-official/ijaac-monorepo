/**
 * Editorial copy shared across pages (About, Author Guidelines, FAQ, home).
 * Keep facts here in sync with the policy pages. Do not add claims the journal
 * cannot back up (ISSN, DOI, indexing, impact factor, statistics).
 */

export const PUBLICATION_FEE_INR = "1,200";

export interface ScopeArea {
  title: string;
  description: string;
}

export const SCOPE_AREAS: ScopeArea[] = [
  {
    title: "Machine learning & deep learning",
    description:
      "Supervised, unsupervised, self-supervised and reinforcement learning; neural architectures; optimisation, generalisation and efficient training; benchmarking on real-world data.",
  },
  {
    title: "Natural language processing",
    description:
      "Text classification, information extraction, machine translation, question answering, speech and conversational systems, including work on Indian and other low-resource languages.",
  },
  {
    title: "Computer vision",
    description:
      "Image and video understanding, detection and segmentation, medical and remote-sensing imagery, document analysis, 3D vision and visual inspection systems.",
  },
  {
    title: "Generative AI & large language models",
    description:
      "Applications, fine-tuning and evaluation of LLMs and diffusion models, retrieval-augmented generation, prompt engineering studies, agents, and the limits and risks of generative systems.",
  },
  {
    title: "Data science & analytics",
    description:
      "Data engineering, statistical learning, forecasting, recommender systems, big-data pipelines, visual analytics and decision-support systems.",
  },
  {
    title: "IoT & edge AI",
    description:
      "Sensor networks, embedded and on-device inference, TinyML, model compression, smart infrastructure and cyber-physical systems.",
  },
  {
    title: "Robotics & autonomous systems",
    description:
      "Perception, planning and control, drones and autonomous vehicles, human-robot interaction and simulation-to-real transfer.",
  },
  {
    title: "Cybersecurity & AI",
    description:
      "Intrusion and malware detection, fraud and anomaly detection, privacy-preserving machine learning, adversarial robustness and the security of AI systems themselves.",
  },
  {
    title: "Cloud & high-performance computing",
    description:
      "Distributed and parallel computing, scheduling, serverless and cloud-native architectures, GPU acceleration and MLOps for deploying models at scale.",
  },
  {
    title: "AI in healthcare",
    description:
      "Clinical decision support, medical imaging, health records analytics, public-health modelling and assistive technologies, with appropriate ethics approvals.",
  },
  {
    title: "AI in agriculture",
    description:
      "Crop and soil monitoring, yield prediction, pest and disease detection, precision farming and supply-chain analytics.",
  },
  {
    title: "AI in finance",
    description:
      "Credit scoring, risk modelling, algorithmic trading, fraud detection, financial NLP and regulatory technology.",
  },
  {
    title: "AI in education",
    description:
      "Learning analytics, intelligent tutoring, automated assessment, accessibility tools and studies of AI use in teaching and learning.",
  },
  {
    title: "AI in manufacturing & Industry 4.0",
    description:
      "Predictive maintenance, quality inspection, process optimisation, digital twins and industrial automation.",
  },
  {
    title: "Responsible & explainable AI",
    description:
      "Interpretability, fairness and bias, transparency, accountability, governance and the societal impact of deployed AI.",
  },
];

export const SUBJECT_AREA_TITLES = SCOPE_AREAS.map((a) => a.title);

export interface ArticleType {
  title: string;
  description: string;
}

export const ARTICLE_TYPES: ArticleType[] = [
  {
    title: "Original research article",
    description:
      "A full report of new work: a clearly stated problem, method, experiments or evaluation, and results that others can reproduce. This is the journal's main article type.",
  },
  {
    title: "Review article",
    description:
      "A structured, critical survey of an area - organising the literature, comparing approaches, and identifying open problems. Systematic reviews should describe their search and selection method.",
  },
  {
    title: "Short communication",
    description:
      "A concise report of a focused result, a new dataset or tool, or early findings of clear interest that merit rapid dissemination.",
  },
  {
    title: "Case study",
    description:
      "A detailed account of applying AI or computing methods in a specific real-world setting - an organisation, sector or deployment - including what worked, what did not, and lessons for practitioners.",
  },
];

export interface ReviewStep {
  title: string;
  description: string;
  /** Target time - an aim, not a guarantee. */
  target?: string;
}

export const REVIEW_STEPS: ReviewStep[] = [
  {
    title: "Submission",
    description:
      "The corresponding author submits the manuscript and metadata through the online form and pays the publication fee. An acknowledgement email confirms receipt.",
  },
  {
    title: "Initial editorial screening",
    description:
      "An editor checks that the paper is within scope, complete, formatted according to the author guidelines, and free of obvious originality or ethics problems. Papers that do not pass screening are returned with reasons.",
    target: "Target: about 1 week",
  },
  {
    title: "Double-blind peer review",
    description:
      "The manuscript is sent to at least two reviewers from the reviewer panel with relevant expertise. Reviewers and authors do not learn each other's identities. Reviewers assess originality, technical soundness, clarity and relevance.",
    target: "Target: 3 to 5 weeks",
  },
  {
    title: "Editorial decision",
    description:
      "Based on the reviews, the editors accept the paper, request revisions, or reject it. Authors receive the decision by email with the reviewers' comments. Revised manuscripts may be sent back to the reviewers.",
  },
  {
    title: "Publication",
    description:
      "Accepted papers are typeset in the journal format, assigned an article number and placed in the next available monthly issue. Every author receives a certificate of publication and a verifiable online credential.",
    target: "Target: next monthly issue after acceptance",
  },
];

export interface Faq {
  q: string;
  a: string;
  /** Optional related page shown under the answer on /faq */
  link?: { label: string; href: string };
}

export const FAQS: Faq[] = [
  {
    q: "What does IJAAC publish?",
    a: "IJAAC publishes original research articles, review articles, short communications and case studies in applied artificial intelligence and computing - including machine learning, NLP, computer vision, generative AI, data science, IoT and edge AI, robotics, cybersecurity, cloud and high-performance computing, responsible AI, and AI applications in healthcare, agriculture, finance, education and manufacturing.",
    link: { label: "Aims and scope", href: "/about#scope" },
  },
  {
    q: "Is IJAAC peer reviewed?",
    a: "Yes. Every manuscript that passes initial editorial screening is reviewed double-blind by at least two reviewers with expertise in the topic. The editors make the final decision based on the reviews.",
    link: { label: "Peer-review process", href: "/about#peer-review" },
  },
  {
    q: "How long does the review process take?",
    a: "Our targets are about one week for initial screening and three to five weeks for peer review, after which you receive a decision. These are aims rather than guarantees: the time depends on reviewer availability and on how quickly revisions are returned.",
  },
  {
    q: "How often is the journal published?",
    a: "IJAAC is published monthly. Each calendar year is one volume with twelve issues, and the issue number matches the month. Volume 1 is 2026.",
    link: { label: "Browse the archives", href: "/archives" },
  },
  {
    q: "Is IJAAC open access? Do readers have to pay?",
    a: "IJAAC is fully open access. All published articles are free to read and download, with no subscription or registration, and are published under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).",
  },
  {
    q: "Who owns the copyright of a published article?",
    a: "Authors retain copyright. By publishing with IJAAC, authors license the article under CC BY 4.0, which allows anyone to share and adapt it provided the original authors and the journal are properly credited.",
    link: { label: "Publication ethics & copyright", href: "/publication-ethics" },
  },
  {
    q: "What is the publication fee and when is it paid?",
    a: `The publication fee is INR ${PUBLICATION_FEE_INR}, paid online at the time of submission through our secure payment partner (Razorpay). It covers editorial handling, peer-review coordination, typesetting, online hosting and certificates.`,
  },
  {
    q: "Is the fee refunded if my paper is rejected or withdrawn?",
    a: "No. The fee is non-refundable once payment is confirmed, whatever the outcome of screening or review. If you were charged twice for the same submission because of a technical error, write to ijaac.official@gmail.com with your submission ID and payment reference and we will correct it.",
    link: { label: "Refund & cancellation policy", href: "/refund-policy" },
  },
  {
    q: "Does IJAAC have an ISSN, DOIs or database indexing?",
    a: "IJAAC is a new journal whose first volume is 2026. Published articles receive an IJAAC article number, which is an internal identifier and not a DOI. We do not claim any indexing we do not hold; if the journal obtains an ISSN, DOIs or indexing in future, it will be announced on this website.",
  },
  {
    q: "What file formats can I submit?",
    a: "Upload a single manuscript file in PDF, DOC or DOCX format, up to 20 MB. Figures and tables should be embedded in that file.",
    link: { label: "Author guidelines", href: "/author-guidelines" },
  },
  {
    q: "Which reference style should I use?",
    a: "Use either APA (7th edition) or IEEE style, and apply it consistently throughout the manuscript. Include DOIs or stable URLs for references wherever they exist.",
  },
  {
    q: "Can I use ChatGPT or other AI tools when writing my paper?",
    a: "AI tools may be used for tasks such as language editing or code assistance, but their use must be disclosed in the manuscript, and the authors remain fully responsible for the content. AI tools cannot be listed as authors, and must not be used to fabricate data, results, images or references.",
    link: { label: "AI-tool policy", href: "/author-guidelines#ai-tools" },
  },
  {
    q: "Can I submit a paper that is under review at another journal?",
    a: "No. Manuscripts must be original and must not be published or under consideration elsewhere. Simultaneous submission to more than one journal is treated as a breach of publication ethics.",
  },
  {
    q: "What happens after my paper is accepted?",
    a: "The editorial office typesets the paper in the journal format, assigns it an article number and publishes it in the next available monthly issue. The published PDF is freely available on the website, and each author receives a certificate of publication by email along with a public credential page that anyone can use to verify the publication.",
  },
  {
    q: "How can someone verify my publication or certificate?",
    a: "Every published article has a verification page, and each author has an individual credential page with a unique credential ID. These pages can be shared or added to a professional profile, and anyone can open them to confirm the publication details.",
  },
  {
    q: "How do I become a reviewer?",
    a: "Apply through the Become a Reviewer page with your qualifications and areas of expertise. The editors review each application, and approved reviewers receive a public reviewer profile and invitations for manuscripts in their field.",
    link: { label: "Become a reviewer", href: "/become-a-reviewer" },
  },
  {
    q: "How do I contact the editorial office?",
    a: "Email ijaac.official@gmail.com or use the contact form. Please include your submission ID for questions about a manuscript you have already submitted.",
    link: { label: "Contact us", href: "/contact" },
  },
];
