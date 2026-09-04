import { JsonLd } from "@/components/JsonLd";
import { PageHeader, Shell } from "@/components/PageHeader";
import { RevealSecret } from "@/components/RevealSecret";
import { pageMetadata } from "@/lib/metadata";
import { breadcrumbs, graph } from "@/lib/schema";

export const metadata = pageMetadata({
  title: "Open a secret",
  description:
    "Paste a Credo share id or link, enter the passphrase you were given, and the secret is decrypted in your own browser.",
  path: "/open",
  keywords: ["open an encrypted link", "decrypt a shared password"],
});

export default function OpenPage() {
  return (
    <>
      <JsonLd
        data={graph(
          breadcrumbs([
            { name: "Credo", path: "/" },
            { name: "Open a secret", path: "/open" },
          ]),
        )}
      />
      <Shell>
        <PageHeader
          eyebrow="Open"
          title="Unlock what somebody sent you"
          lead="Paste the id or the whole link, then the passphrase they gave you separately. The decryption runs in your browser, and nothing goes back to the server."
        />
        <RevealSecret />
      </Shell>
    </>
  );
}
