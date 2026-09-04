"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeChoice } from "./theme";

const OPTIONS: { value: ThemeChoice; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

export function ThemeToggle() {
  const { choice, setChoice } = useTheme();

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full border border-[var(--line)] bg-surface-2 p-0.5"
      role="radiogroup"
      aria-label="Colour theme"
    >
      {OPTIONS.map(({ value, icon: Icon, label }) => {
        const active = choice === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            title={`${label} theme`}
            onClick={() => setChoice(value)}
            className={`grid size-7 place-items-center rounded-full transition-all ${
              active
                ? "bg-brand text-[var(--brand-ink)]"
                : "text-ink-faint hover:text-ink"
            }`}
          >
            <Icon size={14} strokeWidth={2.2} />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
