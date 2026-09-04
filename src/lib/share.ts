/**
 * Web Share helpers.
 *
 * The share sheet is the fastest way to move a link onto a phone or into a
 * different app, but it only exists on some platforms, so every entry point
 * here reports whether it is usable before anything renders a button.
 */

export function canShareLink(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export function canShareFiles(): boolean {
  return (
    canShareLink() &&
    typeof navigator.canShare === "function" &&
    (() => {
      try {
        const probe = new File(["credo"], "probe.png", { type: "image/png" });
        return navigator.canShare({ files: [probe] });
      } catch {
        return false;
      }
    })()
  );
}

export type ShareOutcomeState = "shared" | "cancelled" | "unsupported" | "failed";

export async function shareLink(data: {
  url: string;
  title?: string;
  text?: string;
}): Promise<ShareOutcomeState> {
  if (!canShareLink()) return "unsupported";
  try {
    await navigator.share({ title: data.title, text: data.text, url: data.url });
    return "shared";
  } catch (error) {
    // A dismissed sheet is a normal outcome, not something to complain about.
    return (error as { name?: string })?.name === "AbortError" ? "cancelled" : "failed";
  }
}

/** Shares a data URL as an image file, for handing over the QR code itself. */
export async function shareImage(
  dataUrl: string,
  fileName: string,
  data: { title?: string; text?: string } = {},
): Promise<ShareOutcomeState> {
  if (!canShareFiles()) return "unsupported";
  try {
    // Decoded by hand rather than through fetch(): a strict connect-src refuses
    // even same document data: and blob: URLs.
    const file = new File([dataUrlToBytes(dataUrl) as BlobPart], fileName, {
      type: mimeOf(dataUrl),
    });
    if (!navigator.canShare({ files: [file] })) return "unsupported";
    await navigator.share({ files: [file], title: data.title, text: data.text });
    return "shared";
  } catch (error) {
    return (error as { name?: string })?.name === "AbortError" ? "cancelled" : "failed";
  }
}

function mimeOf(dataUrl: string): string {
  const match = /^data:([^;,]+)/.exec(dataUrl);
  return match?.[1] || "image/png";
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(",");
  const payload = dataUrl.slice(comma + 1);
  const binary = dataUrl.slice(0, comma).includes(";base64")
    ? atob(payload)
    : decodeURIComponent(payload);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}
