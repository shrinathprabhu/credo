import type { NextConfig } from "next";

/**
 * Credo answers on two addresses.
 *
 *   lowkey.tools/credo        the canonical one people use
 *   credo.lowkey.tools/       the Vercel deployment, usable on its own
 *
 * Assets and links are emitted under /credo so the markup is valid on either
 * origin without rewriting response bodies. The base path does that, because in
 * the App Router the prefix is baked into prerendered hrefs and RSC payloads
 * rather than resolved at runtime.
 *
 * The subdomain then rewrites its own root back into the base path, so pages are
 * reachable at credo.lowkey.tools/ and credo.lowkey.tools/new as well.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/credo";
const isProd = process.env.NODE_ENV === "production";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://firestore.googleapis.com https://*.googleapis.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "frame-ancestors 'self' https://lowkey.tools https://*.lowkey.tools",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  basePath,
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Immutable build output. Next already sets this, repeated here so the
        // upstream proxy on lowkey.tools has something explicit to honour.
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:file(favicon.ico|favicon.svg|apple-touch-icon.png|og.png|og-square.png)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=2592000",
          },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=2592000",
          },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // The service worker must never be cached or users get stuck on an old
        // shell, and it needs a root scope so it can control every Credo route.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: `${basePath}/` },
        ],
      },
      {
        source: "/:file(robots.txt|sitemap.xml|llms.txt)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },

  /**
   * There is deliberately no redirect from "/" here. The rewrites in vercel.json
   * serve the root of the subdomain from inside the base path instead.
   *
   * A redirect would loop. Next emits a relative Location, so "/" -> "/credo" on
   * credo.lowkey.tools resolves against whatever host the visitor is actually on.
   * Behind a prefix stripping proxy that is lowkey.tools/credo, which proxies
   * straight back to the subdomain root, which redirects again. Redirects also
   * run before rewrites on Vercel, so the redirect would win and the rewrite
   * below would never fire.
   *
   * Legacy Credenstore paths are listed twice so they work whether the upstream
   * proxy preserves the /credo prefix or strips it.
   */
  async redirects() {
    const legacy = [
      ["/store", "/new"],
      ["/retrieve", "/open"],
      ["/retrieve/:id", "/s/:id"],
      ["/terms-of-use", "/terms"],
    ];

    return [
      ...legacy.map(([source, destination]) => ({
        source,
        destination,
        permanent: true,
      })),
      ...legacy.map(([source, destination]) => ({
        source,
        destination: `${basePath}${destination}`,
        basePath: false as const,
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
