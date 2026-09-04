"use client";

import { Check, Copy } from "lucide-react";
import { useCopy } from "./Toast";

export function CopyButton({
  value,
  label = "Copy",
  toastLabel,
  className = "",
  compact = false,
}: {
  value: string;
  label?: string;
  toastLabel?: string;
  className?: string;
  compact?: boolean;
}) {
  const { copy, copiedKey } = useCopy();
  const copied = copiedKey === value;

  return (
    <button
      type="button"
      onClick={() => copy(value, value, toastLabel)}
      aria-label={copied ? "Copied" : label}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-surface-2 text-ink-soft transition-all hover:border-[var(--line-strong)] hover:text-ink ${
        compact ? "size-9 justify-center" : "h-9 px-3 text-[13px]"
      } ${copied ? "border-brand text-brand" : ""} ${className}`}
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {compact ? null : <span>{copied ? "Copied" : label}</span>}
    </button>
  );
}
