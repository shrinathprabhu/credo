"use client";

import { Check, CircleAlert, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Tone = "success" | "error" | "info";
type Toast = { id: number; tone: Tone; message: string };

const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

const tones: Record<Tone, { icon: typeof Check; ring: string }> = {
  success: { icon: Check, ring: "var(--ok)" },
  error: { icon: CircleAlert, ring: "var(--danger)" },
  info: { icon: Info, ring: "var(--iris)" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message: string, tone: Tone = "info") => {
      const id = ++counter.current;
      setToasts((current) => [...current.slice(-2), { id, tone, message }]);
      window.setTimeout(() => dismiss(id), tone === "error" ? 6500 : 3800);
    },
    [dismiss],
  );

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-5 z-100 flex flex-col items-center gap-2 px-4"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const Icon = tones[toast.tone].icon;
          return (
            <div
              key={toast.id}
              className="animate-rise pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-[var(--line)] bg-surface px-4 py-3 text-sm text-ink shadow-[0_24px_60px_-30px_rgb(0_0_0/0.7)] backdrop-blur"
              style={{ boxShadow: `0 0 0 1px ${tones[toast.tone].ring}22, 0 24px 60px -30px rgb(0 0 0 / 0.7)` }}
            >
              <Icon size={17} className="mt-0.5 shrink-0" style={{ color: tones[toast.tone].ring }} />
              <span className="flex-1 leading-snug">{toast.message}</span>
              <button
                onClick={() => dismiss(toast.id)}
                className="-m-1 rounded-full p-1 text-ink-faint transition-colors hover:text-ink"
                aria-label="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/** Copies text and reports the outcome, with a fallback for older browsers. */
export function useCopy() {
  const toast = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  return {
    copiedKey,
    copy: async (value: string, key = value, label = "Copied to clipboard") => {
      const done = () => {
        setCopiedKey(key);
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopiedKey(null), 1800);
        toast(label, "success");
      };
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(value);
          done();
          return true;
        }
        throw new Error("no clipboard api");
      } catch {
        try {
          const area = document.createElement("textarea");
          area.value = value;
          area.setAttribute("readonly", "");
          area.style.position = "fixed";
          area.style.opacity = "0";
          document.body.appendChild(area);
          area.select();
          const ok = document.execCommand("copy");
          area.remove();
          if (!ok) throw new Error("copy refused");
          done();
          return true;
        } catch {
          toast("Copying is blocked here. Select the text and copy it manually.", "error");
          return false;
        }
      }
    },
  };
}
