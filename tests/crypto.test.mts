import {
  seal,
  open,
  sealText,
  openText,
  fromBase64,
  toBase64,
  ARGON2_PARAMS,
  WrongPassphraseError,
  CorruptPayloadError,
} from "../src/lib/crypto.ts";

let failures = 0;
function assert(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) failures += 1;
}
async function assertThrows(name: string, run: () => Promise<unknown>, is: (e: unknown) => boolean) {
  try {
    await run();
    assert(name, false);
  } catch (error) {
    assert(name, is(error));
  }
}

const pass = "correct horse battery staple 42!";

/* ------------------------------------------------------------ round trips */

const text = "ROUND TRIP CHECK 4711\nsecond line stays intact\nünïcödé ✅ 漢字";
const envelope = await sealText(text, pass);
assert("text round trip", (await openText(envelope, pass)) === text);

const bytes = new Uint8Array(2048).map((_, i) => i % 256);
const back = await open(await seal(bytes, pass), pass);
assert("binary length", back.byteLength === bytes.byteLength);
assert("binary contents", back.every((b, i) => b === bytes[i]));
assert("empty payload", (await openText(await sealText("", pass), pass)) === "");
assert("salts differ", (await sealText(text, pass)) !== (await sealText(text, pass)));

/* ----------------------------------------------------------- header shape */

const header = fromBase64(envelope);
assert("magic bytes", String.fromCharCode(...header.slice(0, 4)) === "CRDO");
assert("format version is 2", header[4] === 2);
assert("kdf is argon2id", header[5] === 1);
assert(
  "argon2 params travel with the payload",
  new DataView(header.buffer).getUint32(6, false) === ARGON2_PARAMS.m &&
    header[10] === ARGON2_PARAMS.t &&
    header[11] === ARGON2_PARAMS.p,
);

/* --------------------------------------------------------------- failures */

await assertThrows("wrong passphrase rejected", () => openText(envelope, "nope"), (e) => e instanceof WrongPassphraseError);

const tampered = new Uint8Array(header);
tampered[tampered.length - 5] ^= 0xff;
await assertThrows("tampered ciphertext rejected", () => openText(toBase64(tampered), pass), (e) => e instanceof WrongPassphraseError);

const swappedSalt = new Uint8Array(header);
swappedSalt[13] ^= 0xff;
await assertThrows("tampered salt rejected", () => openText(toBase64(swappedSalt), pass), (e) => e instanceof WrongPassphraseError);

await assertThrows(
  "foreign payload rejected",
  () => openText(btoa("hello there friend, this is not credo at all"), pass),
  (e) => e instanceof CorruptPayloadError,
);

const unknownVersion = new Uint8Array(header);
unknownVersion[4] = 99;
await assertThrows("unknown version rejected", () => openText(toBase64(unknownVersion), pass), (e) => e instanceof CorruptPayloadError);

/* A hostile envelope must not be able to make this browser allocate 4 GiB. */
const greedy = new Uint8Array(header);
new DataView(greedy.buffer).setUint32(6, 4_194_304, false);
await assertThrows("absurd memory cost rejected", () => openText(toBase64(greedy), pass), (e) => e instanceof CorruptPayloadError);

const greedyTime = new Uint8Array(header);
greedyTime[10] = 200;
await assertThrows("absurd time cost rejected", () => openText(toBase64(greedyTime), pass), (e) => e instanceof CorruptPayloadError);

/* ------------------------------------------- version 1 backward decryption */

const legacy = await buildLegacyEnvelope("legacy secret payload", pass, 600_000);
assert("version 1 envelopes still open", (await openText(legacy, pass)) === "legacy secret payload");
await assertThrows("version 1 wrong passphrase rejected", () => openText(legacy, "nope"), (e) => e instanceof WrongPassphraseError);

/** Rebuilds the PBKDF2 format an earlier build produced, to prove it still reads. */
async function buildLegacyEnvelope(message: string, passphrase: string, iterations: number) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase.normalize("NFKC")),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(message)),
  );

  const out = new Uint8Array(37 + cipher.byteLength);
  out.set([0x43, 0x52, 0x44, 0x4f], 0);
  out[4] = 1;
  new DataView(out.buffer).setUint32(5, iterations, false);
  out.set(salt, 9);
  out.set(iv, 25);
  out.set(cipher, 37);
  return toBase64(out);
}

if (failures) process.exitCode = 1;
