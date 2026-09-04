import { PageHeader, Shell } from "@/components/PageHeader";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Privacy",
  description:
    "What Credo collects, which is close to nothing: an encrypted blob, two timestamps, and for files the original name and type. No accounts, no profiles, no advertising.",
  path: "/privacy",
});

const SECTIONS = [
  {
    title: "What gets stored on the server",
    body: "One record per share, holding the encrypted payload, the time it was created, the time it expires and, for a file share, the original file name and MIME type. That is the complete list. The database rules reject any record with a different shape.",
  },
  {
    title: "What never reaches the server",
    body: "The passphrase, the plaintext, the decrypted file, and any label you give a share for your own list. Encryption and decryption both happen inside your browser.",
  },
  {
    title: "What stays in your browser",
    body: "The history of links you created is written to IndexedDB on your device, with a localStorage fallback. Your theme preference is stored the same way. Neither is transmitted, and clearing site data removes both.",
  },
  {
    title: "Accounts and identity",
    body: "There are none. Credo does not ask for an email address, does not set an identifying cookie and does not build a profile of anyone.",
  },
  {
    title: "Analytics and advertising",
    body: "There is no advertising and no behavioural tracking on this site. The hosting provider keeps standard infrastructure logs, which is the ordinary technical record any web host maintains.",
  },
  {
    title: "Retention",
    body: "Every record has an expiry between ten minutes and thirty days, defaulting to thirty. Nothing is retained beyond that ceiling. After the moment passes the database refuses to serve the record and a scheduled cleanup deletes it. Records cannot be edited after they are written.",
  },
  {
    title: "Third parties",
    body: "Encrypted records are stored in Google Firestore and the site is served from Vercel. Neither can read the contents of a share, because what they hold is ciphertext.",
  },
  {
    title: "Children",
    body: "Credo is not directed at children and collects nothing that would identify anyone, of any age.",
  },
];

export default function PrivacyPage() {
  return (
    <Shell narrow>
      <PageHeader
        eyebrow="Small print"
        title="Privacy"
        lead="The honest version of a privacy policy is usually long because there is a lot to disclose. This one is short for the opposite reason."
      />
      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold text-ink">{section.title}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{section.body}</p>
          </section>
        ))}
      </div>
    </Shell>
  );
}
