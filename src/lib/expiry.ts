export type ExpiryUnit = "minutes" | "hours" | "days" | "weeks" | "months";

export const UNIT_MS: Record<ExpiryUnit, number> = {
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
  weeks: 604_800_000,
  months: 2_592_000_000,
};

/** Firestore rules make expiry mandatory, so there is always a preset selected. */
export const PRESETS = [
  { id: "10m", label: "10 minutes", ms: 10 * UNIT_MS.minutes, note: "One time handoff" },
  { id: "1h", label: "1 hour", ms: UNIT_MS.hours, note: "Same session" },
  { id: "24h", label: "24 hours", ms: 24 * UNIT_MS.hours, note: "Most common" },
  { id: "7d", label: "7 days", ms: 7 * UNIT_MS.days, note: "Across a week" },
  { id: "30d", label: "30 days", ms: 30 * UNIT_MS.days, note: "Longest preset" },
] as const;

export type PresetId = (typeof PRESETS)[number]["id"] | "custom";

export const UNIT_LIMITS: Record<ExpiryUnit, number> = {
  minutes: 527_040,
  hours: 8_784,
  days: 366,
  weeks: 52,
  months: 12,
};

export function clampCustom(amount: number, unit: ExpiryUnit): number {
  if (!Number.isFinite(amount)) return 1;
  return Math.min(Math.max(Math.round(amount), 1), UNIT_LIMITS[unit]);
}

export function expiryDate(presetId: PresetId, amount: number, unit: ExpiryUnit): Date {
  if (presetId === "custom") {
    return new Date(Date.now() + clampCustom(amount, unit) * UNIT_MS[unit]);
  }
  const preset = PRESETS.find((item) => item.id === presetId) ?? PRESETS[2];
  return new Date(Date.now() + preset.ms);
}
