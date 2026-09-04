import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { JsonLd } from "@/components/JsonLd";
import { ServiceWorker } from "@/components/ServiceWorker";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { themeBootstrap } from "@/components/theme";
import { ToastProvider } from "@/components/ui/Toast";
import { OG_IMAGE } from "@/lib/metadata";
import { graph, organization, softwareApplication, website } from "@/lib/schema";
import { BASE_PATH, SITE, SITE_ORIGIN, SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: `${SITE.name}, send a secret that only the right person can open`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  generator: "Next.js",
  keywords: [
    "share a password securely",
    "send an encrypted note",
    "one time secret link",
    "self destructing link",
    "share API keys safely",
    "encrypted file sharing",
    "zero knowledge sharing",
    "AES-256-GCM in the browser",
    "client side encryption",
    "credenstore alternative",
  ],
  authors: [{ name: SITE.author.name, url: SITE.author.url }],
  creator: SITE.author.name,
  publisher: "lowkey.tools",
  category: "security",
  alternates: { canonical: SITE_URL },
  // Icons stay same origin so they resolve on lowkey.tools, on the bare
  // subdomain and in local development. Only the social images are absolute,
  // because crawlers fetch those from somewhere else entirely.
  manifest: `${BASE_PATH}/manifest.webmanifest`,
  icons: {
    icon: [
      { url: `${BASE_PATH}/favicon.svg`, type: "image/svg+xml" },
      { url: `${BASE_PATH}/favicon.ico`, sizes: "48x48" },
      { url: `${BASE_PATH}/icons/icon-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${BASE_PATH}/icons/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: `${BASE_PATH}/apple-touch-icon.png`, sizes: "180x180" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    url: SITE_URL,
    title: `${SITE.name}, send a secret that only the right person can open`,
    description: SITE.shortDescription,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name}, zero knowledge sharing`,
    description: SITE.shortDescription,
    images: [OG_IMAGE.url],
  },
  formatDetection: { telephone: false, address: false, email: false },
  appleWebApp: {
    capable: true,
    title: SITE.name,
    statusBarStyle: "black-translucent",
  },
  other: {
    "apple-mobile-web-app-title": SITE.name,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#070b0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrains.variable}`}
    >
      <head>
        {/* Resolves the theme before first paint. React only ever renders this
            on the server, which is exactly where it needs to run. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        {/* Site wide nodes only. Page specific HowTo and FAQ graphs live on the
            pages that actually show that content. */}
        <JsonLd data={graph(organization, website, softwareApplication)} />
        <ToastProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:text-[var(--brand-ink)]"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <ServiceWorker />
        </ToastProvider>
      </body>
    </html>
  );
}
