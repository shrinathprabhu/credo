# Credo

**Send a secret that only the right person can open.**

Credo encrypts a note, a password, an API key or a small file in the browser with
AES-256-GCM, uploads nothing but the ciphertext, and hands back a link plus a QR code
that expire on a schedule you choose. There is no account, no server that can read a
share, and no way to recover a lost passphrase.

Live at **https://credo.lowkey.tools**

This is a ground up rebuild of [Credenstore](https://github.com/shrinathprabhu/credenstore),
with modern browser cryptography, a new interface and a local history of the links you
have created.

---

## How a share works

1. You type a secret or attach a file. Nothing has left the tab.
2. Argon2id stretches your passphrase against a fresh 16 byte salt into a 256 bit key,
   spending 46 MiB of memory per attempt.
3. AES-256-GCM seals the bytes with a fresh 12 byte nonce. Header, salt, nonce and
   ciphertext are packed into one envelope and base64 encoded.
4. That envelope, a creation timestamp and an expiry timestamp are written to a single
   Firestore document. File shares also carry the original name and MIME type.
5. The recipient opens the link, types the passphrase, and the decryption happens in
   their browser.

The passphrase is never transmitted, never stored, and never part of the link.

---

## Stack

| Piece | Choice |
| --- | --- |
| Framework | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS v4, CSS custom properties for the light and dark palettes |
| Crypto | Web Crypto API for AES-256-GCM, `@noble/hashes` for Argon2id |
| Storage | Firebase Firestore, client SDK only, loaded on demand |
| Local history | IndexedDB with a localStorage fallback |
| Icons | lucide-react |
| Hosting | Cloudflare Workers |

There is no backend of our own. The browser talks straight to Firestore, and the
Firestore rules are the only thing enforcing the schema and the expiry.

### Why Argon2id and AES-256-GCM, and not TripleSec

Credenstore used TripleSec, which cascades XSalsa20, Twofish and AES-256 and derives its
key with scrypt. The cascade is the eye catching part, but it is not where the security
of a tool like this actually lives.

The only secret in the system is a human chosen passphrase, so the question that matters
is what one guess costs an attacker holding the ciphertext. That is decided by the key
derivation function, not by how many ciphers are stacked. A cascade defends against a
future break in AES-256, which nobody has, while a weak KDF is exploitable today with a
rented graphics card.

So the cipher is a single well studied AEAD, and the effort went into the KDF:

- **Argon2id**, the Password Hashing Competition winner and current OWASP
  recommendation, at `m=47104 KiB, t=1, p=1`. It is memory hard, so every guess costs
  46 MiB of RAM. GPUs can run thousands of simple hashes in parallel but cannot hold
  thousands of 46 MiB working sets, which is what makes bulk cracking uneconomical.
  This is stronger than TripleSec's scrypt configuration, not weaker.
- **AES-256-GCM** through the browser's native Web Crypto, so the primitive is constant
  time, hardware accelerated and maintained by the browser vendor. The `triplesec`
  package is unmaintained pure JavaScript with hand written Twofish and Keccak, which is
  a larger attack surface and more exposed to timing side channels than native code.
- **One AEAD instead of encrypt-then-MAC by hand.** GCM's authentication tag means a
  modified payload refuses to open rather than decrypting into something plausible.

Measured on an M series laptop: Argon2id at these parameters takes about 200 ms, roughly
0.7 s on a mid range phone. PBKDF2 at 600,000 rounds, a common alternative, takes 97 ms
here and is trivially parallel on a GPU. Same wall clock for the sender, wildly different
cost for the attacker.

`ARGON2_PARAMS` in `src/lib/crypto.ts` is the single place to raise this. Every cost
parameter is written into the envelope, so raising it never breaks links already sent.

---

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the Firebase values
npm run dev
```

The app runs at http://localhost:3000. All routes and assets are served from the
origin root, just as they are on the production subdomain.

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production Workers build |
| `npm run build:workers` | Build static assets in `cloudflare-workers/` for the Worker |
| `npm run check:workers` | Worker routing, headers, caching and failure checks |
| `npm run preview:workers` | Preview the built app in the local Workers runtime |
| `npm run deploy:workers` | Deploy the built app with the pinned Wrangler CLI |
| `npm start` | Preview the Workers production build locally |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Encryption round trips, tamper and wrong passphrase cases, and the expiry ceiling |
| `npm run assets` | Regenerate favicons, PWA icons and the social image from the SVG sources |

---

## Environment

Every value is public by design. The client SDK keys are not secrets: the security
comes from `firestore.rules`.

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIRESTORE_DATABASE_ID   # optional, only for a non default database
NEXT_PUBLIC_SITE_ORIGIN             # https://credo.lowkey.tools
```

Without the Firebase values the app still loads and still encrypts locally. It shows a
clear banner saying no vault is attached, and refuses to pretend a share was stored.

---

## Firestore setup

1. Deploy the rules. They are checked into `firestore.rules` and are the authority on
   what a record may contain.

   ```bash
   firebase deploy --only firestore:rules
   ```

2. Turn on a TTL policy so expired records are actually deleted rather than merely
   refused.

   ```bash
   gcloud firestore fields ttls update expires_at \
     --collection-group=store \
     --enable-ttl \
     --project=YOUR_PROJECT_ID
   ```

Retention is capped at thirty days. `src/lib/expiry.ts` holds the ceiling, the preset
list and the custom control all resolve against it, an unset or unrecognised selection
becomes exactly thirty days, and `createSecret` clamps again before writing so no caller
can outlive the policy. `npm test` covers those cases.

The rules allow exactly five fields and nothing else, so the write path in
`src/lib/store.ts` has to stay in lockstep with them. Any extra key comes back as
`permission-denied` for the whole document.

| Field | Type | When |
| --- | --- | --- |
| `encrypted_data` | non empty string | always |
| `created_at` | timestamp | always |
| `expires_at` | timestamp | always, which is why every share must expire. Thirty days by default and thirty days at most |
| `file` | boolean | only for file shares |
| `metadata` | map with exactly `name` and `type` | only when `file` is true |

Reads are single document only and are refused once `expires_at` has passed. Listing,
updating and deleting are all refused, which is why the history of created links lives
in the browser instead of on the server.

---

## Routing

Credo lives at **https://credo.lowkey.tools**. Pages such as `/new`, `/open` and
`/s/[id]`, assets under `/_next/static/`, and metadata routes all start at the
origin root. There is no base path, asset prefix or proxy rewrite.

`hosting/policy.mjs` owns security headers, cache rules and the original
Credenstore redirects. `next.config.ts` applies them during local development;
`hosting/worker.mjs` applies them in production. `npm run build` builds the Workers
assets, and `npm start` previews them locally with Wrangler.

### robots.txt

Credo serves its own crawler rules at `https://credo.lowkey.tools/robots.txt`:

```text
User-Agent: *
Allow: /
Disallow: /s/
Disallow: /links
Disallow: /offline
Sitemap: https://credo.lowkey.tools/sitemap.xml
```

Share pages, local link history and the offline fallback are excluded from the
sitemap and marked noindex. Public pages have canonical URLs, social metadata
and structured data on the Credo subdomain.

---

## Deploying

### Cloudflare Workers

Credo uses [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
with a small Worker that handles routing and response headers. Encryption and
Firestore access continue to run in the browser, so no Next.js server adapter,
KV, D1 or R2 binding is needed.

Connect this repository to **Workers Builds**, and use these settings:

| Setting | Value |
| --- | --- |
| Worker name | `credo` (matches `wrangler.toml`) |
| Root directory | Repository root |
| Build command | `npm run build:workers` |
| Deploy command | `npm run deploy:workers` |
| Non-production branch deploy command, if enabled | `npx wrangler versions upload` |
| `NODE_VERSION` | `24` |
| `NEXT_PUBLIC_SITE_ORIGIN` | `https://credo.lowkey.tools` |
| Firebase build variables | The same `NEXT_PUBLIC_FIREBASE_*` values listed above; optionally `NEXT_PUBLIC_FIRESTORE_DATABASE_ID` |

The output directory is configured as `cloudflare-workers` in `wrangler.toml`;
there is no Pages framework preset or Pages output-directory setting.
Set public environment variables in the **build** environment. These values are
compiled into the client bundle, so changing them requires a rebuild. Adding
runtime Worker variables alone will not update them. The build downloads Google
Fonts and needs network access. Wrangler is pinned in `package-lock.json`.

For local development of the deployment and an explicit upload:

```bash
npm ci
npm run build:workers
npm run preview:workers
# When ready to publish (requires Cloudflare authentication):
npm run deploy:workers
```

`wrangler.toml` declares the production hostname:

```toml
[[routes]]
pattern = "credo.lowkey.tools"
custom_domain = true
```

`npm run deploy:workers` applies this custom domain when deploying to the account
that owns the active `lowkey.tools` Cloudflare zone. Cloudflare manages the domain's
DNS record and certificate. If an old CNAME already occupies this hostname, resolve
that conflict before deploying. See [Cloudflare's Custom Domains documentation](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).
The build and local preview do not attach the domain or change DNS.

The build stages a copy in `.cloudflare-workers-build/`, replaces only that
copy's dynamic share route with a static `/s` page, then exports it. The Worker
serves this shell for `/s/:id` without changing the visible address. The browser
reads the ID and opens the existing passphrase form. Existing links and QR codes
keep their format. Local Next.js development uses the dynamic route.

`hosting/worker.mjs` imports `hosting/policy.mjs`, the same security and cache
policy used in local development. `run_worker_first = true` ensures headers are attached to
pages, assets, redirects, and errors. The Worker serves a real 404 for unknown
paths, normalizes trailing slashes, preserves legacy redirects, handles HEAD and
conditional requests, and marks share pages and `workers.dev` URLs noindex.
Share responses use `Cache-Control: no-store`. No Pages `_headers` or `_redirects`
files are generated or required.

Before attaching the domain, check `/`, `/new`, `/faq`, `/robots.txt`,
`/sitemap.xml`, `/manifest.webmanifest`, `/sw.js`, a nonexistent route, and an
existing `/s/:id` link in the Workers preview. Confirm the ID is populated and
that security headers and the worker's no-cache policy are present.

### Caching

- `/_next/static/*` and fonts: one year, immutable.
- Icons and social images: one week, with a month of stale-while-revalidate.
- Manifest, robots, sitemap and `llms.txt`: one hour, with a day of
  stale-while-revalidate.
- `sw.js`: never cached, so a deploy is picked up on the next visit.
- All share URLs use one exported shell on Cloudflare Workers. Encrypted records
  are fetched in the browser and are never embedded in the HTML.

### Security headers

`hosting/policy.mjs` defines a Content Security Policy that allows connections only to the app
itself and to Firestore, blocks framing except from lowkey.tools, and turns off camera,
microphone and geolocation. Also `X-Content-Type-Options`, a strict referrer policy and
HSTS. Next.js applies it during local development; the Worker applies it to
production responses.

---

## Discoverability

Because a tool like this is usually found through a question rather than a brand name,
the content is written to be quotable and the machine readable layer is deliberate:

- JSON-LD for `Organization`, `WebSite`, `SoftwareApplication`, `HowTo`, `FAQPage`,
  `TechArticle` and `BreadcrumbList`.
- An `/llms.txt` summary for assistants that look for one.
- A sitemap, per page canonical tags, and Open Graph plus Twitter card images.
- A PWA manifest with shortcuts, maskable icons and an offline shell.
- FAQ answers written as complete, self contained statements, so an answer engine can
  lift one without needing the surrounding page.

---

## Project layout

```
src/
  app/            routes, metadata, manifest, robots, sitemap
  components/     UI, including the loader, the QR card and the two main flows
  lib/
    crypto.ts     seal and open, the whole cryptography surface
    expiry.ts     presets, the custom control and the thirty day ceiling
    store.ts      the only two Firestore calls, matched to firestore.rules
    vault.ts      the browser local history of created links
    passphrase.ts strength scoring and generation
    share.ts      Web Share integration for links and QR images
    schema.ts     JSON-LD builders
public/
  favicon.svg, icons/, og.png, llms.txt, sw.js
scripts/
  generate-assets.mjs   renders every binary asset from the SVG sources
tests/
  crypto.test.mts       round trip, tamper and wrong passphrase coverage
  expiry.test.mts       defaults and clamping against the retention ceiling
```

---

## What this does not protect you from

Covered in full on the [security page](https://credo.lowkey.tools/security), but in
short: a weak passphrase, sending the link and the passphrase in the same thread, a
compromised browser, and the fact that a link works as many times as needed until it
expires because the rules block writes after creation.

---

## Credits

Built by [Shrinath Prabhu](https://shrinath.me), who also works on
[OwlEye Analytics](https://owleye.dev). Part of [lowkey.tools](https://lowkey.tools).
Secret sent? Find your next quiet focus session at [SuperFocus](https://superfocus.lowkey.tools).

MIT licensed, same as the original Credenstore.
