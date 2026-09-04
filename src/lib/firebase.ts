/**
 * Firestore access, loaded on demand.
 *
 * The SDK is a heavy dependency and most visitors never reach a screen that
 * needs it, so every export here is dynamically imported at call time. The
 * local cache is deliberately in memory only: ciphertext should not linger in
 * IndexedDB after a tab closes.
 */
import type { Firestore } from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const databaseId = process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID || undefined;

export class NotConfiguredError extends Error {
  constructor() {
    super(
      "Credo has no Firebase project attached yet. Add the NEXT_PUBLIC_FIREBASE_* values to the environment and redeploy.",
    );
    this.name = "NotConfiguredError";
  }
}

export function isConfigured(): boolean {
  return Boolean(config.apiKey && config.projectId && config.appId);
}

let dbPromise: Promise<Firestore> | null = null;

export function getDb(): Promise<Firestore> {
  if (!isConfigured()) return Promise.reject(new NotConfiguredError());
  if (!dbPromise) {
    dbPromise = (async () => {
      const [{ getApps, initializeApp }, firestore] = await Promise.all([
        import("firebase/app"),
        import("firebase/firestore"),
      ]);
      const app = getApps()[0] ?? initializeApp(config);
      const settings = { localCache: firestore.memoryLocalCache() };
      try {
        return databaseId
          ? firestore.initializeFirestore(app, settings, databaseId)
          : firestore.initializeFirestore(app, settings);
      } catch {
        // initializeFirestore throws if the instance already exists.
        return databaseId
          ? firestore.getFirestore(app, databaseId)
          : firestore.getFirestore(app);
      }
    })();
  }
  return dbPromise;
}
