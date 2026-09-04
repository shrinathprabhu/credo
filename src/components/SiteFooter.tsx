import Link from "next/link";
import { CredoMark } from "./Logo";
import { SITE } from "@/lib/site";

const COLUMNS = [
  {
    title: "Use it",
    links: [
      { href: "/new", label: "Share a secret" },
      { href: "/open", label: "Open a secret" },
      { href: "/links", label: "My links" },
    ],
  },
  {
    title: "Understand it",
    links: [
      { href: "/security", label: "Security model" },
      { href: "/faq", label: "Questions" },
      { href: "/#how", label: "How it works" },
    ],
  },
  {
    title: "Small print",
    links: [
      { href: "/terms", label: "Terms of use" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--line)] bg-bg-soft">
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Credo home">
              <CredoMark size={26} idSuffix="ftr" />
              <span className="font-display text-lg font-bold text-ink">Credo</span>
            </Link>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-ink-soft">
              Encrypted in your browser, opened only by the person holding the passphrase.
              No accounts, no tracking, no plaintext anywhere.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-ink-soft transition-colors hover:text-brand"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--line)] pt-6 text-[12px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            Built by{" "}
            <a
              href={SITE.author.url}
              className="font-medium text-ink-soft underline decoration-[var(--line-strong)] underline-offset-4 transition-colors hover:text-brand"
              rel="author noopener"
              target="_blank"
            >
              Shrinath Prabhu
            </a>
            , also one of the people behind{" "}
            <a
              href={SITE.credits.owleye}
              className="font-medium text-ink-soft underline decoration-[var(--line-strong)] underline-offset-4 transition-colors hover:text-brand"
              rel="noopener"
              target="_blank"
            >
              Owleye analytics
            </a>
            .
          </p>
          <p className="flex items-center gap-4">
            <a
              href={SITE.credits.source}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-brand"
              rel="noopener"
              target="_blank"
            >
              <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden>
                <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.33c-2.23.49-2.7-1.07-2.7-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.05-.49.05-.49.81.06 1.24.83 1.24.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.83-2.15-.09-.2-.36-1.02.07-2.13 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.43 1.11.16 1.93.08 2.13.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
              </svg>
              Original source
            </a>
            <span>Credo is open and free to use.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
