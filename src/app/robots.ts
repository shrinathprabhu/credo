import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Everything public is fair game for search crawlers and for the
        // assistants that answer questions on their behalf.
        userAgent: "*",
        allow: "/",
        // Share pages are private by construction and hold nothing readable,
        // but there is no reason for them to sit in an index either.
        disallow: ["/s/", "/links", "/offline"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
