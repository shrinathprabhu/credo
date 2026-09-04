"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-150 select-none disabled:pointer-events-none disabled:opacity-45 active:translate-y-px";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-[var(--brand-ink)] hover:brightness-110 shadow-[0_10px_30px_-14px_var(--brand)]",
  secondary:
    "bg-surface-2 text-ink border border-[var(--line)] hover:border-[var(--line-strong)] hover:bg-[var(--bg-soft)]",
  ghost: "text-ink-soft hover:text-ink hover:bg-surface-2",
  danger:
    "bg-transparent text-danger border border-[color-mix(in_srgb,var(--danger)_35%,transparent)] hover:bg-[color-mix(in_srgb,var(--danger)_12%,transparent)]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-[15px]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={buttonClass(variant, size, className)}
    >
      {loading ? (
        <span
          className="size-4 shrink-0 rounded-full border-2 border-current border-t-transparent"
          style={{ animation: "credo-spin 0.7s linear infinite" }}
          aria-hidden
        />
      ) : null}
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
};

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: ButtonLinkProps) {
  return <Link {...rest} className={buttonClass(variant, size, className)} />;
}
