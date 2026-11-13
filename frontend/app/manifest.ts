import type { MetadataRoute } from "next";
import { JOURNAL_DESCRIPTION, JOURNAL_NAME } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `IJAAC - ${JOURNAL_NAME}`,
    short_name: "IJAAC",
    description: JOURNAL_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5f2",
    theme_color: "#7a1f2b",
    lang: "en",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
