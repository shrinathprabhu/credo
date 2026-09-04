/**
 * Local history of the links a person has created.
 *
 * Firestore refuses list queries by design, so there is no server side index of
 * anyone's shares. This module keeps a private record in the browser instead.
 * It stores the id, the share URL and a label, never the passphrase and never
 * the secret itself, so losing this list costs nothing but convenience.
 */

const DB_NAME = "credo";
const DB_VERSION = 1;
const STORE = "links";
const FALLBACK_KEY = "credo.links.v1";

export type LinkKind = "text" | "file";

export type StoredLink = {
  id: string;
  url: string;
  label: string;
  kind: LinkKind;
  createdAt: number;
  expiresAt: number;
  fileName?: string;
  bytes?: number;
};

function hasIndexedDb(): boolean {
  try {
    return typeof indexedDB !== "undefined";
  } catch {
    return false;
  }
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("createdAt", "createdAt");
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("IndexedDB is blocked"));
    });
  }
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = run(transaction.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

function readFallback(): StoredLink[] {
  try {
    const raw = localStorage.getItem(FALLBACK_KEY);
    return raw ? (JSON.parse(raw) as StoredLink[]) : [];
  } catch {
    return [];
  }
}

function writeFallback(links: StoredLink[]) {
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(links));
  } catch {
    /* private browsing with no quota, nothing to do */
  }
}

export async function listLinks(): Promise<StoredLink[]> {
  let links: StoredLink[];
  if (hasIndexedDb()) {
    try {
      links = await tx<StoredLink[]>("readonly", (store) => store.getAll());
    } catch {
      links = readFallback();
    }
  } else {
    links = readFallback();
  }
  return links.sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveLink(link: StoredLink): Promise<void> {
  if (hasIndexedDb()) {
    try {
      await tx("readwrite", (store) => store.put(link) as IDBRequest<IDBValidKey>);
      return;
    } catch {
      /* fall through to localStorage */
    }
  }
  const links = readFallback().filter((item) => item.id !== link.id);
  links.push(link);
  writeFallback(links);
}

export async function removeLink(id: string): Promise<void> {
  if (hasIndexedDb()) {
    try {
      await tx("readwrite", (store) => store.delete(id) as IDBRequest<undefined>);
      return;
    } catch {
      /* fall through to localStorage */
    }
  }
  writeFallback(readFallback().filter((item) => item.id !== id));
}

export async function clearLinks(): Promise<void> {
  if (hasIndexedDb()) {
    try {
      await tx("readwrite", (store) => store.clear() as IDBRequest<undefined>);
    } catch {
      /* ignore */
    }
  }
  try {
    localStorage.removeItem(FALLBACK_KEY);
  } catch {
    /* ignore */
  }
}

/** Drops entries that expired more than a day ago so the list stays useful. */
export async function pruneStale(graceMs = 24 * 60 * 60 * 1000): Promise<void> {
  const cutoff = Date.now() - graceMs;
  const links = await listLinks();
  await Promise.all(
    links.filter((link) => link.expiresAt < cutoff).map((link) => removeLink(link.id)),
  );
}
