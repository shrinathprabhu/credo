import type { MetadataRoute } from "next";
import { BASE_PATH, absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Everything public is fair game for search crawlers and for the
        // assistants that answer questions on their behalf.
        userAgent: "*",
        allow: `${BASE_PATH}/`,
        // Share pages are private by construction and hold nothing readable,
        // but there is no reason for them to sit in an index either. Paths in a
        // robots file are always read from the origin root, so they carry the
        // base path even though this file is served from inside it.
        disallow: [`${BASE_PATH}/s/`, `${BASE_PATH}/links`, `${BASE_PATH}/offline`],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
