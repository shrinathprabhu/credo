"use client";

import { Download, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "./Toast";
import { canShareFiles, shareImage } from "@/lib/share";
import { useClientFlag } from "@/lib/use-client-flag";

/**
 * Renders the share link as a scannable code. The plate stays white in both
 * themes because scanners want contrast far more than they want a dark mode.
 */
export function QrCode({
  value,
  size = 200,
  fileName = "credo-link.png",
  showDownload = true,
}: {
  value: string;
  size?: number;
  fileName?: string;
  showDownload?: boolean;
}) {
  // The rendered code is tagged with the value it was drawn for, so a changed
  // link shows the skeleton again without resetting state inside the effect.
  const [drawn, setDrawn] = useState<{ value: string; src: string | null; failed: boolean }>({
    value,
    src: null,
    failed: false,
  });
  const canShare = useClientFlag(canShareFiles);
  const toast = useToast();

  const src = drawn.value === value ? drawn.src : null;
  const failed = drawn.value === value ? drawn.failed : false;

  useEffect(() => {
    let alive = true;

    import("qrcode")
      .then((mod) =>
        mod.toDataURL(value, {
          errorCorrectionLevel: "M",
          margin: 1,
          scale: 10,
          color: { dark: "#0b1512ff", light: "#ffffffff" },
        }),
      )
      .then((url) => {
        if (alive) setDrawn({ value, src: url, failed: false });
      })
      .catch(() => {
        if (alive) setDrawn({ value, src: null, failed: true });
      });

    return () => {
      alive = false;
    };
  }, [value]);

  if (failed) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-dashed border-[var(--line-strong)] p-4 text-center text-[12px] text-ink-faint"
        style={{ width: size, height: size }}
      >
        The code could not be drawn. The link above still works.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative overflow-hidden rounded-2xl bg-white p-2.5 shadow-[0_18px_50px_-30px_rgb(0_0_0/0.8)]"
        style={{ width: size, height: size }}
      >
        {src ? (
          <img
            src={src}
            alt="QR code for the Credo share link"
            width={size}
            height={size}
            className="size-full rounded-xl"
          />
        ) : (
          <div className="sweep relative size-full overflow-hidden rounded-xl bg-[#eef1ef]" />
        )}
      </div>

      {src ? (
        <div className="flex items-center gap-4">
          {showDownload ? (
            <a
              href={src}
              download={fileName}
              onClick={() => toast("Saving the code as a PNG", "info")}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:text-brand"
            >
              <Download size={13} />
              Save the code
            </a>
          ) : null}

          {canShare ? (
            <button
              type="button"
              onClick={async () => {
                const outcome = await shareImage(src, fileName, {
                  title: "A secret shared with Credo",
                  text: "Scan this, then use the passphrase I sent you separately.",
                });
                if (outcome === "failed" || outcome === "unsupported") {
                  toast("Sharing the image did not work here. Save it instead.", "error");
                }
              }}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:text-brand"
            >
              <Share2 size={13} />
              Share the code
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
