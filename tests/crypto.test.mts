import { seal, open, sealText, openText, WrongPassphraseError, CorruptPayloadError } from "../src/lib/crypto.ts";

function assert(name: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) process.exitCode = 1;
}

const pass = "correct horse battery staple 42!";

// text
const t = "ROUND TRIP CHECK 4711\nsecond line stays intact\nünïcödé ✅ 漢字";
const envA = await sealText(t, pass);
assert("text round trip", (await openText(envA, pass)) === t);

// binary
const bytes = new Uint8Array(2048).map((_, i) => i % 256);
const envB = await seal(bytes, pass);
const back = await open(envB, pass);
assert("binary length", back.byteLength === bytes.byteLength);
assert("binary contents", back.every((b, i) => b === bytes[i]));

// wrong passphrase
try {
  await openText(envA, "nope");
  assert("wrong passphrase rejected", false);
} catch (e) {
  assert("wrong passphrase rejected", e instanceof WrongPassphraseError);
}

// tampering
const tampered = envA.slice(0, envA.length - 6) + "AAAA" + envA.slice(envA.length - 2);
try {
  await openText(tampered, pass);
  assert("tampered payload rejected", false);
} catch (e) {
  assert("tampered payload rejected", e instanceof WrongPassphraseError || e instanceof CorruptPayloadError);
}

// non credo payload
try {
  await openText(btoa("hello there friend, this is not credo at all"), pass);
  assert("foreign payload rejected", false);
} catch (e) {
  assert("foreign payload rejected", e instanceof CorruptPayloadError);
}

// two seals of the same input differ (fresh salt and nonce)
assert("salts differ", (await sealText(t, pass)) !== (await sealText(t, pass)));

// empty string
assert("empty payload", (await openText(await sealText("", pass), pass)) === "");
