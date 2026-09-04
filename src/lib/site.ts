export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/credo";

/** Canonical origin. Share links and SEO tags are built from this. */
export const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_ORIGIN?.replace(/\/$/, "") ||
  "https://lowkey.tools";

/** Canonical root of the app, for example https://lowkey.tools/credo */
export const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}`;

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
  },
  credits: {
    owleye: "https://owleye.dev",
    source: "https://github.com/shrinathprabhu/credenstore",
  },
  locale: "en_US",
} as const;

/** Build a full URL for a route inside the app. */
export function absoluteUrl(path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${clean === "/" ? "" : clean}`;
}

/**
 * Origin used at runtime when producing a share link. Prefers the canonical
 * origin so a link created on credo.lowkey.tools still reads lowkey.tools,
 * and falls back to whatever host the browser is on during local development.
 */
export function shareBase(): string {
  if (process.env.NEXT_PUBLIC_SITE_ORIGIN) return SITE_URL;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${BASE_PATH}`;
  }
  return SITE_URL;
}
