import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Link from "next/link";
import { Suspense } from "react";
import Skeleton from "@mui/material/Skeleton";
import Image from "next/image";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import type { Metadata } from "next";
import {
  countCompletedReviews,
  getCurrentIssue,
  getSiteStats,
  listPublicationsForMonth,
  listPublicPapers,
  listEditorialBoard,
  listReviewers,
} from "@ijaac/data-store";
import type { Issue } from "@ijaac/shared";
import Carousel from "@/components/Carousel";
import HeroCarousel from "@/components/HeroCarousel";
import MotionCard from "@/components/MotionCard";
import Marquee from "@/components/Marquee";
import PaperCard from "@/components/PaperCard";
import StatsCounters, { type StatItem } from "@/components/StatsCounters";
import IssueCover from "@/components/IssueCover";
import BoardMemberCard from "@/components/BoardMemberCard";
import JsonLd from "@/components/JsonLd";
import ProseText from "@/components/ProseText";
import { JUSTIFIED_SX } from "@/lib/text";
import { SCOPE_AREAS } from "@/lib/journal-content";
import {
  DEFAULT_OG_IMAGE,
  JOURNAL_DESCRIPTION,
  JOURNAL_NAME,
  JOURNAL_SHORT,
  periodicalJsonLd,
} from "@/lib/seo";

export const revalidate = 0;

const HOME_TITLE = `${JOURNAL_SHORT} - ${JOURNAL_NAME} | Open-Access, Peer-Reviewed`;

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: JOURNAL_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: HOME_TITLE,
    description: JOURNAL_DESCRIPTION,
    siteName: `${JOURNAL_SHORT} - ${JOURNAL_NAME}`,
    locale: "en_IN",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: { card: "summary_large_image", title: HOME_TITLE, description: JOURNAL_DESCRIPTION, images: [DEFAULT_OG_IMAGE.url] },
};

const FEATURES = [
  {
    icon: <RateReviewOutlinedIcon fontSize="large" />,
    title: "Double-Blind Peer Review",
    body: "Each manuscript that passes editorial screening is reviewed by at least two subject experts who do not know the authors' identities.",
  },
  {
    icon: <LockOpenOutlinedIcon fontSize="large" />,
    title: "Open Access, CC BY 4.0",
    body: "Every article is free to read and download from the day it is published. Authors keep their copyright.",
  },
  {
    icon: <EventRepeatOutlinedIcon fontSize="large" />,
    title: "Monthly Issues",
    body: "A new issue every month - twelve per volume - so accepted papers are published without long queues.",
  },
  {
    icon: <VerifiedOutlinedIcon fontSize="large" />,
    title: "Verifiable Credentials",
    body: "Every author receives a certificate of publication and a public credential page that anyone can verify.",
  },
];

