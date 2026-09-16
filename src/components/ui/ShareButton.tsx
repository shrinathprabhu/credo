"use client";

import { Share2 } from "lucide-react";
import { canShareLink, shareLink } from "@/lib/share";
import { useClientFlag } from "@/lib/use-client-flag";
import { useToast } from "./Toast";

/**
 * Reserve the button's space while capabilities hydrate. Unsupported controls
 * stay invisible and unfocusable without moving the neighbouring buttons.
 */
export function ShareButton({
  url,
  title = "A secret shared with Credo",
  text = "Open this with the passphrase I sent you separately.",
  label = "Share",
  compact = false,
  className = "",
}: {
  url: string;
  title?: string;
  text?: string;
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  const toast = useToast();
  const available = useClientFlag(canShareLink);

  return (
    <button
      type="button"
      disabled={!available}
      style={{ visibility: available ? "visible" : "hidden" }}
      onClick={async () => {
        const outcome = await shareLink({ url, title, text });
        if (outcome === "failed") {
          toast("Your device would not open the share sheet. Copy the link instead.", "error");
        }
      }}
      aria-label={`${label} the link`}
      title={`${label} the link`}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-surface-2 text-ink-soft transition-colors hover:border-[var(--line-strong)] hover:text-ink ${
        compact ? "size-9 justify-center" : "h-9 px-3 text-[13px]"
      } ${className}`}
    >
      <Share2 size={15} />
      {compact ? null : <span>{label}</span>}
    </button>
  );
}
