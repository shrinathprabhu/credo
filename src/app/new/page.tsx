import { ComposeSecret } from "@/components/ComposeSecret";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader, Shell } from "@/components/PageHeader";
import { pageMetadata } from "@/lib/metadata";
import { breadcrumbs, graph, howTo } from "@/lib/schema";

export const metadata = pageMetadata({
  title: "Share a secret",
  description:
    "Encrypt a note, password, API key or small file in your browser and get a share link with a QR code that expires on its own. The passphrase never leaves your device.",
  path: "/new",
  keywords: [
    "share a password securely",
    "send an encrypted file",
    "create an expiring secret link",
  ],
});

export default function NewSharePage() {
  return (
    <>
      <JsonLd
        data={graph(
          howTo,
          breadcrumbs([
            { name: "Credo", path: "/" },
            { name: "Share a secret", path: "/new" },
          ]),
        )}
      />
      <Shell>
        <PageHeader
          eyebrow="Share"
          title="Seal it, then send the link"
          lead="Write the secret or attach a file, pick a passphrase, and choose how long the link should live. Everything is encrypted here, in this tab, before a single byte is uploaded."
        />
        <ComposeSecret />
      </Shell>
    </>
  );
}