function issueLabel(issue: Issue) {
  return issue.title ?? `Volume ${issue.volume}, Issue ${issue.number}`;
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h5" component="h2" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

function SectionHeadingWithId({ id, title, subtitle }: { id: string; title: string; subtitle?: string }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography id={id} variant="h5" component="h2" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

async function HomeData() {
  const [currentIssue, monthlyPublications, publicPapers, reviewers, siteStats, reviewCounts] =
    await Promise.all([
      getCurrentIssue().catch(() => null),
      listPublicationsForMonth().catch(() => []),
      listPublicPapers().catch(() => []),
      listReviewers({ activeOnly: true }).catch(() => []),
      getSiteStats().catch(() => ({ visits: 0, updatedAt: "" })),
      countCompletedReviews().catch(() => ({}) as Record<string, number>),
    ]);

  const recentPapers = publicPapers.slice(0, 6);
  const currentIssuePapers = currentIssue
    ? publicPapers.filter((p) => p.issueId === currentIssue.id).slice(0, 6)
    : [];
  const uniqueAuthors = new Set(
    publicPapers.flatMap((p) =>
      p.authors.map((a) => (a.email?.trim() || a.name?.trim() || "").toLowerCase()).filter(Boolean)
    )
  ).size;
  const papersReviewed = Object.values(reviewCounts).reduce((sum, n) => sum + n, 0);

  const monthLabel = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const stats: StatItem[] = [
    { label: "Published Papers", value: publicPapers.length, icon: "papers" },
    { label: "Authors", value: uniqueAuthors, icon: "authors" },
    { label: "Expert Reviewers", value: reviewers.length, icon: "reviewers" },
    { label: "Papers Reviewed", value: papersReviewed, icon: "reviews" },
    { label: "Site Visits", value: siteStats.visits ?? 0, icon: "visits" },
  ];

  return (
    <>
      <StatsCounters items={stats} />

      {currentIssue && (
        <Box sx={{ bgcolor: "background.default", py: { xs: 5, md: 7 } }}>
          <Container maxWidth="lg">
            <Grid container spacing={{ xs: 3, md: 5 }}>
              <Grid item xs={12} md={3}>
                <Box sx={{ maxWidth: { xs: 220, md: "none" }, mx: { xs: "auto", md: 0 } }}>
                  <IssueCover issue={currentIssue} size="md" href="/current-issue" />
                </Box>
              </Grid>
              <Grid item xs={12} md={9}>
                <Typography variant="overline" color="secondary.dark" fontWeight={700}>
                  Current Issue
                </Typography>
                <Typography variant="h4" component="h2" fontWeight={700} sx={{ mb: 1 }}>
                  {issueLabel(currentIssue)}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: currentIssue.description ? 1.5 : 3 }}
                >
                  Volume {currentIssue.volume}, Issue {currentIssue.number}
                  {currentIssue.year ? ` - ${currentIssue.year}` : ""}
                </Typography>
                {currentIssue.description && (
                  <ProseText
                    text={currentIssue.description}
                    variant="body2"
                    color="text.secondary"
                    dense
                    sx={{ mb: 3 }}
                  />
                )}
                {currentIssuePapers.length > 0 ? (
                  <Grid container spacing={2}>
                    {currentIssuePapers.map((paper, i) => (
                      <Grid item xs={12} sm={6} key={paper.id}>
                        <MotionCard delay={(i % 2) * 0.08}>
                          <PaperCard paper={paper} showAbstract={false} />
                        </MotionCard>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography color="text.secondary">
                    Papers for this issue will appear here as they are published.
                  </Typography>
                )}
                <Button component={Link} href="/current-issue" variant="contained" sx={{ mt: 3 }}>
                  View Full Issue -&gt;
                </Button>
              </Grid>
            </Grid>
          </Container>
        </Box>
      )}

      {monthlyPublications.length > 0 && (
        <Box sx={{ bgcolor: "background.paper", py: 6 }}>
          <Container maxWidth="lg">
            <SectionHeading
              title="This Month's Publications"
              subtitle={`Papers published in ${monthLabel}`}
            />
          </Container>
          <Box sx={{ maxWidth: 1400, mx: "auto" }}>
            <Marquee ariaLabel="This month's publications">
              {monthlyPublications.map((paper) => (
                <PaperCard key={paper.id} paper={paper} />
              ))}
            </Marquee>
          </Box>
        </Box>
      )}

      {recentPapers.length > 0 && (
        <Box sx={{ bgcolor: "background.default", py: 6 }}>
          <Container maxWidth="lg">
            <SectionHeading
              title="Recently Published"
              subtitle="The latest peer-reviewed papers across all issues"
            />
            <Carousel>
              {recentPapers.map((paper, i) => (
                <MotionCard key={paper.id} delay={(i % 4) * 0.08}>
                  <PaperCard paper={paper} />
                </MotionCard>
              ))}
            </Carousel>
            <Button component={Link} href="/publications" sx={{ mt: 3 }}>
              View All Publications -&gt;
            </Button>
          </Container>
        </Box>
      )}

    </>
  );
}

const BOARD_ORDER = ["EDITOR_IN_CHIEF", "ASSOCIATE_EDITOR", "MEMBER", "ADVISORY_BOARD"];

async function HomeEditorialBoard() {
  const members = await listEditorialBoard({ activeOnly: true }).catch(() => []);
  if (members.length === 0) return null;
  const sorted = [...members].sort((a, b) => BOARD_ORDER.indexOf(a.role) - BOARD_ORDER.indexOf(b.role));
  const chief = sorted.find((m) => m.role === "EDITOR_IN_CHIEF");
  const others = sorted.filter((m) => m !== chief).slice(0, 6);

  return (
    <Box component="section" aria-labelledby="board-heading" sx={{ bgcolor: "background.paper", py: { xs: 6, md: 8 } }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "flex-end" },
            justifyContent: "space-between",
            gap: 2,
            mb: 3.5,
          }}
        >
          <Box>
            <Typography variant="overline" color="secondary.dark" fontWeight={700}>
              Editorial Board
            </Typography>
            <Typography id="board-heading" variant="h4" component="h2" fontWeight={700} sx={{ mt: 0.5 }}>
              The Editors Behind IJAAC
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: "62ch" }}>
              Academics from leading Indian universities and institutes who oversee peer review and
              uphold the journal&apos;s editorial standards.
            </Typography>
          </Box>
          <Button component={Link} href="/editorial-board" variant="outlined" sx={{ flexShrink: 0 }}>
            View Full Board -&gt;
          </Button>
        </Box>
        <Grid container spacing={3}>
          {chief && (
            <Grid item xs={12}>
              <MotionCard>
                <BoardMemberCard member={chief} featured />
              </MotionCard>
            </Grid>
          )}
          {others.map((m, i) => (
            <Grid item xs={12} sm={6} md={4} key={m.id}>
              <MotionCard delay={(i % 3) * 0.08}>
                <BoardMemberCard member={m} />
              </MotionCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

function HomeDataSkeleton() {
  return (
    <Box aria-busy="true" aria-label="Loading latest publications">
      <Box sx={{ bgcolor: "primary.main", py: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={2}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Grid item xs={6} md key={i}>
                <Skeleton variant="text" height={48} sx={{ bgcolor: "rgba(255,255,255,0.15)" }} />
                <Skeleton variant="text" width="60%" sx={{ bgcolor: "rgba(255,255,255,0.15)" }} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={3}>
            <Skeleton variant="rectangular" sx={{ aspectRatio: "3 / 4", height: "auto" }} />
          </Grid>
          <Grid item xs={12} md={9}>
            <Skeleton variant="text" width={140} />
            <Skeleton variant="text" width="60%" height={44} />
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Grid item xs={12} sm={6} key={i}>
                  <Skeleton variant="rectangular" height={130} />
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

/** The hero, features and about blocks are static and render instantly;
 * only the S3-backed sections stream in behind a skeleton. */
export default function HomePage() {
  return (
    <Box>
      <JsonLd data={periodicalJsonLd()} />
      <Typography
        component="h1"
        sx={{
          position: "absolute",
          width: 1,
          height: 1,
          p: 0,
          m: -1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {JOURNAL_NAME} ({JOURNAL_SHORT}) - a peer-reviewed, open-access journal of applied AI and computing
      </Typography>
      <HeroCarousel />

      <Suspense fallback={<HomeDataSkeleton />}>
        <HomeData />
      </Suspense>

      <Suspense fallback={null}>
        <HomeEditorialBoard />
      </Suspense>

      <Box sx={{ bgcolor: "background.default", py: 7 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {FEATURES.map((item, i) => (
              <Grid item xs={12} sm={6} md={3} key={item.title}>
                <MotionCard delay={i * 0.1}>
                  <Paper variant="outlined" sx={{ p: 3.5, height: "100%" }}>
                    <Box sx={{ color: "primary.main", mb: 1.5 }}>{item.icon}</Box>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {item.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      lang="en"
                      sx={{ ...JUSTIFIED_SX, lineHeight: 1.65 }}
                    >
                      {item.body}
                    </Typography>
                  </Paper>
                </MotionCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box component="section" aria-labelledby="scope-heading" sx={{ bgcolor: "background.paper", py: 6 }}>
        <Container maxWidth="lg">
          <SectionHeadingWithId
            id="scope-heading"
            title="Scope"
            subtitle="IJAAC publishes applied research across artificial intelligence and computing, including:"
          />
          <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1}>
            {SCOPE_AREAS.map((area) => (
              <Chip
                key={area.title}
                label={area.title}
                component={Link}
                href="/about#scope"
                clickable
                variant="outlined"
                color="primary"
                sx={{ fontWeight: 500, bgcolor: "background.paper" }}
              />
            ))}
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 7 }}>
        <Grid container spacing={5} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ position: "relative", width: "100%", height: 340 }}>
              <Image
                src="/stock/indian-researcher-2.jpg"
                alt="Researchers working together on applied AI research"
                sizes="(max-width: 900px) 100vw, 50vw"
                fill
                style={{ objectFit: "cover" }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="overline" color="secondary.dark" fontWeight={700}>
              About IJAAC
            </Typography>
            <Typography variant="h4" component="h2" fontWeight={700} gutterBottom sx={{ mt: 1 }}>
              Bridging Research and Real-World Application
            </Typography>
            <ProseText
              color="text.secondary"
              sx={{ mb: 3 }}
              text={[
                "The International Journal of Applied AI & Computing is a peer-reviewed, open-access journal for research that applies artificial intelligence, machine learning, data science and computing to real problems - from healthcare and agriculture to finance, education and industry.",
                "We publish original research articles, reviews, short communications and case studies. Edited in India and open to authors worldwide, IJAAC publishes a new issue every month, with Volume 1 in 2026.",
              ]}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button component={Link} href="/about" variant="contained">
                Aims &amp; Scope
              </Button>
              <Button component={Link} href="/author-guidelines" variant="outlined">
                Author Guidelines
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
