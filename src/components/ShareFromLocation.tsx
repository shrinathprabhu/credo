"use client";

import { useSyncExternalStore } from "react";
import { RevealSecret } from "./RevealSecret";
import { shareIdFromPath } from "@/lib/share-path";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

/** Workers serves one static shell at every /s/:id URL. */
export function ShareFromLocation() {
  const pathname = useSyncExternalStore(subscribe, () => window.location.pathname, () => "");
  if (!pathname) return <p role="status" className="text-sm text-ink-soft">Loading your share…</p>;
  const id = shareIdFromPath(pathname);
  return <RevealSecret key={id} initialId={id} />;
}
