/**
 * Credo offline shell.
 *
 * Scope is derived from where this file is served, so the same worker works at
 * credo.lowkey.tools/credo/ and at lowkey.tools/credo/ without edits. Nothing
 * belonging to a share is ever cached: only the shell, the build output and the
 * brand assets go into storage.
 */
const VERSION = "credo-v1";
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;
const BASE = new URL("./", self.location).pathname.replace(/\/$/, "");

const PRECACHE = [
  `${BASE}/`,
  `${BASE}/new`,
  `${BASE}/open`,
  `${BASE}/offline`,
  `${BASE}/favicon.svg`,
  `${BASE}/icons/icon-192.png`,
  `${BASE}/manifest.webmanifest`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) =>
        Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, { cache: "reload" })))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

function isBuildOutput(url) {
  return url.pathname.startsWith(`${BASE}/_next/static/`);
}

function isBrandAsset(url) {
  return (
    url.pathname.startsWith(`${BASE}/icons/`) ||
    /\.(?:png|svg|ico|webp|woff2?)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(`${BASE}/`) && url.pathname !== BASE) return;

  // Hashed build output never changes under the same name.
  if (isBuildOutput(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(ASSETS).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
    return;
  }

  // Icons and fonts: serve instantly, refresh quietly in the background.
  if (isBrandAsset(url)) {
    event.respondWith(
      caches.match(request).then((hit) => {
        const network = fetch(request)
          .then((response) => {
            const copy = response.clone();
            caches.open(ASSETS).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => hit);
        return hit || network;
      }),
    );
    return;
  }

  // Pages: try the network first so a deploy is picked up immediately.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match(`${BASE}/offline`);
          return (
            offline ||
            new Response("Credo is offline and this page was never cached.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }),
    );
  }
});
