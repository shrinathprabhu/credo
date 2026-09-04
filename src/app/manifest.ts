import type { MetadataRoute } from "next";
import { BASE_PATH, SITE } from "@/lib/site";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name}, zero knowledge sharing`,
    short_name: SITE.name,
    description: SITE.shortDescription,
    id: `${BASE_PATH}/`,
    start_url: `${BASE_PATH}/`,
    scope: `${BASE_PATH}/`,
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "browser"],
    orientation: "portrait-primary",
    background_color: "#070b0a",
    theme_color: "#070b0a",
    categories: ["utilities", "productivity", "security"],
    lang: "en",
    dir: "ltr",
    icons: [
      { src: `${BASE_PATH}/icons/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${BASE_PATH}/icons/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${BASE_PATH}/icons/maskable-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Share a secret",
        short_name: "Share",
        url: `${BASE_PATH}/new`,
        icons: [{ src: `${BASE_PATH}/icons/icon-192.png`, sizes: "192x192" }],
      },
      {
        name: "Open a secret",
        short_name: "Open",
        url: `${BASE_PATH}/open`,
        icons: [{ src: `${BASE_PATH}/icons/icon-192.png`, sizes: "192x192" }],
      },
      {
        name: "My links",
        short_name: "Links",
        url: `${BASE_PATH}/links`,
        icons: [{ src: `${BASE_PATH}/icons/icon-192.png`, sizes: "192x192" }],
      },
    ],
  };
}
