/**
 * The only two Firestore operations Credo performs.
 *
 * The security rules on the `store` collection allow a single document read and
 * a strictly shaped create. Listing, updating and deleting are refused, so the
 * history of links a person has made lives in their own browser instead. Keep
 * the written object in exact agreement with firestore.rules: any extra key
 * makes the whole write bounce back as permission-denied.
 */
import { getDb, NotConfiguredError } from "./firebase";

export type FileMeta = { name: string; type: string };

export type SecretRecord = {
  encryptedData: string;
  expiresAt: Date;
  createdAt: Date;
  file: boolean;
  metadata: FileMeta | null;
};

export class SecretUnavailableError extends Error {
  constructor() {
    super(
      "This secret is gone. Either the link expired, it was already cleaned up, or the id is wrong.",
    );
    this.name = "SecretUnavailableError";
  }
}

export class NetworkError extends Error {
  constructor() {
    super("Credo could not reach the vault. Check the connection and try again.");
    this.name = "NetworkError";
  }
}

export class UploadRejectedError extends Error {
  constructor(message?: string) {
    super(
      message ??
        "The vault refused this upload. It is usually a payload that is too large or an expiry that has already passed.",
    );
    this.name = "UploadRejectedError";
  }
}

/** Longest a file name may be before Credo trims it for storage. */
const MAX_NAME_LENGTH = 200;

export type CreateInput = {
  id: string;
  encryptedData: string;
  expiresAt: Date;
  file?: FileMeta | null;
};

export async function createSecret({
  id,
  encryptedData,
  expiresAt,
  file,
}: CreateInput): Promise<void> {
  const db = await getDb();
  const { doc, setDoc, Timestamp } = await import("firebase/firestore");

  const payload: Record<string, unknown> = {
    encrypted_data: encryptedData,
    created_at: Timestamp.fromDate(new Date()),
    expires_at: Timestamp.fromDate(expiresAt),
  };

  if (file) {
    payload.file = true;
    payload.metadata = {
      name: String(file.name ?? "download").slice(0, MAX_NAME_LENGTH),
      type: String(file.type ?? ""),
    };
  }

  try {
    await setDoc(doc(db, "store", id), payload);
  } catch (error) {
    throw translate(error, "write");
  }
}

export async function readSecret(id: string): Promise<SecretRecord> {
  const db = await getDb();
  const { doc, getDoc } = await import("firebase/firestore");

  let snapshot;
  try {
    snapshot = await getDoc(doc(db, "store", id));
  } catch (error) {
    throw translate(error, "read");
  }

  // The rules deny a read on anything expired or absent, so reaching this line
  // with no document at all means the id simply never existed.
  if (!snapshot.exists()) throw new SecretUnavailableError();

  const data = snapshot.data() as Record<string, unknown>;
  const encryptedData = typeof data.encrypted_data === "string" ? data.encrypted_data : "";
  if (!encryptedData) throw new SecretUnavailableError();

  const isFile = data.file === true;
  const meta = data.metadata as FileMeta | undefined;

  return {
    encryptedData,
    createdAt: toDate(data.created_at) ?? new Date(),
    expiresAt: toDate(data.expires_at) ?? new Date(),
    file: isFile,
    metadata:
      isFile && meta
        ? { name: String(meta.name ?? "download"), type: String(meta.type ?? "") }
        : null,
  };
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const maybe = value as { toDate?: () => Date };
  if (typeof maybe.toDate === "function") return maybe.toDate();
  if (value instanceof Date) return value;
  return null;
}

function translate(error: unknown, op: "read" | "write"): Error {
  if (error instanceof NotConfiguredError) return error;
  const code = (error as { code?: string })?.code ?? "";

  if (code === "permission-denied" || code === "not-found") {
    return op === "read" ? new SecretUnavailableError() : new UploadRejectedError();
  }
  if (code === "unavailable" || code === "deadline-exceeded" || code === "aborted") {
    return new NetworkError();
  }
  if (code === "invalid-argument" || code === "resource-exhausted") {
    return new UploadRejectedError(
      "This payload is too big for a single vault entry. Try a smaller file or shorter note.",
    );
  }
  if (code === "unauthenticated" || code === "failed-precondition") {
    return new UploadRejectedError(
      "The vault rejected the request. Confirm the Firebase project id and the Firestore rules are deployed.",
    );
  }
  return error instanceof Error
    ? error
    : new Error("Something went wrong while talking to the vault.");
}
