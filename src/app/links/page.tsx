import type { Metadata } from "next";
import { LinkVault } from "@/components/LinkVault";
import { PageHeader, Shell } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "My links",
  description:
    "The links you created, listed from your own browser storage. Copy any of them, show a QR code, or clear the list.",
  robots: { index: false, follow: true },
};

export default function LinksPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="My links"
        title="Everything you have sent"
        lead="Kept in this browser and nowhere else. Copy a link, show its code for a phone in the room, or drop entries you are done with."
      />
      <LinkVault />
    </Shell>
  );
}
