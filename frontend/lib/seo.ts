import type { Metadata } from "next";
import { SUBJECT_AREA_TITLES } from "./journal-content";

/** Canonical public origin, no trailing slash. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ijaac.in").replace(/\/+$/, "");

export const JOURNAL_NAME = "International Journal of Applied AI & Computing";
export const JOURNAL_SHORT = "IJAAC";
export const JOURNAL_EMAIL = "ijaac.official@gmail.com";
export const JOURNAL_TAGLINE = "Peer-reviewed, open-access research in applied artificial intelligence and computing";
export const JOURNAL_DESCRIPTION =
  "IJAAC is a peer-reviewed, open-access monthly journal publishing original research, reviews, short communications and case studies in applied artificial intelligence, machine learning, data science and computing. Articles are published under CC BY 4.0.";
export const LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/";
export const DEFAULT_OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: `${JOURNAL_SHORT} - ${JOURNAL_NAME}` };

/** Subject areas covered by the journal (single source: lib/journal-content.ts). */
export const SUBJECT_AREAS = SUBJECT_AREA_TITLES;

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Standard per-page metadata: title (layout template appends "| IJAAC"),
 * description, canonical, and a full openGraph/twitter block (child openGraph
 * objects replace the parent's, so the shared fields are repeated here).
 */
export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
  ogType = "website",
}: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  ogType?: "website" | "profile";
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: ogType,
      url: path,
      title: `${title} | ${JOURNAL_SHORT}`,
      description,
      siteName: `${JOURNAL_SHORT} - ${JOURNAL_NAME}`,
      locale: "en_IN",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${JOURNAL_SHORT}`,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Trim text to a meta-description length on a word boundary. */
export function clip(text: string, max = 160): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 3);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 40))}...`;
}

/* ---------- JSON-LD builders ---------- */

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const PERIODICAL_ID = `${SITE_URL}/#periodical`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: JOURNAL_NAME,
    alternateName: JOURNAL_SHORT,
    url: SITE_URL,
    logo: absoluteUrl("/logo.png"),
    email: JOURNAL_EMAIL,
    address: { "@type": "PostalAddress", addressCountry: "IN" },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "editorial office",
      email: JOURNAL_EMAIL,
      availableLanguage: ["English"],
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: `${JOURNAL_SHORT} - ${JOURNAL_NAME}`,
    alternateName: JOURNAL_SHORT,
    url: SITE_URL,
    inLanguage: "en",
    publisher: { "@id": ORGANIZATION_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/publications?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function periodicalJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Periodical",
    "@id": PERIODICAL_ID,
    name: JOURNAL_NAME,
    alternateName: JOURNAL_SHORT,
    description: JOURNAL_DESCRIPTION,
    url: SITE_URL,
    inLanguage: "en",
    isAccessibleForFree: true,
    license: LICENSE_URL,
    publisher: { "@id": ORGANIZATION_ID },
    about: SUBJECT_AREAS,
  };
}

/** Periodical reference for nesting (without @context). */
function periodicalRef() {
  return { "@type": "Periodical", "@id": PERIODICAL_ID, name: JOURNAL_NAME, alternateName: JOURNAL_SHORT };
}

export function issuePartOf(volume?: string, issueNumber?: string, issueUrl?: string) {
  const vol = volume
    ? { "@type": "PublicationVolume", volumeNumber: volume, isPartOf: periodicalRef() }
    : periodicalRef();
  if (!issueNumber) return vol;
  return {
    "@type": "PublicationIssue",
    issueNumber,
    ...(issueUrl ? { url: issueUrl } : {}),
    isPartOf: vol,
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  const all = [{ name: "Home", path: "/" }, ...items];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
