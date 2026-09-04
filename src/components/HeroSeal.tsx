"use client";

import { ArrowDown, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SAMPLES = [
  "AWS_SECRET=wJalrXUtnFEMI/K7MDENG",
  "wifi: hunter2-but-actually-good",
  "recovery codes: 4821 9930 5517",
  "db url: postgres://ops@prod/main",
];

const HEX = "0123456789abcdef";

function scrambled(length: number) {
  let out = "";
  for (let i = 0; i < length; i += 1) out += HEX[(Math.random() * 16) | 0];
  return out;
}

/**
 * The hero visual. It cycles through a few believable secrets and shows the
 * shape of what actually gets stored, which is the single idea the page needs
 * to land in the first three seconds.
 */
export function HeroSeal() {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  // Seeded with a fixed string: random text here would differ between the
  // server render and the first client render and break hydration.
  const [cipher, setCipher] = useState("9f4c1a7e0b6d3852".repeat(6));
  const phase = useRef<"typing" | "holding">("typing");

  useEffect(() => {
    const sample = SAMPLES[index % SAMPLES.length];
    let cursor = 0;
    phase.current = "typing";

    const typer = window.setInterval(() => {
      if (phase.current !== "typing") return;
      cursor += 1;
      setTyped(sample.slice(0, cursor));
      if (cursor >= sample.length) {
        phase.current = "holding";
        window.setTimeout(() => setIndex((value) => value + 1), 2600);
      }
    }, 42);

    return () => window.clearInterval(typer);
  }, [index]);

  useEffect(() => {
    const shuffle = window.setInterval(() => setCipher(scrambled(96)), 110);
    return () => window.clearInterval(shuffle);
  }, []);

  return (
    <div className="relative w-full max-w-md">
      <div className="card panel-glow relative overflow-hidden p-5">
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
          <span className="size-1.5 rounded-full bg-brand" />
          In your browser
        </div>
        <p className="mt-3 min-h-[3.5rem] font-mono text-[13px] leading-relaxed break-all text-ink">
          {typed}
          <span
            className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.18em] bg-brand"
            style={{ animation: "credo-pulse 1s steps(2) infinite" }}
          />
        </p>
      </div>

      <div className="relative z-10 -my-2.5 flex justify-center">
        <span className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-surface px-3 py-1.5 text-[11px] font-medium text-ink-soft shadow-sm">
          <Lock size={11} className="text-brand" />
          AES-256-GCM
          <ArrowDown size={11} className="text-ink-faint" />
        </span>
      </div>

      <div className="card panel-glow relative overflow-hidden p-5">
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
          <span className="size-1.5 rounded-full bg-[var(--iris)]" />
          What the database holds
        </div>
        <p
          aria-hidden
          className="mt-3 min-h-[3.5rem] font-mono text-[13px] leading-relaxed break-all text-ink-faint/80 select-none"
        >
          {cipher}
        </p>
        <span className="sr-only">
          The stored value is unreadable ciphertext, not the text you typed.
        </span>
      </div>
    </div>
  );
}
