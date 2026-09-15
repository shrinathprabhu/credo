import { KeyRound } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageHeader, Shell } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Open a shared secret",
  description:
    "Someone sent you an encrypted Credo share. Enter the passphrase to decrypt it in your browser.",
  robots: { index: false, follow: false, nocache: true },
};

export function SharedSecretPage({ children }: { children: ReactNode }) {
  return (
    <Shell>
      <PageHeader
        eyebrow="Sealed share"
        title="Someone sent you something private"
        lead="It is sitting in the vault as ciphertext. Type the passphrase they gave you and your browser will open it locally."
      />

      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-[var(--line)] bg-surface-2 p-3.5">
        <KeyRound size={15} className="mt-0.5 shrink-0 text-brand" />
        <p className="text-[12.5px] leading-relaxed text-ink-soft">
          The passphrase is not in this link and never was. If you do not have it, go back
          to whoever sent you the link and ask on a different channel.
        </p>
      </div>

      {children}
    </Shell>
  );
}
