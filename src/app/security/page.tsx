import { CircleAlert, KeyRound, Lock, ShieldAlert, ShieldCheck, Timer } from "lucide-react";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader, Shell } from "@/components/PageHeader";
import { pageMetadata } from "@/lib/metadata";
import { breadcrumbs, graph } from "@/lib/schema";
import { SITE_URL, absoluteUrl } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Security model",
  description:
    "Exactly how Credo encrypts a share: AES-256-GCM sealed, Argon2id memory hard key derivation, a fresh salt and nonce per record, what the database is allowed to store, and what this design does not protect you from.",
  path: "/security",
  keywords: [
    "client side encryption security model",
    "AES-256-GCM browser encryption",
    "Argon2id key derivation",
    "zero knowledge secret sharing",
  ],
});

const article = {
  "@type": "TechArticle",
  "@id": `${SITE_URL}/security#article`,
  headline: "The Credo security model",
  description:
    "The cryptography, the storage schema and the threat model behind Credo's encrypted sharing.",
  url: absoluteUrl("/security"),
  inLanguage: "en",
  about: ["client side encryption", "AES-256-GCM", "Argon2id", "zero knowledge sharing"],
  isAccessibleForFree: true,
};

const PIPELINE = [
  {
    icon: KeyRound,
    title: "Key derivation",
    body: "Argon2id stretches the passphrase against a fresh 16 byte random salt to produce a 256 bit key, using 46 MiB of memory per attempt. Memory hardness is the point: a graphics card can run thousands of simple hashes in parallel, but it cannot hold thousands of 46 MiB working sets at once, so mass guessing stops being cheap. All the cost parameters are written into the payload, so raising them later never breaks links already in circulation.",
  },
  {
    icon: Lock,
    title: "Encryption",
    body: "AES-256-GCM seals the bytes using a fresh 12 byte random nonce. GCM is authenticated, so a modified payload fails to open rather than decrypting into something plausible but wrong.",
  },
  {
    icon: ShieldCheck,
    title: "Envelope",
    body: "A magic header, the format version, the round count, the salt and the nonce are packed in front of the ciphertext and the whole thing is base64 encoded. Everything needed to decrypt is present except the one thing that matters, which is the passphrase.",
  },
  {
    icon: Timer,
    title: "Storage and expiry",
    body: "The envelope is written to a single database record along with a creation time and an expiry time. Every share has one, thirty days by default and thirty days at most, and the ceiling is applied in the write path as well as in the picker. Reads are refused once the expiry passes, and a scheduled cleanup deletes the record.",
  },
];

const RULES = [
  "A record can be read one at a time by exact id, and only while its expiry is still in the future.",
  "Listing the collection is refused outright, so nobody can enumerate shares or count them.",
  "Updating and deleting are refused, so a stored record cannot be swapped for a different one.",
  "Creating a record is only accepted with the exact five field shape, which keeps anything unexpected out of the database.",
];

const LIMITS = [
  {
    title: "A weak passphrase is still a weak passphrase",
    body: "Key stretching buys time, it does not create entropy. If the passphrase is a dictionary word, someone with the ciphertext can eventually get through. Use the dice button.",
  },
  {
    title: "Both halves in one thread defeats the point",
    body: "If the link and the passphrase land in the same chat, anyone reading that chat has the secret. Send them over different channels.",
  },
  {
    title: "A compromised browser sees plaintext",
    body: "Encryption in the browser means the browser holds the plaintext for a moment. Malware, a hostile extension or someone watching the screen sits inside that moment.",
  },
  {
    title: "Credo trusts the code you are served",
    body: "Like every web application that encrypts in the client, you are trusting that the page you loaded is the page that was published. The source of the original project is public, and the deployment is static.",
  },
  {
    title: "Reads are not counted",
    body: "The database rules block writes after creation, which also means Credo cannot mark a share as opened. A link works as many times as needed until it expires. For a single handoff, choose the shortest expiry.",
  },
];

