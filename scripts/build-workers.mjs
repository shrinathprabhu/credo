import { cp, mkdir, readFile, rm, symlink, writeFile, access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const stage = join(root, ".cloudflare-workers-build");
const output = join(root, "cloudflare-workers");
const require = createRequire(import.meta.url);

// Stage the static export without moving or editing the local development route.
process.env.NODE_ENV = "production";
require("@next/env").loadEnvConfig(root, false);
await rm(stage, { recursive: true, force: true });
await rm(output, { recursive: true, force: true });
await mkdir(stage, { recursive: true });
for (const file of ["src", "public", "package.json", "package-lock.json", "tsconfig.json", "postcss.config.mjs"]) {
  await cp(join(root, file), join(stage, file), { recursive: true });
}
await symlink(join(root, "node_modules"), join(stage, "node_modules"), "junction");
await rm(join(stage, "src/app/s/[id]"), { recursive: true });
await cp(join(root, "hosting/cloudflare-workers/share-page.tsx"), join(stage, "src/app/s/page.tsx"));
await writeFile(join(stage, "next.config.mjs"), `export default {
  output: "export",
  outputFileTracingRoot: import.meta.dirname,
  trailingSlash: false,
  reactStrictMode: true,
  poweredByHeader: false,
};\n`);

const result = spawnSync(process.execPath, [require.resolve("next/dist/bin/next"), "build", "--webpack"], {
  cwd: stage,
  env: process.env,
  stdio: "inherit",
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

// Missing key artifacts must fail the build, never publish an incomplete app.
for (const file of ["index.html", "s.html", "404.html", "robots.txt", "sitemap.xml", "manifest.webmanifest", "sw.js", "og.png"]) {
  await access(join(stage, "out", file));
}
const share = await readFile(join(stage, "out/s.html"), "utf8");
if (!/<meta name="robots" content="[^"]*noindex/.test(share)) {
  throw new Error("The exported share shell must be noindex.");
}
await cp(join(stage, "out"), output, { recursive: true });
console.log("Cloudflare Workers output ready in cloudflare-workers/");
