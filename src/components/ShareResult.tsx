"use client";

import { ArrowRight, Check, Clock, Copy, KeyRound, Link2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { QrCode } from "./ui/QrCode";
import { ShareButton } from "./ui/ShareButton";
import { useCopy } from "./ui/Toast";
import { Button } from "./ui/Button";
import { countdown, formatDateTime } from "@/lib/format";

export type ShareOutcome = {
  id: string;
  url: string;
  passphrase: string;
  expiresAt: number;
  kind: "text" | "file";
  fileName?: string;
};

function Row({
  icon: Icon,
  label,
  value,
  mono = false,
  onCopy,
  copied,
  extra,
}: {
  icon: typeof Link2;
  label: string;
  value: string;
  mono?: boolean;
  onCopy: () => void;
  copied: boolean;
  extra?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-surface-2 p-3.5">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
        <Icon size={12} />
        {label}
      </div>
      <div className="flex items-center gap-2">
        <p
          className={`min-w-0 flex-1 break-all text-[13px] text-ink ${mono ? "font-mono" : ""}`}
        >
          {value}
        </p>
        <button
          type="button"
          onClick={onCopy}
          className={`grid size-9 shrink-0 place-items-center rounded-lg border transition-colors ${
            copied
              ? "border-brand text-brand"
              : "border-[var(--line)] text-ink-soft hover:border-[var(--line-strong)] hover:text-ink"
          }`}
          aria-label={`Copy ${label.toLowerCase()}`}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </button>
        {extra}
      </div>
    </div>
  );
}

export function ShareResult({
  outcome,
  onReset,
}: {
  outcome: ShareOutcome;
  onReset: () => void;
}) {
  const { copy, copiedKey } = useCopy();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const expired = outcome.expiresAt <= now;

  return (
    <div className="animate-rise">
      <div className="card panel-glow overflow-hidden">
        <div className="flex items-center gap-3 border-b border-[var(--line)] bg-[var(--brand-soft)] px-5 py-4">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-[var(--brand-ink)]">
            <Check size={16} strokeWidth={3} />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-ink">Sealed and stored</h2>
            <p className="text-[12.5px] text-ink-soft">
              {outcome.kind === "file"
                ? `${outcome.fileName ?? "Your file"} is encrypted and waiting.`
                : "Your note is encrypted and waiting."}
            </p>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-[1fr_auto] sm:gap-8 sm:p-6">
          <div className="space-y-3">
            <Row
              icon={Link2}
              label="Share link"
              value={outcome.url}
              onCopy={() => copy(outcome.url, outcome.url, "Link copied")}
              copied={copiedKey === outcome.url}
              extra={
                <ShareButton
                  url={outcome.url}
                  compact
                  className="size-9 shrink-0 rounded-lg"
                  text="Open this with the passphrase I am sending separately."
                />
              }
            />
            <Row
              icon={KeyRound}
              label="Passphrase"
              value={outcome.passphrase}
              mono
              onCopy={() =>
                copy(
                  outcome.passphrase,
                  outcome.passphrase,
                  "Passphrase copied. Send it on a different channel.",
                )
              }
              copied={copiedKey === outcome.passphrase}
            />

            <div className="flex items-start gap-2.5 rounded-xl border border-[color-mix(in_srgb,var(--warn)_30%,transparent)] bg-[color-mix(in_srgb,var(--warn)_9%,transparent)] p-3.5">
              <TriangleAlert size={15} className="mt-0.5 shrink-0 text-warn" />
              <p className="text-[12.5px] leading-relaxed text-ink-soft">
                Send the link and the passphrase over two different channels. If both
                arrive in the same thread, whoever reads that thread has the secret.
                Credo cannot recover the passphrase if you lose it.
              </p>
            </div>

            <div className="flex items-center gap-2 text-[12.5px] text-ink-faint">
              <Clock size={13} />
              {expired ? (
                <span className="text-danger">This link has expired.</span>
              ) : (
                <span>
                  Expires in{" "}
                  <span className="font-mono font-medium text-ink">
                    {countdown(outcome.expiresAt, now)}
                  </span>
                  , on {formatDateTime(outcome.expiresAt)}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 sm:pt-1">
            <QrCode value={outcome.url} size={186} fileName={`credo-${outcome.id}.png`} />
            <p className="max-w-[186px] text-center text-[11.5px] leading-snug text-ink-faint">
              Scan to open it on a phone in the room
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={onReset} variant="secondary">
          Share another
        </Button>
        <Link
          href="/links"
          className="inline-flex items-center gap-1.5 self-center text-[13px] font-medium text-ink-soft transition-colors hover:text-brand"
        >
          See all my links
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
