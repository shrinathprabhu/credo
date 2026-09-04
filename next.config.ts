import type { NextConfig } from "next";

/**
 * Credo is deployed to Vercel on credo.lowkey.tools but the canonical address
 * people use is lowkey.tools/credo. Serving the app under the /credo base path
 * on both hosts keeps every asset URL (/credo/_next/...) valid on either origin,
 * so lowkey.tools only needs a straight path preserving rewrite:
 *
 *   { source: "/credo", destination: "https://credo.lowkey.tools/credo" }
 *   { source: "/credo/:path*", destination: "https://credo.lowkey.tools/credo/:path*" }
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

  async redirects() {
    return [
      // Bare credo.lowkey.tools lands on the app instead of a 404.
      { source: "/", destination: basePath, basePath: false, permanent: false },
      // Legacy Credenstore paths keep working if anyone still has them saved.
      { source: "/store", destination: "/new", permanent: true },
      { source: "/retrieve", destination: "/open", permanent: true },
      { source: "/retrieve/:id", destination: "/s/:id", permanent: true },
      { source: "/terms-of-use", destination: "/terms", permanent: true },
    ];
  },
};

export default nextConfig;
