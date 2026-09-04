"use client";

import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const GLYPHS = "0123456789ABCDEF";

/** A short line of hex that keeps reshuffling, standing in for the ciphertext. */
function Scramble({ width = 28 }: { width?: number }) {
  const [text, setText] = useState(() => "0".repeat(width));
  const frame = useRef(0);

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (time: number) => {
      if (time - last > 70) {
        last = time;
        frame.current += 1;
        let next = "";
        for (let i = 0; i < width; i += 1) {
          next += GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        setText(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [width]);

  return (
    <p
      aria-hidden
      className="font-mono text-[11px] tracking-[0.24em] text-ink-faint/70 select-none"
    >
      {text}
    </p>
  );
}

function Dial({ progress }: { progress: number }) {
  const circumference = 2 * Math.PI * 52;
  return (
    <div className="relative size-[152px]">
      <svg viewBox="0 0 128 128" className="absolute inset-0 size-full">
        <defs>
          <linearGradient id="dialArc" x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#3BE8B0" />
            <stop offset="1" stopColor="#7C74FF" />
          </linearGradient>
        </defs>

        {/* outer tick ring, slow clockwise */}
        <g style={{ transformOrigin: "64px 64px", animation: "credo-spin 14s linear infinite" }}>
          {Array.from({ length: 48 }).map((_, index) => (
            <rect
              key={index}
              x="63.4"
              y="4"
              width="1.2"
              height={index % 4 === 0 ? 8 : 4}
              rx="0.6"
              fill="var(--line-strong)"
              style={{ transformOrigin: "64px 64px", transform: `rotate(${index * 7.5}deg)` }}
            />
          ))}
        </g>

        {/* progress arc */}
        <circle cx="64" cy="64" r="52" fill="none" stroke="var(--line)" strokeWidth="3" />
        <circle
          cx="64"
          cy="64"
          r="52"
          fill="none"
          stroke="url(#dialArc)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform="rotate(-90 64 64)"
          style={{ transition: "stroke-dashoffset 520ms cubic-bezier(0.22,1,0.36,1)" }}
        />

        {/* inner counter rotating ring */}
        <g style={{ transformOrigin: "64px 64px", animation: "credo-spin-back 6s linear infinite" }}>
          <circle
            cx="64"
            cy="64"
            r="40"
            fill="none"
            stroke="var(--brand)"
            strokeOpacity="0.35"
            strokeWidth="1.5"
            strokeDasharray="10 16"
          />
        </g>

        <circle
          cx="64"
          cy="64"
          r="30"
          fill="var(--brand)"
          opacity="0.08"
          style={{ transformOrigin: "64px 64px", animation: "credo-pulse 2.2s ease-in-out infinite" }}
        />
      </svg>

      <div className="absolute inset-0 grid place-items-center">
        <span className="font-display text-2xl font-bold tabular-nums text-ink">
          {Math.round(progress * 100)}
          <span className="text-sm text-ink-faint">%</span>
        </span>
      </div>
    </div>
  );
}

export type LoaderStep = { label: string; done: boolean; active: boolean };

export function VaultLoader({
  open,
  title,
  steps,
  flavour,
}: {
  open: boolean;
  title: string;
  steps: LoaderStep[];
  flavour?: string;
}) {
  if (!open) return null;

  const doneCount = steps.filter((step) => step.done).length;
  const activeIndex = steps.findIndex((step) => step.active);
  const progress = Math.min(
    1,
    (doneCount + (activeIndex >= 0 ? 0.45 : 0)) / Math.max(1, steps.length),
  );

  return (
    <div
      className="fixed inset-0 z-90 grid place-items-center bg-[color-mix(in_srgb,var(--bg)_78%,transparent)] px-5 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      aria-busy="true"
    >
      <div className="animate-rise flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-[var(--line)] bg-surface px-7 py-9 panel-glow">
        <Dial progress={progress} />

        <div className="text-center">
          <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
          {flavour ? <p className="mt-1 text-[13px] text-ink-soft">{flavour}</p> : null}
        </div>

        <ol className="w-full space-y-2.5" aria-live="polite">
          {steps.map((step) => (
            <li key={step.label} className="flex items-center gap-3 text-[13px]">
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-full border transition-colors ${
                  step.done
                    ? "border-brand bg-brand text-[var(--brand-ink)]"
                    : step.active
                      ? "border-brand text-brand"
                      : "border-[var(--line)] text-ink-faint"
                }`}
              >
                {step.done ? (
                  <Check size={12} strokeWidth={3} />
                ) : step.active ? (
                  <span
                    className="size-2 rounded-full bg-brand"
                    style={{ animation: "credo-pulse 1s ease-in-out infinite" }}
                  />
                ) : (
                  <span className="size-1.5 rounded-full bg-current opacity-40" />
                )}
              </span>
              <span className={step.done || step.active ? "text-ink" : "text-ink-faint"}>
                {step.label}
              </span>
            </li>
          ))}
        </ol>

        <Scramble />
      </div>
    </div>
  );
}
