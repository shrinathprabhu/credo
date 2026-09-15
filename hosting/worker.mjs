import { headers, redirects } from "./policy.mjs";

const headerRules = headers(true);
const legacyRoutes = redirects();

function matches(source, pathname) {
  if (source.endsWith(":path*")) return pathname.startsWith(source.slice(0, -6));
  const files = /^\/:file\((.+)\)$/.exec(source);
  return files ? files[1].split("|").includes(pathname.slice(1)) : source === pathname;
}

function finish(response, request) {
  const url = new URL(request.url);
  const result = new Headers(response.headers);
  for (const rule of headerRules) {
    if (matches(rule.source, url.pathname)) {
      for (const { key, value } of rule.headers) result.set(key, value);
    }
  }
  if (url.pathname.startsWith("/_next/static/") && response.status < 400) {
    result.set("Cache-Control", "public, max-age=31536000, immutable");
  }
  const privatePage = url.pathname === "/s" || url.pathname.startsWith("/s/") ||
    ["/links", "/offline"].includes(url.pathname);
  if (privatePage || response.status >= 400 || url.hostname.endsWith(".workers.dev")) {
    result.set("X-Robots-Tag", "noindex");
  }
  if (privatePage || response.status >= 400) result.set("Cache-Control", "no-store");
  return new Response(request.method === "HEAD" ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: result,
  });
}

function redirect(request, pathname) {
  const target = new URL(request.url);
  target.pathname = pathname;
  return finish(new Response(null, { status: 308, headers: { Location: target.href } }), request);
}

const worker = {
  async fetch(request, env) {
    if (!["GET", "HEAD"].includes(request.method)) {
      return finish(new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } }), request);
    }
    const url = new URL(request.url);
    const path = url.pathname;
    if (path !== "/" && path.endsWith("/")) return redirect(request, path.replace(/\/+$/, "") || "/");
    if (path.endsWith(".html")) {
      return redirect(request, path.replace(/\/index\.html$/, "").replace(/\.html$/, "") || "/");
    }
    for (const { source, destination } of legacyRoutes) {
      if (source === path) return redirect(request, destination);
      if (source.endsWith("/:id")) {
        const prefix = source.slice(0, -3);
        const id = path.startsWith(prefix) ? path.slice(prefix.length) : "";
        if (id && !id.includes("/")) return redirect(request, destination.replace(":id", id));
      }
    }

    const asset = async pathname => {
      const target = new URL(request.url);
      target.pathname = pathname;
      return env.ASSETS.fetch(new Request(target, request));
    };
    try {
      // Every share ID uses the same public shell; the ID and secret are resolved in the browser.
      const sharePath = /^\/s\/[^/]+$/.test(path) && !path.startsWith("/s/__next.");
      let response = await asset(sharePath ? "/s.html" : path === "/" ? "/index.html" : path);
      if (response.status === 404 && !sharePath && !path.split("/").at(-1).includes(".")) {
        response = await asset(`${path}.html`);
      }
      if (response.status === 404 || path === "/404" || path === "/_not-found") {
        const notFound = await asset("/404.html");
        response = new Response(notFound.body, { status: 404, headers: notFound.headers });
      }
      return finish(response, request);
    } catch {
      return finish(new Response("Credo is temporarily unavailable.", { status: 503 }), request);
    }
  },
};

export default worker;
