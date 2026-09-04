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

/**
 * `field-ring` is defined in globals.css and carries the whole focus treatment.
 * The generic :focus-visible outline is switched off for form controls there, so
 * a focused field draws exactly one box on the element that owns the border.
 * These strings stay literal because Tailwind only sees class names it can read
 * in the source, never ones assembled at runtime.
 */
export const inputClass =
  "w-full rounded-xl border border-[var(--line)] bg-surface-2 px-3.5 py-3 text-sm text-ink placeholder:text-ink-faint outline-none transition-[border-color,box-shadow,background-color] duration-150 focus:field-ring";

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
