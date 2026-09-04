"use client";

import {
  ArrowRight,
  Clock,
  Download,
  Eye,
  EyeOff,
  FileText,
  LockOpen,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { PassphraseField } from "./PassphraseField";
import { VaultLoader, type LoaderStep } from "./VaultLoader";
import { Button } from "./ui/Button";
import { CopyButton } from "./ui/CopyButton";
import { Label, inputClass } from "./ui/Field";
import { useToast } from "./ui/Toast";
import { WrongPassphraseError, isCryptoAvailable, open as openEnvelope } from "@/lib/crypto";
import { countdown, formatBytes, formatDateTime } from "@/lib/format";
import { looksLikeShareId, sleep } from "@/lib/id";
import { isConfigured } from "@/lib/firebase";
import { NetworkError, SecretUnavailableError, readSecret } from "@/lib/store";

const STEP_LABELS = [
  "Fetching the sealed box",
  "Stretching your passphrase",
  "Checking the seal",
  "Opening it here, locally",
];

const FLAVOURS = [
  "The server handed over a blob it cannot read.",
  "Rebuilding the key from your passphrase.",
  "If the seal is broken, nothing opens.",
  "Decryption happens in this tab and nowhere else.",
];

type Revealed =
  | { kind: "text"; text: string; expiresAt: number }
  | { kind: "file"; name: string; type: string; bytes: Uint8Array; url: string; expiresAt: number };

export function RevealSecret({ initialId = "" }: { initialId?: string }) {
  const toast = useToast();
  const [id, setId] = useState(initialId);
  const [passphrase, setPassphrase] = useState("");
  const [stepIndex, setStepIndex] = useState(-1);
  const [flavour, setFlavour] = useState(FLAVOURS[0]);
  const [error, setError] = useState<string | null>(null);
  const [gone, setGone] = useState(false);
  const [revealed, setRevealed] = useState<Revealed | null>(null);
  const [masked, setMasked] = useState(false);
  const objectUrl = useRef<string | null>(null);

  const busy = stepIndex >= 0;
  const locked = Boolean(initialId);

  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );

  const steps: LoaderStep[] = STEP_LABELS.map((label, index) => ({
    label,
    done: stepIndex > index,
    active: stepIndex === index,
  }));

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!revealed) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [revealed]);

  const textBytes = useMemo(
    () => (revealed?.kind === "text" ? new TextEncoder().encode(revealed.text).length : 0),
    [revealed],
  );

  async function unlock() {
    setError(null);
    setGone(false);

    const trimmed = id.trim();
    if (!trimmed) {
      setError("Paste the share id or the full Credo link.");
      return;
    }
    if (!looksLikeShareId(extractId(trimmed))) {
      setError("That does not look like a Credo share id.");
      return;
    }
    if (!passphrase) {
      setError("The passphrase is what actually opens this.");
      return;
    }
    if (!isCryptoAvailable()) {
      setError(
        "This browser will not give Credo the Web Crypto API, so nothing can be decrypted here.",
      );
      return;
    }
    if (!isConfigured()) {
      setError("No vault is attached to this deployment, so there is nothing to fetch.");
      return;
    }

    setFlavour(FLAVOURS[Math.floor(Math.random() * FLAVOURS.length)]);
    const startedAt = Date.now();

    try {
      setStepIndex(0);
      const record = await readSecret(extractId(trimmed));

      setStepIndex(1);
      await sleep(120);

      setStepIndex(2);
      await sleep(60);
      const bytes = await openEnvelope(record.encryptedData, passphrase);

      setStepIndex(3);
      const elapsed = Date.now() - startedAt;
      if (elapsed < 1100) await sleep(1100 - elapsed);
      setStepIndex(STEP_LABELS.length);
      await sleep(240);

      if (record.file && record.metadata) {
        const type = record.metadata.type || "application/octet-stream";
        const blob = new Blob([bytes as BlobPart], { type });
        if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
        objectUrl.current = URL.createObjectURL(blob);
        setRevealed({
          kind: "file",
          name: record.metadata.name,
          type,
          bytes,
          url: objectUrl.current,
          expiresAt: record.expiresAt.getTime(),
        });
      } else {
        setRevealed({
          kind: "text",
          text: new TextDecoder().decode(bytes),
          expiresAt: record.expiresAt.getTime(),
        });
      }
      setPassphrase("");
      setStepIndex(-1);
      toast("Opened. It was decrypted in this tab.", "success");
    } catch (caught) {
      setStepIndex(-1);
      if (caught instanceof SecretUnavailableError) {
        setGone(true);
        return;
      }
      const message =
        caught instanceof WrongPassphraseError
          ? "That passphrase does not open this one. Check for a stray space or a wrong case."
          : caught instanceof NetworkError
            ? caught.message
            : caught instanceof Error
              ? caught.message
              : "Something went wrong while opening this.";
      setError(message);
    }
  }

  /* -------------------------------------------------------------- states */

  if (gone) {
    return (
      <div className="card animate-rise p-8 text-center sm:p-12">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--warn)_14%,transparent)] text-warn">
          <Clock size={22} />
        </span>
        <h2 className="mt-5 font-display text-xl font-bold text-ink">
          Nothing here any more
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-ink-soft">
          This share has either passed its expiry, been cleaned up already, or the id is
          wrong. Expired records are refused at the database and then deleted, so there is
          nothing left to recover. Ask the sender for a fresh link.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setGone(false);
              if (!locked) setId("");
            }}
          >
            Try another id
          </Button>
          <Link
            href="/new"
            className="inline-flex items-center gap-1.5 self-center text-[13px] font-medium text-ink-soft transition-colors hover:text-brand"
          >
            Send one yourself
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  if (revealed) {
    const expired = revealed.expiresAt <= now;
    return (
      <div className="animate-rise">
        <div className="card panel-glow overflow-hidden">
          <div className="flex items-center gap-3 border-b border-[var(--line)] bg-[var(--brand-soft)] px-5 py-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-[var(--brand-ink)]">
              <LockOpen size={15} />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-base font-semibold text-ink">Opened</h2>
              <p className="truncate text-[12.5px] text-ink-soft">
                Decrypted in this browser. Nothing was sent back.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {revealed.kind === "text" ? (
              <>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[13px] font-medium text-ink">The secret</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMasked((value) => !value)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-surface-2 px-3 text-[13px] text-ink-soft transition-colors hover:text-ink"
                    >
                      {masked ? <Eye size={15} /> : <EyeOff size={15} />}
                      {masked ? "Show" : "Hide"}
                    </button>
                    <CopyButton value={revealed.text} toastLabel="Secret copied" />
                  </div>
                </div>
                <textarea
                  readOnly
                  value={revealed.text}
                  rows={Math.min(16, Math.max(5, revealed.text.split("\n").length + 1))}
                  className={`${inputClass} resize-y font-mono leading-relaxed ${
                    masked ? "blur-[5px] select-none" : ""
                  }`}
                  onFocus={(event) => event.currentTarget.select()}
                />
                <p className="mt-2 text-[12px] text-ink-faint">{formatBytes(textBytes)} of plaintext</p>
              </>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-brand">
                  <FileText size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink">{revealed.name}</p>
                  <p className="text-[12px] text-ink-faint">
                    {formatBytes(revealed.bytes.byteLength)} · {revealed.type}
                  </p>
                </div>
                <a
                  href={revealed.url}
                  download={revealed.name}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-[var(--brand-ink)] transition-all hover:brightness-110"
                >
                  <Download size={16} />
                  Save the file
                </a>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--line)] pt-4 text-[12.5px] text-ink-faint">
              <span className="inline-flex items-center gap-1.5">
                <Clock size={13} />
                {expired ? (
                  <span className="text-danger">Expired</span>
                ) : (
                  <>
                    Link expires in{" "}
                    <span className="font-mono font-medium text-ink">
                      {countdown(revealed.expiresAt, now)}
                    </span>
                    , on {formatDateTime(revealed.expiresAt)}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              if (objectUrl.current) {
                URL.revokeObjectURL(objectUrl.current);
                objectUrl.current = null;
              }
              setRevealed(null);
              setMasked(false);
              if (!locked) setId("");
            }}
          >
            Open another
          </Button>
          <Link
            href="/new"
            className="inline-flex items-center gap-1.5 self-center text-[13px] font-medium text-ink-soft transition-colors hover:text-brand"
          >
            Send one back
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <VaultLoader open={busy} title="Opening the vault" steps={steps} flavour={flavour} />

      <div className="card panel-glow p-5 sm:p-6">
        <div>
          <Label htmlFor="share-id" hint={locked ? "From your link" : "Or paste the whole link"}>
            Share id
          </Label>
          <input
            id="share-id"
            value={id}
            readOnly={locked}
            onChange={(event) => setId(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") unlock();
            }}
            placeholder="k7Rp2xQm9wLd"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className={`${inputClass} font-mono ${locked ? "text-ink-soft" : ""}`}
          />
        </div>

        <div className="mt-5">
          <PassphraseField
            value={passphrase}
            onChange={setPassphrase}
            label="Passphrase"
            placeholder="The one the sender gave you"
            autoComplete="off"
            showStrength={false}
            allowGenerate={false}
            onEnter={unlock}
          />
        </div>

        {error ? (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[color-mix(in_srgb,var(--danger)_32%,transparent)] bg-[color-mix(in_srgb,var(--danger)_9%,transparent)] p-3.5">
            <TriangleAlert size={15} className="mt-0.5 shrink-0 text-danger" />
            <p className="text-[12.5px] leading-relaxed text-ink">{error}</p>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={unlock} loading={busy} disabled={busy}>
            <LockOpen size={16} />
            Unlock
          </Button>
          <p className="text-[12px] text-ink-faint">
            Wrong passphrases fail cleanly. Nothing partial ever comes out.
          </p>
        </div>
      </div>
    </>
  );
}

/** Accepts a bare id or any Credo link and returns the id part. */
function extractId(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.includes("/")) return trimmed;
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const segments = url.pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] ?? trimmed;
  } catch {
    const segments = trimmed.split("/").filter(Boolean);
    return segments[segments.length - 1] ?? trimmed;
  }
}
