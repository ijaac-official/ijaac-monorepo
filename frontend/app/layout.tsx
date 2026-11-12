import type { Metadata } from "next";
import ThemeRegistry from "./ThemeRegistry";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Box from "@mui/material/Box";

export const metadata: Metadata = {
  title: "IJAAC Journal - International Journal of Applied AI & Computing",
  description:
    "A peer-reviewed journal publishing high-quality research in applied computing, data science, and artificial intelligence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
