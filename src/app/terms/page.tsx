import { PageHeader, Shell } from "@/components/PageHeader";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Terms of use",
  description:
    "The short, plain terms for using Credo: it is provided as is, free, with no recovery of lost passphrases and no guarantee of availability.",
  path: "/terms",
});

const SECTIONS = [
  {
    title: "What Credo is",
    body: "Credo is a free tool for encrypting a note or a small file in your browser and sharing a link to the encrypted result. It is offered as is, with no warranty of any kind, express or implied.",
  },
  {
    title: "No recovery",
    body: "The passphrase is never stored or transmitted, so it cannot be recovered or reset. If you lose it, the encrypted content is permanently unreadable. Keep your own copy of anything you cannot afford to lose.",
  },
  {
    title: "No guarantee of availability",
    body: "Records may be unavailable during an outage, and expired records are deleted automatically. Credo is not a backup service and must not be used as one.",
  },
  {
    title: "Acceptable use",
    body: "Do not use Credo to store or distribute anything illegal, and do not use it to move material you have no right to hold. Automated abuse, attempts to enumerate records, and attempts to overload the service are not permitted.",
  },
  {
    title: "Your responsibility",
    body: "You choose what to encrypt, who to send it to, and how strong the passphrase is. You are responsible for that choice and for the channels you use to deliver the link and the passphrase.",
  },
  {
    title: "Liability",
    body: "To the fullest extent the law allows, the people who build and host Credo are not liable for any loss, damage or disclosure that follows from using it, including data loss, an expired record, or a secret reaching the wrong person.",
  },
  {
    title: "Changes",
    body: "These terms may change as the tool changes. The current version is always the one on this page.",
  },
];

export default function TermsPage() {
  return (
    <Shell narrow>
      <PageHeader
        eyebrow="Small print"
        title="Terms of use"
        lead="Short, because there is not much to say. Credo is free, it holds nothing it can read, and it makes no promises it cannot keep."
      />
      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold text-ink">{section.title}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{section.body}</p>
          </section>
        ))}
      </div>
      <p className="mt-10 text-[12.5px] text-ink-faint">
        Using Credo means you accept these terms.
      </p>
    </Shell>
  );
}
