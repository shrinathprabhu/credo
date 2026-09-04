"use client";

import {
  FileUp,
  Info,
  Lock,
  Paperclip,
  PenLine,
  Timer,
  TriangleAlert,
  X,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { PassphraseField } from "./PassphraseField";
import { ShareResult, type ShareOutcome } from "./ShareResult";
import { VaultLoader, type LoaderStep } from "./VaultLoader";
import { Button } from "./ui/Button";
import { FieldNote, Label, inputClass } from "./ui/Field";
import { useToast } from "./ui/Toast";
import { MAX_PAYLOAD_BYTES, isCryptoAvailable, seal } from "@/lib/crypto";
import {
  DEFAULT_PRESET,
  PRESETS,
  UNIT_LIMITS,
  clampCustom,
  expiryDate,
  type ExpiryUnit,
  type PresetId,
} from "@/lib/expiry";
import { formatBytes } from "@/lib/format";
import { newShareId, sleep } from "@/lib/id";
import { isConfigured } from "@/lib/firebase";
import { shareBase } from "@/lib/site";
import { createSecret } from "@/lib/store";
import { saveLink } from "@/lib/vault";

const STEP_LABELS = [
  "Reading what you gave us",
  "Stretching your passphrase",
  "Sealing it with AES-256-GCM",
  "Handing over a sealed box",
];

const FLAVOURS = [
  "Argon2id is chewing through 46 MiB. That is the point.",
  "Shuffling bytes into something unreadable.",
  "The plaintext is staying right here in this tab.",
  "Building a box that only one passphrase opens.",
];

type Mode = "text" | "file";

export function ComposeSecret() {
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [label, setLabel] = useState("");
  const [preset, setPreset] = useState<PresetId>(DEFAULT_PRESET);
  const [customAmount, setCustomAmount] = useState(3);
  const [customUnit, setCustomUnit] = useState<ExpiryUnit>("days");

  const [stepIndex, setStepIndex] = useState(-1);
  const [flavour, setFlavour] = useState(FLAVOURS[0]);
  const [outcome, setOutcome] = useState<ShareOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = stepIndex >= 0;
  const configured = isConfigured();

  const textBytes = useMemo(() => new TextEncoder().encode(text).length, [text]);
  const payloadBytes = mode === "file" ? (file?.size ?? 0) : textBytes;
  const overLimit = payloadBytes > MAX_PAYLOAD_BYTES;
  const hasContent = mode === "file" ? Boolean(file) : text.trim().length > 0;

  const steps: LoaderStep[] = STEP_LABELS.map((stepLabel, index) => ({
    label: stepLabel,
    done: stepIndex > index,
    active: stepIndex === index,
  }));

  const pickFile = useCallback(
    (next: File | null) => {
      if (!next) return;
      if (next.size > MAX_PAYLOAD_BYTES) {
        toast(
          `That file is ${formatBytes(next.size)}. A single share holds up to ${formatBytes(MAX_PAYLOAD_BYTES)}.`,
          "error",
        );
        return;
      }
      setFile(next);
      setMode("file");
      setError(null);
    },
    [toast],
  );

  const reset = () => {
    setOutcome(null);
    setText("");
    setFile(null);
    setPassphrase("");
    setLabel("");
    setStepIndex(-1);
    setError(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  async function submit() {
    setError(null);

    if (!isCryptoAvailable()) {
      setError(
        "This browser will not give Credo the Web Crypto API. That usually means an insecure connection or a very old browser.",
      );
      return;
    }
    if (!configured) {
      setError(
        "Credo has no vault attached yet. The Firebase environment variables are missing from this deployment.",
      );
      return;
    }
    if (!hasContent) {
      setError(mode === "file" ? "Pick a file first." : "Write something to send first.");
      return;
    }
    if (overLimit) {
      setError(
        `That payload is ${formatBytes(payloadBytes)}. A single share holds up to ${formatBytes(MAX_PAYLOAD_BYTES)}.`,
      );
      return;
    }
    if (passphrase.length < 6) {
      setError("Use a passphrase of at least six characters, or press the dice for a strong one.");
      return;
    }

    setFlavour(FLAVOURS[Math.floor(Math.random() * FLAVOURS.length)]);
    const startedAt = Date.now();

    try {
      setStepIndex(0);
      await sleep(360);
      const bytes =
        mode === "file" && file
          ? new Uint8Array(await file.arrayBuffer())
          : new TextEncoder().encode(text);

      setStepIndex(1);
      await sleep(120);

      setStepIndex(2);
      // Yield a frame so the dial repaints before the key stretch blocks it.
      await sleep(60);
      const envelope = await seal(bytes, passphrase);

      setStepIndex(3);
      const id = newShareId();
      const expiresAt = expiryDate(preset, customAmount, customUnit);
      await createSecret({
        id,
        encryptedData: envelope,
        expiresAt,
        file:
          mode === "file" && file
            ? { name: file.name, type: file.type || "application/octet-stream" }
            : null,
      });

      const url = `${shareBase()}/s/${id}`;
      await saveLink({
        id,
        url,
        label: label.trim() || (mode === "file" ? (file?.name ?? "File") : firstWords(text)),
        kind: mode,
        createdAt: Date.now(),
        expiresAt: expiresAt.getTime(),
        fileName: mode === "file" ? file?.name : undefined,
        bytes: payloadBytes,
      });

      // Give the last tick a beat so the loader never flashes past.
      const elapsed = Date.now() - startedAt;
      if (elapsed < 1200) await sleep(1200 - elapsed);
      setStepIndex(STEP_LABELS.length);
      await sleep(280);

      setOutcome({
        id,
        url,
        passphrase,
        expiresAt: expiresAt.getTime(),
        kind: mode,
        fileName: file?.name,
      });
      setStepIndex(-1);
    } catch (caught) {
      setStepIndex(-1);
      const message =
        caught instanceof Error
          ? caught.message
          : "Something went wrong before your secret was stored.";
      setError(message);
      toast(message, "error");
    }
  }

  if (outcome) return <ShareResult outcome={outcome} onReset={reset} />;

  return (
    <>
      <VaultLoader open={busy} title="Sealing your secret" steps={steps} flavour={flavour} />

      {!configured ? (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-[color-mix(in_srgb,var(--warn)_30%,transparent)] bg-[color-mix(in_srgb,var(--warn)_9%,transparent)] p-3.5">
          <TriangleAlert size={15} className="mt-0.5 shrink-0 text-warn" />
          <p className="text-[12.5px] leading-relaxed text-ink-soft">
            No vault is attached to this deployment yet, so nothing can be stored. Everything
            else on this page works, and the encryption still runs locally.
          </p>
        </div>
      ) : null}

      <div className="card panel-glow p-5 sm:p-6">
        {/* -------------------------------------------------- mode switcher */}
        <div
          className="inline-flex rounded-full border border-[var(--line)] bg-surface-2 p-1"
          role="tablist"
          aria-label="What are you sending"
        >
          {(
            [
              ["text", "A note", PenLine],
              ["file", "A file", Paperclip],
            ] as const
          ).map(([value, tabLabel, Icon]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => setMode(value)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all ${
                mode === value
                  ? "bg-brand text-[var(--brand-ink)]"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Icon size={14} />
              {tabLabel}
            </button>
          ))}
        </div>

        {/* -------------------------------------------------------- payload */}
        <div className="mt-5">
          {mode === "text" ? (
            <>
              <Label
                htmlFor="secret-body"
                hint={
                  <span className={overLimit ? "text-danger" : undefined}>
                    {formatBytes(textBytes)} of {formatBytes(MAX_PAYLOAD_BYTES)}
                  </span>
                }
              >
                The secret
              </Label>
              <textarea
                id="secret-body"
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={7}
                spellCheck={false}
                autoComplete="off"
                placeholder={"api key, wifi password, recovery codes, a paragraph of context.\nAnything you would rather not leave sitting in a chat thread."}
                className={`${inputClass} resize-y font-mono leading-relaxed`}
              />
              <FieldNote>
                Nothing here is sent anywhere until you press the button below.
              </FieldNote>
            </>
          ) : (
            <>
              <Label hint={`Up to ${formatBytes(MAX_PAYLOAD_BYTES)}`}>The file</Label>
              <input
                ref={fileInput}
                id="secret-file"
                type="file"
                className="sr-only"
                onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
              />

              {file ? (
                <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-surface-2 p-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--brand-soft)] text-brand">
                    <FileUp size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-ink">{file.name}</p>
                    <p className="text-[12px] text-ink-faint">
                      {formatBytes(file.size)}
                      {file.type ? ` · ${file.type}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      if (fileInput.current) fileInput.current.value = "";
                    }}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-surface hover:text-danger"
                    aria-label="Remove the file"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="secret-file"
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    pickFile(event.dataTransfer.files?.[0] ?? null);
                  }}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center transition-colors ${
                    dragging
                      ? "border-brand bg-[var(--brand-soft)]"
                      : "border-[var(--line-strong)] bg-surface-2 hover:border-brand"
                  }`}
                >
                  <FileUp size={20} className="text-ink-faint" />
                  <span className="text-[13.5px] font-medium text-ink">
                    Drop a file here, or choose one
                  </span>
                  <span className="text-[12px] text-ink-faint">
                    Env files, keys, certificates, config. Up to {formatBytes(MAX_PAYLOAD_BYTES)}.
                  </span>
                </label>
              )}
            </>
          )}
        </div>

        {/* ----------------------------------------------------- passphrase */}
        <div className="mt-6">
          <PassphraseField
            value={passphrase}
            onChange={setPassphrase}
            label="Passphrase"
            placeholder="Something only they could guess"
          />
        </div>

        {/* --------------------------------------------------------- expiry */}
        <div className="mt-6">
          <Label hint="Nothing is kept past 30 days">
            <span className="inline-flex items-center gap-1.5">
              <Timer size={13} className="text-ink-faint" />
              Self destructs after
            </span>
          </Label>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((option) => (
              <button
                key={option.id}
                type="button"
                title={option.note}
                onClick={() => setPreset(option.id)}
                className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all ${
                  preset === option.id
                    ? "border-brand bg-[var(--brand-soft)] text-brand"
                    : "border-[var(--line)] bg-surface-2 text-ink-soft hover:border-[var(--line-strong)] hover:text-ink"
                }`}
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPreset("custom")}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all ${
                preset === "custom"
                  ? "border-brand bg-[var(--brand-soft)] text-brand"
                  : "border-[var(--line)] bg-surface-2 text-ink-soft hover:border-[var(--line-strong)] hover:text-ink"
              }`}
            >
              Custom
            </button>
          </div>

          {preset === "custom" ? (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={UNIT_LIMITS[customUnit]}
                value={customAmount}
                onChange={(event) => setCustomAmount(Number(event.target.value))}
                onBlur={() => setCustomAmount(clampCustom(customAmount, customUnit))}
                className={`${inputClass} w-24 py-2.5`}
                aria-label="Expiry amount"
              />
              <select
                value={customUnit}
                onChange={(event) => {
                  const next = event.target.value as ExpiryUnit;
                  setCustomUnit(next);
                  setCustomAmount((current) => clampCustom(current, next));
                }}
                className={`${inputClass} w-40 py-2.5`}
                aria-label="Expiry unit"
              >
                {(Object.keys(UNIT_LIMITS) as ExpiryUnit[]).map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <span className="text-[12px] text-ink-faint">
                up to {UNIT_LIMITS[customUnit]}
              </span>
            </div>
          ) : null}
        </div>

        {/* ---------------------------------------------------- local label */}
        <div className="mt-6">
          <Label htmlFor="secret-label" hint="Only stored in this browser">
            Name it for your own list
          </Label>
          <input
            id="secret-label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            maxLength={60}
            placeholder="Staging database password"
            className={`${inputClass} py-2.5`}
          />
        </div>

        {error ? (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[color-mix(in_srgb,var(--danger)_32%,transparent)] bg-[color-mix(in_srgb,var(--danger)_9%,transparent)] p-3.5">
            <TriangleAlert size={15} className="mt-0.5 shrink-0 text-danger" />
            <p className="text-[12.5px] leading-relaxed text-ink">{error}</p>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={submit} loading={busy} disabled={busy}>
            <Lock size={16} />
            Seal and get a link
          </Button>
          <p className="flex items-center gap-1.5 text-[12px] text-ink-faint">
            <Info size={12} />
            The passphrase is never part of the link.
          </p>
        </div>
      </div>
    </>
  );
}

function firstWords(value: string, count = 5) {
  const words = value.trim().split(/\s+/).slice(0, count).join(" ");
  return words.length > 48 ? `${words.slice(0, 48)}...` : words || "Untitled note";
}
