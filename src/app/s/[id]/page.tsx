import { KeyRound } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader, Shell } from "@/components/PageHeader";
import { RevealSecret } from "@/components/RevealSecret";

export const metadata: Metadata = {
  title: "Open a shared secret",
  description:
    "Someone sent you an encrypted Credo share. Enter the passphrase to decrypt it in your browser.",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Every share page renders the same shell, so let the first request for an id
 * generate it and keep it cached from then on. Nothing about the encrypted
 * record is rendered on the server.
 */
export const dynamicParams = true;
export const revalidate = false;

export function generateStaticParams() {
  return [] as { id: string }[];
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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

      <RevealSecret initialId={id} />
    </Shell>
  );
}
