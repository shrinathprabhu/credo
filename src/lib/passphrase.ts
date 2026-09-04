/**
 * Passphrase quality and generation.
 *
 * Strength is scored as rough entropy in bits rather than a bag of rules, so a
 * long lowercase phrase is treated as the good password it is instead of being
 * nagged for a missing symbol.
 */

export type Strength = {
  bits: number;
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  hint: string;
};

const COMMON = new Set([
  "password", "123456", "12345678", "qwerty", "abc123", "111111", "letmein",
  "monkey", "dragon", "iloveyou", "admin", "welcome", "login", "passw0rd",
  "starwars", "football", "trustno1", "secret", "changeme", "sunshine",
]);

const SEQUENCES = ["abcdefghijklmnopqrstuvwxyz", "01234567890", "qwertyuiop", "asdfghjkl", "zxcvbnm"];

function charsetSize(value: string): number {
  let size = 0;
  if (/[a-z]/.test(value)) size += 26;
  if (/[A-Z]/.test(value)) size += 26;
  if (/\d/.test(value)) size += 10;
  if (/[^A-Za-z0-9]/.test(value)) size += 33;
  return size || 1;
}

function repetitionPenalty(value: string): number {
  const unique = new Set(value).size;
  if (!value.length) return 0;
  const ratio = unique / value.length;
  return ratio < 0.5 ? (0.5 - ratio) * 30 : 0;
}

function sequencePenalty(value: string): number {
  const lower = value.toLowerCase();
  let penalty = 0;
  for (const seq of SEQUENCES) {
    for (let i = 0; i + 4 <= seq.length; i++) {
      const run = seq.slice(i, i + 4);
      if (lower.includes(run) || lower.includes([...run].reverse().join(""))) {
        penalty += 8;
        break;
      }
    }
  }
  return penalty;
}

export function measure(value: string): Strength {
  if (!value) {
    return { bits: 0, score: 0, label: "Empty", hint: "Pick something only the recipient can guess." };
  }

  const lower = value.toLowerCase();
  if (COMMON.has(lower)) {
    return {
      bits: 4,
      score: 0,
      label: "Very weak",
      hint: "This one shows up in every leaked password list.",
    };
  }

  const raw = value.length * Math.log2(charsetSize(value));
  const bits = Math.max(0, Math.round(raw - repetitionPenalty(value) - sequencePenalty(value)));

  if (bits < 35) {
    return { bits, score: 1, label: "Weak", hint: "Add more length. Length beats cleverness every time." };
  }
  if (bits < 55) {
    return { bits, score: 2, label: "Fair", hint: "Good start. A few more characters would make it much harder." };
  }
  if (bits < 80) {
    return { bits, score: 3, label: "Strong", hint: "Solid. Share it over a different channel than the link." };
  }
  return { bits, score: 4, label: "Excellent", hint: "Nothing is brute forcing this in your lifetime." };
}

/** Ambiguous glyphs are left out so the phrase survives being read aloud. */
const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generate(groups = 4, groupSize = 5): string {
  const total = groups * groupSize;
  const bytes = new Uint32Array(total);
  crypto.getRandomValues(bytes);

  let out = "";
  for (let i = 0; i < total; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return (out.match(new RegExp(`.{1,${groupSize}}`, "g")) ?? [out]).join("-");
}
