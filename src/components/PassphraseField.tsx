"use client";

import { Check, Copy, Dices, Eye, EyeOff } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { generate, measure } from "@/lib/passphrase";
import { useCopy } from "./ui/Toast";
import { Label } from "./ui/Field";

const BAR_COLORS = ["var(--line-strong)", "var(--danger)", "var(--warn)", "var(--brand)", "var(--brand)"];

export function PassphraseField({
  value,
  onChange,
  label = "Passphrase",
  placeholder = "Something only they could guess",
  autoComplete = "new-password",
  showStrength = true,
  allowGenerate = true,
  error,
  onEnter,
}: {
  value: string;
  onChange: (next: string) => void;
  label?: string;
  placeholder?: string;
  autoComplete?: string;
  showStrength?: boolean;
  allowGenerate?: boolean;
  error?: string | null;
  onEnter?: () => void;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const { copy, copiedKey } = useCopy();
  const strength = useMemo(() => measure(value), [value]);
  const copied = copiedKey === value && value.length > 0;

  return (
    <div>
      <Label htmlFor={id} hint={showStrength && value ? `${strength.bits} bits` : undefined}>
        {label}
      </Label>

      <div
        className={`flex items-center gap-1 rounded-xl border bg-surface-2 pr-1.5 pl-3.5 transition-[border-color,box-shadow,background-color] duration-150 ${
          error
            ? "border-danger"
            : "border-[var(--line)] focus-within:field-ring"
        }`}
      >
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onKeyUp={(event) => setCapsOn(event.getModifierState?.("CapsLock") ?? false)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && onEnter) onEnter();
          }}
          className="min-w-0 flex-1 bg-transparent py-3 font-mono text-sm text-ink outline-none placeholder:font-sans placeholder:text-ink-faint"
        />

        {value ? (
          <button
            type="button"
            onClick={() => copy(value, value, "Passphrase copied. Send it separately from the link.")}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-surface hover:text-ink"
            aria-label="Copy passphrase"
            title="Copy passphrase"
          >
            {copied ? <Check size={15} className="text-brand" /> : <Copy size={15} />}
          </button>
        ) : null}

        {allowGenerate ? (
          <button
            type="button"
            onClick={() => {
              onChange(generate());
              setVisible(true);
            }}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-surface hover:text-brand"
            aria-label="Generate a strong passphrase"
            title="Generate a strong passphrase"
          >
            <Dices size={16} />
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-surface hover:text-ink"
          aria-label={visible ? "Hide passphrase" : "Show passphrase"}
          title={visible ? "Hide passphrase" : "Show passphrase"}
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>

      {showStrength ? (
        <div className="mt-2.5 flex items-center gap-3">
          <div className="flex flex-1 gap-1" aria-hidden>
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className="h-1 flex-1 rounded-full transition-colors duration-300"
                style={{
                  background:
                    value && strength.score > index ? BAR_COLORS[strength.score] : "var(--line)",
                }}
              />
            ))}
          </div>
          <span
            className="w-20 shrink-0 text-right text-[11px] font-medium"
            style={{ color: value ? BAR_COLORS[strength.score] : "var(--ink-faint)" }}
          >
            {value ? strength.label : "Not set"}
          </span>
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 text-[12px] text-danger">{error}</p>
      ) : capsOn ? (
        <p className="mt-2 text-[12px] text-warn">Caps lock is on.</p>
      ) : showStrength && value ? (
        <p className="mt-2 text-[12px] text-ink-faint">{strength.hint}</p>
      ) : null}
    </div>
  );
}
