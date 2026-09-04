# Credo

**Send a secret that only the right person can open.**

Credo encrypts a note, a password, an API key or a small file in the browser with
AES-256-GCM, uploads nothing but the ciphertext, and hands back a link plus a QR code
that expire on a schedule you choose. There is no account, no server that can read a
share, and no way to recover a lost passphrase.

Live at **https://lowkey.tools/credo**

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
| Hosting | Vercel |

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

The app runs at http://localhost:3000/credo because the base path is `/credo` by
default. See [Routing](#routing-and-the-two-hostnames) for why.

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
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
NEXT_PUBLIC_BASE_PATH               # defaults to /credo
NEXT_PUBLIC_SITE_ORIGIN             # https://lowkey.tools
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

## Routing and the two hostnames

Credo answers on two addresses:

| Address | What it is |
| --- | --- |
| `lowkey.tools/credo` | the canonical one, what links and QR codes point at |
| `credo.lowkey.tools` | the Vercel deployment, fully usable on its own at the root |

Links, assets and metadata routes are all emitted under `/credo`, which is what the
`basePath` in `next.config.ts` does. That matters more here than it would in a Vite app:
in the App Router the prefix is baked into prerendered `href`s and into the `.rsc`
payloads the client router uses for navigation, so it cannot be reinterpreted at runtime
the way a router `basename` can. One prefix in the markup is what lets the same response
be correct on either host without rewriting response bodies.

`vercel.json` then serves the app from the root of its own subdomain:

```json
{
  "rewrites": [
    { "source": "/", "destination": "/credo" },
    { "source": "/:path((?!credo$|credo/).*)", "destination": "/credo/:path" }
  ]
}
```

So `credo.lowkey.tools/` and `credo.lowkey.tools/new` both work, while
`/credo/_next/...`, `/credo/favicon.ico` and every other asset resolve natively. The
negative lookahead is what stops `/credo/x` from being rewritten to `/credo/credo/x`.

There is deliberately **no redirect from `/`** in `next.config.ts`, and adding one back
will break the site with `ERR_TOO_MANY_REDIRECTS`. Next emits a relative `Location`, so a
`/` to `/credo` redirect on the subdomain resolves against whichever host the visitor is
actually on. Behind a prefix stripping proxy that is `lowkey.tools/credo`, which proxies
straight back to the subdomain root, which redirects again. Redirects also run before
rewrites on Vercel, so the redirect would win and the rewrite above would never fire.

Note that `next start` does not read `vercel.json`, so in local development the app is at
`localhost:3000/credo` and bare paths 404. That is expected and does not happen on Vercel.

### Add this to the lowkey.tools project

Either shape works, because the subdomain answers on both. Path preserving has the fewest
moving parts, since the request reaches the app without passing through the subdomain's
own rewrites:

```json
{
  "rewrites": [
    { "source": "/credo", "destination": "https://credo.lowkey.tools/credo" },
    { "source": "/credo/:path*", "destination": "https://credo.lowkey.tools/credo/:path*" }
  ]
}
```

Prefix stripping also works:

```json
{
  "rewrites": [
    { "source": "/credo", "destination": "https://credo.lowkey.tools/" },
    { "source": "/credo/:path*", "destination": "https://credo.lowkey.tools/:path*" }
  ]
}
```

Or, if lowkey.tools is itself a Next.js app, the same two entries belong in
`next.config.ts` under `rewrites()`.

Three things that will break it:

1. **Rewrite, never redirect.** A redirect bounces visitors onto the subdomain and the
   canonical address stops being the one they see.
2. **Never redirect `/` to `/credo` inside the Credo app.** With a prefix stripping proxy
   that is an infinite loop, and it presents as `ERR_TOO_MANY_REDIRECTS` on
   `lowkey.tools/credo`. See the note above.
3. **Do not add a trailing slash variant.** Next normalises those itself and returns a
   relative `Location`, so `lowkey.tools/credo/faq/` lands on `lowkey.tools/credo/faq`
   rather than leaking the subdomain into the address bar.

### If you ever want the subdomain to be primary

The prefix is a deploy time decision, not something baked into the source:

```bash
NEXT_PUBLIC_BASE_PATH=""
NEXT_PUBLIC_SITE_ORIGIN="https://credo.lowkey.tools"
```

The app then serves cleanly at the subdomain root with correct links, canonical tags and
share URLs, and the `vercel.json` rewrites can be dropped.

### robots.txt

Crawlers only read `/robots.txt` at the root of a host, and that file belongs to the
lowkey.tools project. Credo serves its own copy at `/credo/robots.txt` for reference,
but the rules that matter need merging into the root one:

```
Disallow: /credo/s/
Disallow: /credo/links
Sitemap: https://lowkey.tools/credo/sitemap.xml
```

`/credo/s/` holds share pages and `/credo/links` is a purely local view, so neither
belongs in an index. Nothing readable is exposed either way.

---

## Deploying

Push to the repository connected to the Vercel project, or:

```bash
vercel --prod
```

Set the environment variables in the Vercel project settings and point
`credo.lowkey.tools` at it. `vercel.json` and `next.config.ts` carry everything else:
the base path, the redirects, the cache headers and the security headers.

### Caching

- `/_next/static/*` and fonts: one year, immutable.
- Icons and social images: one week, with a month of stale-while-revalidate.
- Manifest, robots, sitemap and `llms.txt`: one hour, with a day of
  stale-while-revalidate.
- `sw.js`: never cached, so a deploy is picked up on the next visit.
- Pages are statically prerendered. `/credo/s/[id]` renders the same shell for every
  id, so the first request for an id generates it and the CDN keeps it from then on.

### Security headers

`next.config.ts` sets a Content Security Policy that allows connections only to the app
itself and to Firestore, blocks framing except from lowkey.tools, and turns off camera,
microphone and geolocation. Also `X-Content-Type-Options`, a strict referrer policy and
HSTS.

---

## Discoverability

Because a tool like this is usually found through a question rather than a brand name,
the content is written to be quotable and the machine readable layer is deliberate:

- JSON-LD for `Organization`, `WebSite`, `SoftwareApplication`, `HowTo`, `FAQPage`,
  `TechArticle` and `BreadcrumbList`.
- An `/credo/llms.txt` summary for assistants that look for one.
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

Covered in full on the [security page](https://lowkey.tools/credo/security), but in
short: a weak passphrase, sending the link and the passphrase in the same thread, a
compromised browser, and the fact that a link works as many times as needed until it
expires because the rules block writes after creation.

---

## Credits

Built by [Shrinath Prabhu](https://shrinath.me), who also works on
[Owleye analytics](https://owleye.dev).

MIT licensed, same as the original Credenstore.