export default function SecurityPage() {
  return (
    <>
      <JsonLd
        data={graph(
          article,
          breadcrumbs([
            { name: "Credo", path: "/" },
            { name: "Security model", path: "/security" },
          ]),
        )}
      />
      <Shell>
        <PageHeader
          eyebrow="Security"
          title="What actually happens to your secret"
          lead="No hand waving. This is the full pipeline, the exact storage schema, and an honest list of the things this design does not protect you from."
        />

        <section className="space-y-4">
          {PIPELINE.map((stage, index) => (
            <article key={stage.title} className="card flex gap-4 p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-brand">
                <stage.icon size={18} />
              </span>
              <div>
                <h2 className="text-base font-semibold text-ink">
                  <span className="mr-2 font-mono text-[12px] text-brand">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {stage.title}
                </h2>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{stage.body}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-ink">What the database is allowed to do</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
            The rules are enforced by Firestore itself, not by the interface, so they hold
            even if someone talks to the database directly with their own script.
          </p>
          <ul className="mt-5 space-y-2.5">
            {RULES.map((rule) => (
              <li key={rule} className="flex gap-3 text-[13.5px] leading-relaxed text-ink-soft">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-brand" />
                {rule}
              </li>
            ))}
          </ul>

          <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--line)] bg-surface-2">
            <div className="border-b border-[var(--line)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
              The whole record
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-ink-soft">
{`{
  encrypted_data: string   // base64 envelope, unreadable without the passphrase
  created_at:     timestamp
  expires_at:     timestamp
  file:           boolean  // present only for file shares
  metadata:       { name, type }  // present only for file shares
}`}
            </pre>
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-ink-faint">
            No user id. No IP address. No recipient. No passphrase, no hash of one, and no
            hint. A file share does reveal its original name and MIME type, so avoid
            putting anything sensitive in a file name.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-ink">
            <ShieldAlert size={22} className="text-warn" />
            What this does not protect you from
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
            Any tool that claims to have no weaknesses is hiding them. These are the ones that matter here.
          </p>
          <div className="mt-5 space-y-3">
            {LIMITS.map((limit) => (
              <article key={limit.title} className="card p-5">
                <h3 className="flex items-start gap-2.5 text-[15px] font-semibold text-ink">
                  <CircleAlert size={16} className="mt-0.5 shrink-0 text-warn" />
                  {limit.title}
                </h3>
                <p className="mt-2 pl-[26px] text-[13.5px] leading-relaxed text-ink-soft">
                  {limit.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-[var(--line)] bg-surface-2 p-6">
          <h2 className="text-lg font-semibold text-ink">
            A note for people arriving from Credenstore
          </h2>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-soft">
            The earlier version of this tool used TripleSec, which stacks three ciphers.
            The cascade is the memorable part, but it is not where the security of a tool
            like this lives. The only secret here is a passphrase a person chose, so what
            matters is the cost of one guess to somebody holding the ciphertext, and that
            is set by the key derivation function rather than by the number of ciphers.
            A cascade guards against a future break in AES-256, which nobody has. A weak
            derivation function is exploitable today with a rented graphics card. So the
            cipher is one well studied authenticated mode running in the browser&apos;s
            own native code, and the effort went into Argon2id instead.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-ink">Reporting something</h2>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-soft">
            If you find a flaw, please report it rather than publishing it first. The
            fastest route is a message through{" "}
            <a
              href="https://shrinath.me"
              target="_blank"
              rel="noopener"
              className="font-medium text-brand hover:opacity-80"
            >
              shrinath.me
            </a>
            . Fixes are shipped quietly and quickly.
          </p>
          <p className="mt-4 text-[13px] text-ink-faint">
            Still curious?{" "}
            <Link href="/faq" className="font-medium text-brand hover:opacity-80">
              The questions page
            </Link>{" "}
            covers the practical side.
          </p>
        </section>
      </Shell>
    </>
  );
}
