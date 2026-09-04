import type { Metadata } from "next";
import { SITE, SITE_ORIGIN, absoluteUrl } from "./site";

export const OG_IMAGE = {
  url: absoluteUrl("/og.png"),
  width: 1200,
  height: 630,
  alt: "Credo, send a secret that only the right person can open",
};

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  robotsIndex?: boolean;
};

export function pageMetadata({
  title,
  description,
  path,
  keywords,
  robotsIndex = true,
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title,
    description,
    keywords,
    alternates: { canonical: url },
    robots: robotsIndex
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } }
      : { index: false, follow: true },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      locale: SITE.locale,
      url,
      title,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
