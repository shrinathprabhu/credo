import {
  ArrowRight,
  Clock,
  FileText,
  KeyRound,
  QrCode as QrIcon,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { FaqList } from "@/components/FaqList";
import { HeroSeal } from "@/components/HeroSeal";
import { JsonLd } from "@/components/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
import { FAQ, FEATURES, HOW_IT_WORKS } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { breadcrumbs, faqPage, graph, howTo } from "@/lib/schema";

export const metadata = pageMetadata({
  title: "Credo, send a secret that only the right person can open",
  description:
    "Credo encrypts a note, password, API key or small file in your browser with AES-256-GCM, then gives you a link and a QR code that expire on their own. No account, no server that can read it.",
  path: "/",
  keywords: [
    "share a password securely",
    "send an encrypted note",
    "expiring secret link",
    "share API keys safely",
    "client side encryption tool",
  ],
});

const FEATURE_ICONS = [ShieldCheck, Clock, FileText, QrIcon, KeyRound, Sparkles];

const STORED_FIELDS = [
  { name: "encrypted_data", value: "The sealed blob. Unreadable without the passphrase." },
  { name: "created_at", value: "When the record was written." },
  { name: "expires_at", value: "When it stops being served, and then gets deleted." },
  { name: "file", value: "A flag, present only when you attached a file." },
  { name: "metadata", value: "The original file name and type, so the download opens correctly." },
];

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={graph(
          howTo,
          faqPage(FAQ.slice(0, 8)),
          breadcrumbs([{ name: "Credo", path: "/" }]),
        )}
      />

      {/* ------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden">
        <div className="halo" aria-hidden />
        <div className="bg-grid absolute inset-0" aria-hidden />

        <div className="relative mx-auto grid w-full max-w-5xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-surface px-3 py-1.5 text-[12px] font-medium text-ink-soft">
              <span className="size-1.5 rounded-full bg-brand" />
              Zero knowledge, no account, no tracking
            </span>

            <h1 className="mt-5 text-4xl leading-[1.05] font-bold text-ink sm:text-5xl lg:text-[3.4rem]">
              Send a secret that only the right person can open
            </h1>

            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-ink-soft sm:text-[17px]">
              Paste a password, an API key or a whole env file. Credo seals it inside your
              browser with AES-256-GCM and hands you a link that expires on its own. The
              passphrase never leaves your device, so there is nothing on a server for
              anyone to read.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href="/new" size="lg">
                Share a secret
                <ArrowRight size={17} />
              </ButtonLink>
              <ButtonLink href="/open" variant="secondary" size="lg">
                I have a link
              </ButtonLink>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-2 gap-x-6 gap-y-4 border-t border-[var(--line)] pt-6 sm:grid-cols-4">
              {[
                ["AES-256", "GCM sealed"],
                ["600k", "PBKDF2 rounds"],
                ["10 min", "shortest expiry"],
                ["0", "accounts needed"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="font-display text-lg font-bold text-ink">{value}</dt>
                  <dd className="mt-0.5 text-[12px] text-ink-faint">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex justify-center lg:justify-end">
            <HeroSeal />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- how it works */}
      <section id="how" className="mx-auto w-full max-w-5xl scroll-mt-24 px-4 py-16 sm:px-6">
        <header className="max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
            Four steps, and the plaintext never moves
          </h2>
        </header>

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((step, index) => (
            <li
              key={step.title}
              className="card relative p-5 transition-colors hover:border-[var(--line-strong)]"
            >
              <span className="font-display text-[13px] font-bold text-brand">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 text-base font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* --------------------------------------------------------- features */}
      <section className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
        <header className="max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand">
            What you get
          </p>
          <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
            Small tool, deliberate choices
          </h2>
        </header>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = FEATURE_ICONS[index % FEATURE_ICONS.length];
            return (
              <article
                key={feature.title}
                className="card p-5 transition-colors hover:border-[var(--line-strong)]"
              >
                <span className="grid size-9 place-items-center rounded-xl bg-[var(--brand-soft)] text-brand">
                  <Icon size={17} />
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink">{feature.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{feature.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* --------------------------------------------------- what is stored */}
      <section className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
        <div className="card overflow-hidden">
          <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand">
                Full disclosure
              </p>
              <h2 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">
                Everything a Credo record contains
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-ink-soft">
                Five fields, and the database rules refuse anything else. There is no user
                id, no IP log, no recipient list and no copy of the passphrase, because
                none of it is written in the first place.
              </p>
              <Link
                href="/security"
                className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand transition-opacity hover:opacity-80"
              >
                Read the security model
                <ArrowRight size={14} />
              </Link>
            </div>

            <ul className="space-y-px overflow-hidden rounded-xl border border-[var(--line)]">
              {STORED_FIELDS.map((field) => (
                <li
                  key={field.name}
                  className="flex flex-col gap-1 bg-surface-2 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4"
                >
                  <code className="shrink-0 font-mono text-[12.5px] text-brand sm:w-36">
                    {field.name}
                  </code>
                  <span className="text-[13px] leading-relaxed text-ink-soft">{field.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- faq */}
      <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <header className="mb-8">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand">
            Questions
          </p>
          <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
            The things people ask first
          </h2>
        </header>

        <FaqList entries={FAQ.slice(0, 8)} />

        <p className="mt-6 text-[13px] text-ink-faint">
          More of them on the{" "}
          <Link href="/faq" className="font-medium text-brand hover:opacity-80">
            questions page
          </Link>
          .
        </p>
      </section>

      {/* ----------------------------------------------------- closing call */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-8 sm:px-6">
        <div className="card relative overflow-hidden px-6 py-12 text-center sm:px-12">
          <div className="halo" aria-hidden />
          <div className="relative">
            <h2 className="text-3xl font-bold text-ink sm:text-4xl">
              Stop pasting passwords into chat
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft">
              It takes about twenty seconds, and the copy you send stops existing on a
              schedule you choose.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/new" size="lg">
                Share a secret
                <ArrowRight size={17} />
              </ButtonLink>
              <ButtonLink href="/faq" variant="ghost" size="lg">
                Read the questions
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
