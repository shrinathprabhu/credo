"use client";

import {
  ArrowRight,
  Clock,
  FileText,
  Inbox,
  Link2,
  PenLine,
  QrCode as QrIcon,
  Search,
  Trash,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { QrCode } from "./ui/QrCode";
import { Button } from "./ui/Button";
import { CopyButton } from "./ui/CopyButton";
import { ShareButton } from "./ui/ShareButton";
import { inputClass } from "./ui/Field";
import { useToast } from "./ui/Toast";
import { countdown, formatBytes, relativeTime } from "@/lib/format";
import { clearLinks, listLinks, pruneStale, removeLink, type StoredLink } from "@/lib/vault";

export function LinkVault() {
  const toast = useToast();
  const [links, setLinks] = useState<StoredLink[] | null>(null);
  const [query, setQuery] = useState("");
  const [openQr, setOpenQr] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(async () => {
    setLinks(await listLinks());
  }, []);

  useEffect(() => {
    pruneStale().finally(refresh);
  }, [refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    if (!links) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return links;
    return links.filter(
      (link) =>
        link.label.toLowerCase().includes(needle) ||
        link.id.toLowerCase().includes(needle) ||
        (link.fileName ?? "").toLowerCase().includes(needle),
    );
  }, [links, query]);

  if (links === null) {
    return (
      <div className="space-y-3" aria-busy>
        {[0, 1, 2].map((index) => (
          <div key={index} className="sweep relative h-20 overflow-hidden rounded-2xl bg-surface-2" />
        ))}
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="card p-8 text-center sm:p-12">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-surface-2 text-ink-faint">
          <Inbox size={22} />
        </span>
        <h2 className="mt-5 font-display text-xl font-bold text-ink">No links yet</h2>
        <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-ink-soft">
          Every link you create shows up here, in this browser only. Nothing is fetched from
          the server, because the database refuses to list records at all.
        </p>
        <div className="mt-7">
          <Link
            href="/new"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-[var(--brand-ink)] transition-all hover:brightness-110"
          >
            Share your first secret
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-faint"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or id"
            className={`${inputClass} py-2.5 pl-10`}
            aria-label="Search your links"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-ink-faint hover:text-ink"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          ) : null}
        </div>

        <Button
          variant="danger"
          size="sm"
          onClick={async () => {
            await clearLinks();
            await refresh();
            toast("Local list cleared. The links themselves still work.", "info");
          }}
        >
          <Trash size={14} />
          Clear the list
        </Button>
      </div>

      <ul className="space-y-3">
        {filtered.map((link) => {
          const expired = link.expiresAt <= now;
          const showing = openQr === link.id;

          return (
            <li key={link.id} className="card overflow-hidden">
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                    expired
                      ? "bg-surface-2 text-ink-faint"
                      : "bg-[var(--brand-soft)] text-brand"
                  }`}
                >
                  {link.kind === "file" ? <FileText size={17} /> : <PenLine size={17} />}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink">{link.label}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-faint">
                    <span className="font-mono">{link.id}</span>
                    <span>{relativeTime(link.createdAt, now)}</span>
                    {link.bytes ? <span>{formatBytes(link.bytes)}</span> : null}
                    <span
                      className={`inline-flex items-center gap-1 ${
                        expired ? "text-danger" : "text-ink-faint"
                      }`}
                    >
                      <Clock size={11} />
                      {expired ? "expired" : `${countdown(link.expiresAt, now)} left`}
                    </span>
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <CopyButton
                    value={link.url}
                    label="Link"
                    toastLabel="Link copied"
                    className={expired ? "opacity-60" : ""}
                  />
                  <ShareButton
                    url={link.url}
                    compact
                    text={`${link.label}. Open it with the passphrase I sent you separately.`}
                  />
                  <button
                    type="button"
                    onClick={() => setOpenQr(showing ? null : link.id)}
                    aria-expanded={showing}
                    aria-label={showing ? "Hide the QR code" : "Show the QR code"}
                    className={`grid size-9 place-items-center rounded-lg border transition-colors ${
                      showing
                        ? "border-brand text-brand"
                        : "border-[var(--line)] bg-surface-2 text-ink-soft hover:border-[var(--line-strong)] hover:text-ink"
                    }`}
                  >
                    <QrIcon size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await removeLink(link.id);
                      await refresh();
                      toast("Removed from this browser", "info");
                    }}
                    aria-label="Remove from the list"
                    className="grid size-9 place-items-center rounded-lg border border-[var(--line)] bg-surface-2 text-ink-faint transition-colors hover:border-danger hover:text-danger"
                  >
                    <Trash size={15} />
                  </button>
                </div>
              </div>

              {showing ? (
                <div className="flex flex-col items-center gap-4 border-t border-[var(--line)] bg-surface-2 p-5 sm:flex-row sm:items-center sm:gap-6">
                  <QrCode value={link.url} size={168} fileName={`credo-${link.id}.png`} />
                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <p className="flex items-center justify-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.12em] text-ink-faint sm:justify-start">
                      <Link2 size={12} />
                      Share link
                    </p>
                    <p className="mt-2 font-mono text-[12.5px] break-all text-ink-soft">
                      {link.url}
                    </p>
                    <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">
                      The passphrase is not stored here and is not in this code. Send it
                      separately, the way you did the first time.
                    </p>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-ink-faint">
          Nothing matches {`"${query}"`}.
        </p>
      ) : null}

      <p className="mt-6 text-[12px] leading-relaxed text-ink-faint">
        This list lives in your browser storage. Clearing site data removes it, and the
        links keep working until they expire. Opening Credo on another device shows an
        empty list, which is the intended behaviour.
      </p>
    </div>
  );
}
