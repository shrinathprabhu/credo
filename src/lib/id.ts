import { customAlphabet } from "nanoid";

/**
 * Share ids show up in links, in QR codes and sometimes get read aloud, so the
 * alphabet drops the glyph pairs people confuse: 0 and O, 1 and l and I.
 * Twelve characters from 54 symbols is about 69 bits, far past guessable.
 */
const ALPHABET = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

export const newShareId = customAlphabet(ALPHABET, 12);

export function looksLikeShareId(value: string): boolean {
  return /^[0-9A-Za-z_-]{6,64}$/.test(value.trim());
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
