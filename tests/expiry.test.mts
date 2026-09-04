import { expiryDate, clampCustom, MAX_RETENTION_MS, UNIT_LIMITS, DEFAULT_PRESET } from "../src/lib/expiry.ts";

const DAY = 86_400_000;
const from = Date.UTC(2026, 0, 1);
const span = (d: Date) => (d.getTime() - from) / DAY;
const ok = (name: string, cond: boolean) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) process.exitCode = 1;
};

ok("nothing selected gives exactly 30 days", span(expiryDate(undefined, 1, "days", from)) === 30);
ok("default preset is 30d", DEFAULT_PRESET === "30d");
ok("unknown preset falls back to 30 days", span(expiryDate("bogus" as never, 1, "days", from)) === 30);
ok("10 minutes preset", expiryDate("10m", 1, "days", from).getTime() - from === 600_000);
ok("7 day preset", span(expiryDate("7d", 1, "days", from)) === 7);
ok("custom 3 days", span(expiryDate("custom", 3, "days", from)) === 3);
ok("custom 90 days clamps to 30", span(expiryDate("custom", 90, "days", from)) === 30);
ok("custom 52 weeks clamps to 30 days", span(expiryDate("custom", 52, "weeks", from)) <= 30);
ok("custom 1000000 minutes clamps to 30 days", span(expiryDate("custom", 1_000_000, "minutes", from)) === 30);
ok("negative custom becomes 1 unit", clampCustom(-5, "days") === 1);
ok("unit limits never exceed the ceiling",
  (Object.keys(UNIT_LIMITS) as (keyof typeof UNIT_LIMITS)[]).every(
    (u) => expiryDate("custom", UNIT_LIMITS[u], u, from).getTime() - from <= MAX_RETENTION_MS,
  ));
ok("ceiling is 30 days", MAX_RETENTION_MS === 30 * DAY);
