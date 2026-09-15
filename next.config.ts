import type { NextConfig } from "next";
import { headers, redirects } from "./hosting/policy.mjs";

/** Local Next.js development uses the same URL and header policy as the Worker. */
const nextConfig: NextConfig = {
  trailingSlash: false,
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  async headers() {
    return headers(process.env.NODE_ENV === "production");
  },
  async redirects() {
    return redirects();
  },
};

export default nextConfig;
