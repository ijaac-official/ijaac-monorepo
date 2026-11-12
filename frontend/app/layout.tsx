import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import ThemeRegistry from "./ThemeRegistry";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Box from "@mui/material/Box";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "IJAAC Journal - International Journal of Applied AI & Computing",
  description:
    "A peer-reviewed journal publishing high-quality research in applied computing, data science, and artificial intelligence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body>
        <ThemeRegistry>
          <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Navbar />
            <Box component="main" sx={{ flexGrow: 1 }}>
              {children}
            </Box>
            <Footer />
          </Box>
        </ThemeRegistry>
      </body>
    </html>
  );
}
