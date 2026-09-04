export type ExpiryUnit = "minutes" | "hours" | "days" | "weeks";

export const UNIT_MS: Record<ExpiryUnit, number> = {
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
  weeks: 604_800_000,
};

/**
 * Nothing is retained past thirty days. This is the ceiling for every path into
 * an expiry, the preset list, the custom control and the fallback, so a record
 * can never be written with a longer life than the policy allows.
 */
export const MAX_RETENTION_MS = 30 * UNIT_MS.days;

/** Used whenever the sender never touched the expiry control. */
export const DEFAULT_PRESET = "30d" as const;

export const PRESETS = [
  { id: "10m", label: "10 minutes", ms: 10 * UNIT_MS.minutes, note: "One time handoff" },
  { id: "1h", label: "1 hour", ms: UNIT_MS.hours, note: "Same working session" },
  { id: "24h", label: "24 hours", ms: 24 * UNIT_MS.hours, note: "Across a day" },
  { id: "7d", label: "7 days", ms: 7 * UNIT_MS.days, note: "Across a week" },
  { id: "30d", label: "30 days", ms: MAX_RETENTION_MS, note: "Default, and the longest allowed" },
] as const;

export type PresetId = (typeof PRESETS)[number]["id"] | "custom";

/** Every unit stops at the point where it would pass thirty days. */
export const UNIT_LIMITS: Record<ExpiryUnit, number> = {
  minutes: Math.floor(MAX_RETENTION_MS / UNIT_MS.minutes),
  hours: Math.floor(MAX_RETENTION_MS / UNIT_MS.hours),
  days: Math.floor(MAX_RETENTION_MS / UNIT_MS.days),
  weeks: Math.floor(MAX_RETENTION_MS / UNIT_MS.weeks),
};

export function clampCustom(amount: number, unit: ExpiryUnit): number {
  if (!Number.isFinite(amount)) return 1;
  return Math.min(Math.max(Math.round(amount), 1), UNIT_LIMITS[unit]);
}

/**
 * Resolves a selection into a concrete moment. An absent or unrecognised
 * selection becomes exactly thirty days from now rather than failing, since the
 * database rules refuse a record with no expiry at all.
 */
export function expiryDate(
  presetId?: PresetId,
  amount = 1,
  unit: ExpiryUnit = "days",
  from = Date.now(),
): Date {
  let span: number;

  if (presetId === "custom") {
    span = clampCustom(amount, unit) * UNIT_MS[unit];
  } else {
    span = (PRESETS.find((item) => item.id === presetId) ?? PRESETS[PRESETS.length - 1]).ms;
  }

  return new Date(from + Math.min(span, MAX_RETENTION_MS));
}
