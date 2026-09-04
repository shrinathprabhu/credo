"use client";

import { useSyncExternalStore } from "react";

/** Browser capabilities never change mid session, so nothing to subscribe to. */
const neverChanges = () => () => {};

/**
 * Reads a browser capability without tripping over hydration. The server always
 * sees false, the client sees the real answer on its first paint, and React
 * reconciles the two without a mismatch warning.
 */
export function useClientFlag(check: () => boolean): boolean {
  return useSyncExternalStore(neverChanges, check, () => false);
}
