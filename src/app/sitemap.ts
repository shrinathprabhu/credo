import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

const PAGES: [string, MetadataRoute.Sitemap[number]["changeFrequency"], number][] = [
  ["/", "monthly", 1],
  ["/new", "monthly", 0.9],
  ["/open", "monthly", 0.8],
  ["/security", "yearly", 0.7],
  ["/faq", "monthly", 0.7],
  ["/terms", "yearly", 0.3],
  ["/privacy", "yearly", 0.3],
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PAGES.map(([path, changeFrequency, priority]) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency,
    priority,
  }));
}
