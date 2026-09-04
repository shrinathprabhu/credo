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
2. PBKDF2-HMAC-SHA256 stretches your passphrase over 600,000 rounds against a fresh
   16 byte salt, producing a 256 bit key.
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
| Crypto | Web Crypto API, no third party crypto dependency |
| Storage | Firebase Firestore, client SDK only, loaded on demand |
| Local history | IndexedDB with a localStorage fallback |
| Icons | lucide-react |
| Hosting | Vercel |

There is no backend of our own. The browser talks straight to Firestore, and the
Firestore rules are the only thing enforcing the schema and the expiry.

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
| `npm test` | Encryption round trip tests, including tamper and wrong passphrase cases |
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

The rules allow exactly five fields and nothing else, so the write path in
`src/lib/store.ts` has to stay in lockstep with them. Any extra key comes back as
`permission-denied` for the whole document.

| Field | Type | When |
| --- | --- | --- |
| `encrypted_data` | non empty string | always |
| `created_at` | timestamp | always |
| `expires_at` | timestamp | always, which is why every share must expire |
| `file` | boolean | only for file shares |
| `metadata` | map with exactly `name` and `type` | only when `file` is true |

Reads are single document only and are refused once `expires_at` has passed. Listing,
updating and deleting are all refused, which is why the history of created links lives
in the browser instead of on the server.

---

## Routing and the two hostnames

Credo is deployed to Vercel on **credo.lowkey.tools** but people use it at
**lowkey.tools/credo**. To keep one set of asset URLs valid on both, the app is served
under the `/credo` base path on *both* hosts. Every script, style, icon and link is
therefore `/credo/...` no matter which host answered.

What that means in practice:

- `credo.lowkey.tools/credo/...` serves the app. Bare `credo.lowkey.tools/` redirects
  to `/credo`.
- `lowkey.tools/credo/...` proxies straight through with the path untouched.
- Canonical tags, the sitemap and `llms.txt` all point at `lowkey.tools/credo`, so the
  subdomain never competes with it in search results.

### Add this to the lowkey.tools project

Path preserving rewrites, no prefix stripping:

```json
{
  "rewrites": [
    { "source": "/credo", "destination": "https://credo.lowkey.tools/credo" },
    { "source": "/credo/:path*", "destination": "https://credo.lowkey.tools/credo/:path*" }
  ]
}
```

Or, if lowkey.tools is itself a Next.js app:

```ts
async rewrites() {
  return [
    { source: "/credo", destination: "https://credo.lowkey.tools/credo" },
    { source: "/credo/:path*", destination: "https://credo.lowkey.tools/credo/:path*" },
  ];
}
```

Two things that will break it if you get them wrong:

1. **Do not strip the prefix.** Rewriting `/credo/:path*` to
   `https://credo.lowkey.tools/:path*` sends requests to a path the app does not serve,
   and every asset URL in the returned HTML will still say `/credo/...` anyway.
2. **Do not use a redirect.** A redirect would bounce visitors onto the subdomain and
   the canonical address stops being the one people see.

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
