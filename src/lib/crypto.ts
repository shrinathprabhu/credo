/**
 * Client side encryption for Credo.
 *
 * Every payload is sealed with AES-256-GCM using a key stretched from the
 * passphrase with PBKDF2-HMAC-SHA256. Nothing here ever touches the network:
 * the browser produces the ciphertext, and only that ciphertext is uploaded.
 *
 * Envelope layout (binary, then base64 encoded for Firestore):
 *
 *   0..3    magic "CRDO"
 *   4       format version
 *   5..8    PBKDF2 iteration count, uint32 big endian
 *   9..24   salt, 16 bytes
 *   25..36  nonce, 12 bytes
 *   37..    AES-GCM ciphertext with its 16 byte auth tag
 *
 * The iteration count travels with the payload so raising it later never
 * breaks links that are already out in the wild.
 */

const MAGIC = new Uint8Array([0x43, 0x52, 0x44, 0x4f]); // "CRDO"
const VERSION = 1;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const HEADER_BYTES = MAGIC.length + 1 + 4 + SALT_BYTES + IV_BYTES;

/** OWASP guidance for PBKDF2-HMAC-SHA256, high enough to hurt an attacker. */
export const PBKDF2_ITERATIONS = 600_000;

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

async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const material = await subtle().importKey(
    "raw",
    new TextEncoder().encode(passphrase.normalize("NFKC")),
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
export async function seal(
  data: Uint8Array,
  passphrase: string,
): Promise<string> {
  if (data.byteLength > MAX_PAYLOAD_BYTES) {
    throw new Error("Payload is larger than Credo can store.");
  }
  const salt = randomBytes(SALT_BYTES);
  const iv = randomBytes(IV_BYTES);
  const key = await deriveKey(passphrase, salt, PBKDF2_ITERATIONS);
  const cipher = new Uint8Array(
    await subtle().encrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      data as BufferSource,
    ),
  );

  const envelope = new Uint8Array(HEADER_BYTES + cipher.byteLength);
  envelope.set(MAGIC, 0);
  envelope[4] = VERSION;
  new DataView(envelope.buffer).setUint32(5, PBKDF2_ITERATIONS, false);
  envelope.set(salt, 9);
  envelope.set(iv, 9 + SALT_BYTES);
  envelope.set(cipher, HEADER_BYTES);
  return toBase64(envelope);
}

/** Open a base64 envelope back into raw bytes. */
export async function open(
  envelopeB64: string,
  passphrase: string,
): Promise<Uint8Array> {
  let envelope: Uint8Array;
  try {
    envelope = fromBase64(envelopeB64);
  } catch {
    throw new CorruptPayloadError();
  }
  if (envelope.byteLength <= HEADER_BYTES) throw new CorruptPayloadError();
  for (let i = 0; i < MAGIC.length; i++) {
    if (envelope[i] !== MAGIC[i]) throw new CorruptPayloadError();
  }
  if (envelope[4] !== VERSION) throw new CorruptPayloadError();

  const iterations = new DataView(
    envelope.buffer,
    envelope.byteOffset,
    envelope.byteLength,
  ).getUint32(5, false);
  if (iterations < 1000 || iterations > 5_000_000) throw new CorruptPayloadError();

  const salt = envelope.slice(9, 9 + SALT_BYTES);
  const iv = envelope.slice(9 + SALT_BYTES, HEADER_BYTES);
  const cipher = envelope.slice(HEADER_BYTES);
  const key = await deriveKey(passphrase, salt, iterations);
  try {
    return new Uint8Array(
      await subtle().decrypt(
        { name: "AES-GCM", iv: iv as BufferSource },
        key,
        cipher as BufferSource,
      ),
    );
  } catch {
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
