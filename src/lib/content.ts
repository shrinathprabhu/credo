import type { FaqEntry } from "./schema";

export const FAQ: FaqEntry[] = [
  {
    question: "What is Credo?",
    answer:
      "Credo is a free web app for handing someone a password, an API key, a private note or a small file. Your browser encrypts the content before anything is uploaded, so the stored copy is ciphertext and nothing else. The person on the other end needs both the link and the passphrase to read it.",
  },
  {
    question: "Does Credo cost anything?",
    answer:
      "No. There is no account to create, no paid tier and no usage limit beyond the size cap on a single share.",
  },
  {
    question: "Can Credo read what I send?",
    answer:
      "No. Encryption and decryption both happen inside your browser using the Web Crypto API. The database holds a base64 blob it cannot interpret, a creation time, an expiry time and, when you attach a file, the original file name and MIME type so the download arrives intact.",
  },
  {
    question: "What encryption does Credo use?",
    answer:
      "AES-256-GCM seals the payload and PBKDF2-HMAC-SHA256 with 600,000 rounds turns your passphrase into the key. Every share gets a fresh random 16 byte salt and a fresh 12 byte nonce, and the GCM authentication tag means a tampered payload fails to open rather than decrypting into garbage.",
  },
  {
    question: "Can Credo recover a lost passphrase?",
    answer:
      "No, and that is the whole point. The passphrase is never transmitted or stored, so there is nothing to look up. If it is lost, the ciphertext stays sealed forever and the only option is to create a new share.",
  },
  {
    question: "How long does a Credo link stay alive?",
    answer:
      "You choose, from ten minutes up to thirty days, and every share must have an expiry. Once the moment passes the database refuses to serve the record and a scheduled cleanup deletes it.",
  },
  {
    question: "Can I send a file with Credo?",
    answer:
      "Yes. Any file type is accepted up to roughly 700 KB per share, which is the practical ceiling for a single encrypted record. It is built for keys, certificates, config files and env files rather than for large media.",
  },
  {
    question: "Where does my list of created links live?",
    answer:
      "In your own browser, in IndexedDB, with a localStorage fallback. The database rules block listing entirely, so nobody can enumerate shares, including the people running Credo. Clearing your browser data clears the list while the links themselves keep working until they expire.",
  },
  {
    question: "Is the link on its own enough to read a secret?",
    answer:
      "No. The link only identifies which encrypted record to fetch. Without the passphrase it produces nothing readable, which is why the passphrase should travel over a different channel from the link.",
  },
  {
    question: "Can a Credo link be opened more than once?",
    answer:
      "Yes, as many times as needed until it expires. For a strictly single handoff, pick the shortest expiry and tell the recipient to open it straight away.",
  },
  {
    question: "How is this better than sending a password over chat or email?",
    answer:
      "Chat and email keep plaintext in message history, in backups, in search indexes and in notification previews, often forever and often on devices you do not control. Credo keeps ciphertext for a limited window and splits the secret across two channels, so one intercepted message is never enough.",
  },
  {
    question: "Does Credo work offline?",
    answer:
      "The interface installs as a progressive web app and the shell keeps working offline, but creating or opening a share needs a connection because the encrypted record lives in the cloud.",
  },
  {
    question: "Who built Credo?",
    answer:
      "Shrinath Prabhu, who also works on Owleye analytics. Credo is a ground up rebuild of an earlier project called Credenstore, with modern browser cryptography and a new interface.",
  },
];

export const HOW_IT_WORKS = [
  {
    title: "You write it",
    body: "Type a note, paste a credential or attach a small file. Nothing has left the tab yet.",
  },
  {
    title: "Your browser seals it",
    body: "A key is stretched from your passphrase, then AES-256-GCM encrypts the payload locally with a fresh salt and nonce.",
  },
  {
    title: "Only ciphertext travels",
    body: "The sealed blob, a timestamp and an expiry are stored. The passphrase and the plaintext never leave your device.",
  },
  {
    title: "They open it",
    body: "The recipient loads the link, types the passphrase, and the decryption happens in their browser. Then the record expires.",
  },
];

export const FEATURES = [
  {
    title: "Sealed before it leaves",
    body: "AES-256-GCM with a 600,000 round PBKDF2 key stretch, all inside the tab you are looking at.",
  },
  {
    title: "Links with a lifespan",
    body: "Every share carries an expiry, from ten minutes to thirty days. Nothing lingers by accident.",
  },
  {
    title: "Notes or files",
    body: "Env files, certificates, recovery codes, a paragraph of context. Whatever fits in a single sealed record.",
  },
  {
    title: "A code to scan",
    body: "Every link comes with a QR code, which is the easiest way to move a secret to a phone in the same room.",
  },
  {
    title: "Your own quiet history",
    body: "The links you make are listed in your browser only. There is no server side index of anyone's shares.",
  },
  {
    title: "Nothing to sign up for",
    body: "No account, no email, no analytics on what you share. Open the page and use it.",
  },
];
