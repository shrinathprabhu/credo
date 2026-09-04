"use client";

import { useCallback, useSyncExternalStore } from "react";

export type ThemeChoice = "system" | "light" | "dark";

const STORAGE_KEY = "credo.theme";

/** Runs before paint so the first frame is already the right theme. */
export const themeBootstrap = `(function(){try{var c=localStorage.getItem("${STORAGE_KEY}")||"system";var d=c==="dark"||(c!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.setAttribute("data-theme",d?"dark":"light");r.style.colorScheme=d?"dark":"light";}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;

/**
 * The theme lives in the DOM and in localStorage, both of which are external to
 * React, so it is read through useSyncExternalStore rather than mirrored into
 * component state. That keeps the server render and the pre paint bootstrap
 * script from fighting each other during hydration.
 */
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function readChoice(): ThemeChoice {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    /* storage blocked, fall through to the system preference */
  }
  return "system";
}

function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function apply(choice: ThemeChoice): "light" | "dark" {
  const dark = choice === "dark" || (choice === "system" && systemPrefersDark());
  const root = document.documentElement;
  root.setAttribute("data-theme", dark ? "dark" : "light");
  root.style.colorScheme = dark ? "dark" : "light";
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? "#070b0a" : "#f4f7f5");
  return dark ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onMedia = () => {
    if (readChoice() === "system") apply("system");
    notify();
  };
  // Another tab changing the preference should move this one too.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      apply(readChoice());
      notify();
    }
  };

  media.addEventListener("change", onMedia);
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(onChange);
    media.removeEventListener("change", onMedia);
    window.removeEventListener("storage", onStorage);
  };
}

const getResolved = (): "light" | "dark" =>
  document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";

export function useTheme() {
  const choice = useSyncExternalStore<ThemeChoice>(subscribe, readChoice, () => "system");
  const resolved = useSyncExternalStore<"light" | "dark">(
    subscribe,
    getResolved,
    () => "dark",
  );

  const setChoice = useCallback((next: ThemeChoice) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage blocked, the choice lasts for this tab only */
    }
    apply(next);
    notify();
  }, []);

  return { choice, resolved, setChoice };
}
