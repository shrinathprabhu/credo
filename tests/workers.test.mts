import assert from "node:assert/strict";
import { test } from "node:test";
import worker from "../hosting/worker.mjs";
import { shareIdFromPath } from "../src/lib/share-path.ts";

function environment() {
  const seen: string[] = [];
  const assets = new Map([
    ["/index.html", "home"], ["/faq.html", "faq"], ["/s.html", "share shell"],
    ["/404.html", "not found"], ["/sw.js", "worker"], ["/og.png", "image"],
    ["/_next/static/app.js", "app"], ["/faq.txt", "RSC payload"],
    ["/s/__next._tree.txt", "share RSC payload"],
  ]);
  return {
    seen,
    ASSETS: { async fetch(request: Request) {
      const pathname = new URL(request.url).pathname;
      seen.push(pathname);
      if (!assets.has(pathname)) return new Response("missing", { status: 404 });
      const headers = { ETag: '"asset-v1"', "Content-Type": pathname.endsWith(".html") ? "text/html" : "text/plain" };
      if (request.headers.get("If-None-Match") === headers.ETag) return new Response(null, { status: 304, headers });
      return new Response(request.method === "HEAD" ? null : assets.get(pathname), { headers });
    } },
  };
}

const request = (path: string, init?: RequestInit) => new Request(`https://credo.lowkey.tools${path}`, init);

test("serves public pages, assets, and RSC payloads with the security policy", async () => {
  for (const [path, body] of [["/", "home"], ["/faq", "faq"], ["/og.png", "image"], ["/faq.txt", "RSC payload"], ["/s/__next._tree.txt", "share RSC payload"]]) {
    const result = await worker.fetch(request(path), environment());
    assert.equal(result.status, 200);
    assert.equal(await result.text(), body);
    assert.match(result.headers.get("Content-Security-Policy")!, /object-src 'none'/);
    assert.equal(result.headers.get("X-Content-Type-Options"), "nosniff");
  }
});

test("serves arbitrary share IDs without a redirect or server-side record access", async () => {
  const env = environment();
  const result = await worker.fetch(request("/s/abc-123_X"), env);
  assert.equal(await result.text(), "share shell");
  assert.equal(result.headers.get("Location"), null);
  assert.equal(result.headers.get("X-Robots-Tag"), "noindex");
  assert.equal(result.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(env.seen, ["/s.html"]);
  assert.equal(shareIdFromPath("/s/abc-123_X"), "abc-123_X");
  for (const path of ["/s/", "/s/one/two", "/s/%ZZ"]) assert.equal(shareIdFromPath(path), "");
});

test("canonical and legacy redirects preserve query strings and stay on the same host", async () => {
  for (const [from, to] of [["/faq/", "/faq"], ["/index.html", "/"], ["/faq.html", "/faq"], ["/retrieve/id123", "/s/id123"], ["/store", "/new"]]) {
    const result = await worker.fetch(request(`${from}?source=link`), environment());
    assert.equal(result.status, 308);
    assert.equal(result.headers.get("Location"), `https://credo.lowkey.tools${to}?source=link`);
  }
  const result = await worker.fetch(request("//external.example/"), environment());
  assert.equal(new URL(result.headers.get("Location")!).host, "credo.lowkey.tools");
});

test("missing paths return a real 404 and reject write methods", async () => {
  for (const path of ["/missing", "/s/one/two", "/_next/static/missing.js", "/404", "/_not-found"]) {
    const result = await worker.fetch(request(path), environment());
    assert.equal(result.status, 404);
    assert.equal(await result.text(), "not found");
    assert.equal(result.headers.get("Cache-Control"), "no-store");
  }
  const result = await worker.fetch(request("/", { method: "POST" }), environment());
  assert.equal(result.status, 405);
  assert.equal(result.headers.get("Allow"), "GET, HEAD");
});

test("preserves cache validators, HEAD semantics, and service-worker scope", async () => {
  const sw = await worker.fetch(request("/sw.js"), environment());
  assert.equal(sw.headers.get("Service-Worker-Allowed"), "/");
  assert.match(sw.headers.get("Cache-Control")!, /no-store/);
  const staticAsset = await worker.fetch(request("/_next/static/app.js"), environment());
  assert.match(staticAsset.headers.get("Cache-Control")!, /immutable/);
  const cached = await worker.fetch(request("/faq", { headers: { "If-None-Match": '"asset-v1"' } }), environment());
  assert.equal(cached.status, 304);
  assert.equal(await cached.text(), "");
  const head = await worker.fetch(request("/faq", { method: "HEAD" }), environment());
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
});

test("Workers preview URLs are noindex and asset failures return 503", async () => {
  const preview = await worker.fetch(new Request("https://credo.example.workers.dev/"), environment());
  assert.equal(preview.headers.get("X-Robots-Tag"), "noindex");
  const failed = await worker.fetch(request("/"), { ASSETS: { fetch() { throw new Error("unavailable"); } } });
  assert.equal(failed.status, 503);
  assert.equal(failed.headers.get("Cache-Control"), "no-store");
});
