import { SITE, SITE_ORIGIN, SITE_URL, absoluteUrl } from "./site";

export const organization = {
  "@type": "Organization",
  "@id": `${SITE_URL}#publisher`,
  name: "lowkey.tools",
  url: SITE_ORIGIN,
  logo: absoluteUrl("/icons/icon-512.png"),
  founder: {
    "@type": "Person",
    name: SITE.author.name,
    url: SITE.author.url,
    sameAs: [SITE.author.url, SITE.credits.owleye],
  },
};

export const website = {
  "@type": "WebSite",
  "@id": `${SITE_URL}#website`,
  url: SITE_URL,
  name: SITE.name,
  description: SITE.shortDescription,
  inLanguage: "en",
  publisher: { "@id": `${SITE_URL}#publisher` },
};

export const softwareApplication = {
  "@type": ["SoftwareApplication", "WebApplication"],
  "@id": `${SITE_URL}#app`,
  name: SITE.name,
  alternateName: ["Credo secret sharing", "Credo encrypted vault"],
  url: SITE_URL,
  applicationCategory: "SecurityApplication",
  applicationSubCategory: "Encrypted file and password sharing",
  operatingSystem: "Any modern web browser",
  browserRequirements: "Requires JavaScript and the Web Crypto API",
  description: SITE.description,
  image: [absoluteUrl("/og.png"), absoluteUrl("/og-square.png")],
  screenshot: absoluteUrl("/og.png"),
  softwareVersion: "1.0",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "AES-256-GCM encryption performed in the browser",
    "PBKDF2-HMAC-SHA256 key stretching with 600,000 rounds",
    "Share links that expire automatically",
    "Encrypted notes, passwords, API keys and small files",
    "QR code for every share link",
    "Local only history of the links you created",
    "No account and no tracking",
  ],
  author: { "@type": "Person", name: SITE.author.name, url: SITE.author.url },
  publisher: { "@id": `${SITE_URL}#publisher` },
};

export const howTo = {
  "@type": "HowTo",
  "@id": `${SITE_URL}#howto`,
  name: "How to share a secret with Credo",
  description:
    "Encrypt a note or file in your browser and send a link that expires, without any server ever seeing the contents.",
  totalTime: "PT1M",
  tool: [{ "@type": "HowToTool", name: "A modern web browser" }],
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Write the secret",
      text: "Open Credo and type the note, password or API key you want to send, or attach a small file.",
      url: absoluteUrl("/new"),
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Set a passphrase",
      text: "Choose a passphrase or let Credo generate a strong one. The passphrase never leaves your device.",
      url: absoluteUrl("/new"),
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Pick an expiry",
      text: "Decide how long the link should stay alive, from ten minutes up to thirty days.",
      url: absoluteUrl("/new"),
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Send the link and the passphrase separately",
      text: "Copy the link or scan the QR code. Send the passphrase over a different channel so one intercepted message is never enough.",
      url: absoluteUrl("/new"),
    },
    {
      "@type": "HowToStep",
      position: 5,
      name: "The recipient opens it",
      text: "They open the link, type the passphrase, and their browser decrypts the secret locally.",
      url: absoluteUrl("/open"),
    },
  ],
};

export type FaqEntry = { question: string; answer: string };

export function faqPage(entries: FaqEntry[], id = `${SITE_URL}#faq`) {
  return {
    "@type": "FAQPage",
    "@id": id,
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

export function breadcrumbs(trail: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function graph(...nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
