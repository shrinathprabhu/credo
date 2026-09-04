import { WifiOff } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { Shell } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Offline",
  description: "Credo cannot reach the vault right now.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <Shell narrow>
      <div className="card p-8 text-center sm:p-12">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-surface-2 text-ink-faint">
          <WifiOff size={22} />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold text-ink">You are offline</h1>
        <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-ink-soft">
          The interface is cached on this device, but creating or opening a share needs a
          connection, because the encrypted record lives in the cloud. Reconnect and try
          again.
        </p>
        <div className="mt-7 flex justify-center">
          <ButtonLink href="/" variant="secondary">
            Back to the start
          </ButtonLink>
        </div>
      </div>
    </Shell>
  );
}
