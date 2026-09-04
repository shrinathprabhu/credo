"use client";

import type { ReactNode } from "react";

export function Label({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">
        {children}
      </label>
      {hint ? <span className="text-[12px] text-ink-faint">{hint}</span> : null}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-[var(--line)] bg-surface-2 px-3.5 py-3 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-brand focus:bg-surface";

export function FieldNote({
  tone = "muted",
  children,
}: {
  tone?: "muted" | "error" | "ok";
  children: ReactNode;
}) {
  const color =
    tone === "error" ? "text-danger" : tone === "ok" ? "text-brand" : "text-ink-faint";
  return <p className={`mt-2 text-[12px] leading-snug ${color}`}>{children}</p>;
}
