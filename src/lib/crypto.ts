/**
 * Client side encryption for Credo.
 *
 * Payloads are sealed with AES-256-GCM. The key is stretched from the
 * passphrase with Argon2id, which is memory hard: an attacker guessing
 * passphrases has to pay for 46 MiB of RAM per attempt, which is what makes
 * large scale GPU cracking uneconomical. That property is the whole reason for
 * the choice, because the passphrase is the only secret in the system.
 *
 * Nothing here touches the network. The browser produces the ciphertext and
 * only that ciphertext is uploaded.
 *
 * Envelope layout, version 2 (binary, then base64 for Firestore):
 *
 *   0..3    magic "CRDO"
 *   4       format version
 *   5       KDF id
 *   6..9    Argon2 memory cost in KiB, uint32 big endian
 *   10      Argon2 time cost
 *   11      Argon2 parallelism
 *   12..27  salt, 16 bytes
 *   28..39  nonce, 12 bytes
 *   40..    AES-GCM ciphertext with its 16 byte authentication tag
 *
 * Every KDF parameter travels with the payload, so raising the cost later never
 * breaks links that are already out in the wild.
 */

const MAGIC = new Uint8Array([0x43, 0x52, 0x44, 0x4f]); // "CRDO"

const VERSION_PBKDF2 = 1;
const VERSION_ARGON2 = 2;

const KDF_ARGON2ID = 1;

const SALT_BYTES = 16;
const IV_BYTES = 12;
const KEY_BYTES = 32;

const HEADER_V1 = MAGIC.length + 1 + 4 + SALT_BYTES + IV_BYTES; // 37
const HEADER_V2 = MAGIC.length + 1 + 1 + 4 + 1 + 1 + SALT_BYTES + IV_BYTES; // 40

/**
 * OWASP's published Argon2id configuration for interactive use. Roughly 0.2s on
 * a laptop and under a second on a mid range phone, while costing an attacker
 * 46 MiB of memory for every single guess.
 */
export const ARGON2_PARAMS = { m: 47104, t: 1, p: 1 } as const;

/** Guard rails when reading someone else's envelope, so a hostile payload
 *  cannot ask this browser to allocate an absurd amount of memory. */
const MAX_MEMORY_KIB = 262_144; // 256 MiB
const MAX_TIME_COST = 16;
const MAX_PARALLELISM = 4;

/**
 * Firestore caps a document at 1 MiB. Base64 costs about a third on top of the
 * raw bytes, so this ceiling keeps the finished document comfortably inside it.
 */
export const MAX_PAYLOAD_BYTES = 700 * 1024;

export class CryptoUnavailableError extends Error {
  constructor() {
    super(
      "This browser does not expose the Web Crypto API over a secure origin, so Credo cannot encrypt anything here.",
    );
    this.name = "CryptoUnavailableError";
  }
}

export class WrongPassphraseError extends Error {
  constructor() {
    super("That passphrase does not unlock this secret.");
    this.name = "WrongPassphraseError";
  }
}

export class CorruptPayloadError extends Error {
  constructor() {
    super("This payload was not produced by Credo, or it was damaged in transit.");
    this.name = "CorruptPayloadError";
  }
}

function subtle(): SubtleCrypto {
  const c = typeof globalThis === "undefined" ? undefined : globalThis.crypto;
  if (!c?.subtle) throw new CryptoUnavailableError();
  return c.subtle;
}

function randomBytes(length: number): Uint8Array {
  const out = new Uint8Array(length);
  globalThis.crypto.getRandomValues(out);
  return out;
}

function normalise(passphrase: string): Uint8Array {
  return new TextEncoder().encode(passphrase.normalize("NFKC"));
}

