import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import ThemeRegistry from "./ThemeRegistry";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VisitTracker from "@/components/VisitTracker";
import Box from "@mui/material/Box";
import JsonLd from "@/components/JsonLd";
import {
  DEFAULT_OG_IMAGE,
  JOURNAL_DESCRIPTION,
  JOURNAL_NAME,
  JOURNAL_SHORT,
  SITE_URL,
  organizationJsonLd,
  periodicalJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

// Fonts are self-hosted from @fontsource (same Inter + Space Grotesk faces),
// so builds don't depend on Google Fonts. next/font/google in Next 14.2 fails
// on Google's current extension-less font URLs.

const spaceGrotesk = localFont({
  src: [
    { path: "../node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-heading",
  display: "swap",
});

const inter = localFont({
  src: [
    { path: "../node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${JOURNAL_SHORT} - ${JOURNAL_NAME}`,
    template: `%s | ${JOURNAL_SHORT}`,
  },
  description: JOURNAL_DESCRIPTION,
  keywords: [
    "IJAAC",
    JOURNAL_NAME,
    "applied artificial intelligence journal",
    "open access journal",
    "peer-reviewed journal",
    "machine learning",
    "deep learning",
    "data science",
    "computer vision",
    "natural language processing",
    "computing research",
    "call for papers",
  ],
  applicationName: JOURNAL_SHORT,
  authors: [{ name: JOURNAL_NAME, url: SITE_URL }],
  creator: JOURNAL_NAME,
  publisher: JOURNAL_NAME,
  category: "science",
  // No canonical here on purpose: a layout-level canonical is inherited by every
  // page that forgets its own and would point them all at the home page. Each
  // page sets `alternates.canonical` (see pageMetadata in lib/seo.ts).
  openGraph: {
    type: "website",
    siteName: `${JOURNAL_SHORT} - ${JOURNAL_NAME}`,
    title: `${JOURNAL_SHORT} - ${JOURNAL_NAME}`,
    description: JOURNAL_DESCRIPTION,
    locale: "en_IN",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${JOURNAL_SHORT} - ${JOURNAL_NAME}`,
    description: JOURNAL_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: { email: false, address: false, telephone: false },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: "#7a1f2b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd(), periodicalJsonLd()]} />
        <ThemeRegistry>
          <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Navbar />
            <Box component="main" sx={{ flexGrow: 1 }}>
              {children}
            </Box>
            <Footer />
          </Box>
          <VisitTracker />
        </ThemeRegistry>
      </body>
    </html>
  );
}
