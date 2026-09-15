/** Canonical origin. Share links and SEO tags are built from this. */
export const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_ORIGIN?.replace(/\/+$/, "") ||
  "https://credo.lowkey.tools";

/** Credo is served from the root of its own subdomain, so these are the same. */
export const SITE_URL = SITE_ORIGIN;

export const SITE = {
  name: "Credo",
  tagline: "Send a secret that only the right person can open",
  shortDescription:
    "Credo encrypts notes, credentials and small files in your browser, then hands you a link that expires on its own.",
  description:
    "Credo is a free zero knowledge sharing vault. Your note, password or file is encrypted in your browser with AES-256-GCM before it leaves the device, stored as ciphertext only, and unlocked by whoever has both the link and the passphrase. Links expire automatically and nothing is recoverable without the passphrase.",
  author: {
    name: "Shrinath Prabhu",
    url: "https://shrinath.me",
    x: "https://x.com/shrinath_prabhu",
    xHandle: "@shrinath_prabhu",
  },
  credits: {
    owleye: "https://owleye.dev",
    lowkey: "https://lowkey.tools",
    superfocus: "https://superfocus.lowkey.tools",
    source: "https://github.com/shrinathprabhu/credenstore",
  },
  locale: "en_US",
} as const;

/** Build a full URL with no trailing pathname slash, preserving query and hash. */
export function absoluteUrl(path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${SITE_URL}${clean}`);
  const pathname = url.pathname.replace(/\/+$/, "");
  return `${url.origin}${pathname}${url.search}${url.hash}`;
}

/**
 * Origin used at runtime when producing a share link. Prefers the canonical
 * origin so links always read credo.lowkey.tools, and falls back to whatever
 * host the browser is on during local development.
 */
export function shareBase(): string {
  if (process.env.NEXT_PUBLIC_SITE_ORIGIN) return SITE_URL;
  if (typeof window !== "undefined") return window.location.origin;
  return SITE_URL;
}