async function importAesKey(raw: Uint8Array): Promise<CryptoKey> {
  return subtle().importKey("raw", raw as BufferSource, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/** Loaded on demand: most visitors never reach a screen that encrypts. */
async function argon2Key(
  passphrase: string,
  salt: Uint8Array,
  params: { m: number; t: number; p: number },
): Promise<CryptoKey> {
  const { argon2id } = await import("@noble/hashes/argon2.js");
  const raw = argon2id(normalise(passphrase), salt, { ...params, dkLen: KEY_BYTES });
  return importAesKey(raw);
}

/** Version 1 only. Kept so nothing sealed by an earlier build becomes garbage. */
async function pbkdf2Key(
  passphrase: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const material = await subtle().importKey(
    "raw",
    normalise(passphrase) as BufferSource,
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return subtle().deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Seal raw bytes into a base64 envelope. */
export async function seal(data: Uint8Array, passphrase: string): Promise<string> {
  if (data.byteLength > MAX_PAYLOAD_BYTES) {
    throw new Error("Payload is larger than Credo can store.");
  }

  const salt = randomBytes(SALT_BYTES);
  const iv = randomBytes(IV_BYTES);
  const key = await argon2Key(passphrase, salt, ARGON2_PARAMS);
  const cipher = new Uint8Array(
    await subtle().encrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      data as BufferSource,
    ),
  );

  const envelope = new Uint8Array(HEADER_V2 + cipher.byteLength);
  const view = new DataView(envelope.buffer);
  envelope.set(MAGIC, 0);
  envelope[4] = VERSION_ARGON2;
  envelope[5] = KDF_ARGON2ID;
  view.setUint32(6, ARGON2_PARAMS.m, false);
  envelope[10] = ARGON2_PARAMS.t;
  envelope[11] = ARGON2_PARAMS.p;
  envelope.set(salt, 12);
  envelope.set(iv, 12 + SALT_BYTES);
  envelope.set(cipher, HEADER_V2);
  return toBase64(envelope);
}

/** Open a base64 envelope back into raw bytes. */
export async function open(envelopeB64: string, passphrase: string): Promise<Uint8Array> {
  let envelope: Uint8Array;
  try {
    envelope = fromBase64(envelopeB64);
  } catch {
    throw new CorruptPayloadError();
  }
  if (envelope.byteLength <= HEADER_V1) throw new CorruptPayloadError();
  for (let i = 0; i < MAGIC.length; i++) {
    if (envelope[i] !== MAGIC[i]) throw new CorruptPayloadError();
  }

  const view = new DataView(envelope.buffer, envelope.byteOffset, envelope.byteLength);
  const version = envelope[4];

  let key: CryptoKey;
  let iv: Uint8Array;
  let cipher: Uint8Array;

  if (version === VERSION_ARGON2) {
    if (envelope.byteLength <= HEADER_V2) throw new CorruptPayloadError();
    if (envelope[5] !== KDF_ARGON2ID) throw new CorruptPayloadError();

    const m = view.getUint32(6, false);
    const t = envelope[10];
    const p = envelope[11];
    if (m < 8 || m > MAX_MEMORY_KIB) throw new CorruptPayloadError();
    if (t < 1 || t > MAX_TIME_COST) throw new CorruptPayloadError();
    if (p < 1 || p > MAX_PARALLELISM) throw new CorruptPayloadError();

    const salt = envelope.slice(12, 12 + SALT_BYTES);
    iv = envelope.slice(12 + SALT_BYTES, HEADER_V2);
    cipher = envelope.slice(HEADER_V2);
    key = await argon2Key(passphrase, salt, { m, t, p });
  } else if (version === VERSION_PBKDF2) {
    const iterations = view.getUint32(5, false);
    if (iterations < 1000 || iterations > 5_000_000) throw new CorruptPayloadError();

    const salt = envelope.slice(9, 9 + SALT_BYTES);
    iv = envelope.slice(9 + SALT_BYTES, HEADER_V1);
    cipher = envelope.slice(HEADER_V1);
    key = await pbkdf2Key(passphrase, salt, iterations);
  } else {
    throw new CorruptPayloadError();
  }

  try {
    return new Uint8Array(
      await subtle().decrypt(
        { name: "AES-GCM", iv: iv as BufferSource },
        key,
        cipher as BufferSource,
      ),
    );
  } catch {
    // GCM authentication failed, which means a wrong key or a modified payload.
    // Both are indistinguishable by design and both mean nothing comes out.
    throw new WrongPassphraseError();
  }
}

export async function sealText(text: string, passphrase: string) {
  return seal(new TextEncoder().encode(text), passphrase);
}

export async function openText(envelopeB64: string, passphrase: string) {
  return new TextDecoder().decode(await open(envelopeB64, passphrase));
}

/** Chunked so very large payloads never blow the argument limit. */
export function toBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(
      ...(bytes.subarray(i, i + CHUNK) as unknown as number[]),
    );
  }
  return btoa(binary);
}

export function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export function isCryptoAvailable(): boolean {
  return typeof globalThis !== "undefined" && !!globalThis.crypto?.subtle;
}
