import { argon2id } from "@noble/hashes/argon2.js";

// One derivation per worker. The caller terminates it after receiving the key.
self.onmessage = (event: MessageEvent<{
  passphrase: string;
  salt: Uint8Array;
  params: { m: number; t: number; p: number };
}>) => {
  const { passphrase, salt, params } = event.data;
  const password = new TextEncoder().encode(passphrase.normalize("NFKC"));
  try {
    const key = argon2id(password, salt, { ...params, dkLen: 32 });
    self.postMessage({ key }, { transfer: [key.buffer] });
  } catch {
    self.postMessage({ error: "Could not derive the encryption key. Try again on a device with more available memory." });
  } finally {
    password.fill(0);
  }
};
