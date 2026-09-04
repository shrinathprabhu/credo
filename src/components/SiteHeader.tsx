"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/new", label: "Share" },
  { href: "/open", label: "Open" },
  { href: "/links", label: "My links" },
  { href: "/security", label: "Security" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="shrink-0" aria-label="Credo home">
          <Wordmark size={26} idSuffix="hdr" />
        </Link>

        <nav className="ml-auto hidden items-center gap-1 sm:flex" aria-label="Main">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors ${
                  active ? "bg-surface-2 text-ink" : "text-ink-soft hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto sm:ml-2">
          <ThemeToggle />
        </div>
      </div>

      {/* compact nav for narrow screens, scrolls sideways rather than hiding */}
      <nav
        className="flex gap-1 overflow-x-auto border-t border-[var(--line)] px-4 py-2 sm:hidden"
        aria-label="Main"
      >
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                active ? "bg-surface-2 text-ink" : "text-ink-soft"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
