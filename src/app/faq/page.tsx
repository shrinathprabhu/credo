import { FaqList } from "@/components/FaqList";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader, Shell } from "@/components/PageHeader";
import { FAQ } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { breadcrumbs, faqPage, graph } from "@/lib/schema";
import { SITE_URL } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Questions about Credo",
  description:
    "Direct answers about how Credo encrypts, what it stores, how long links last, what happens to a lost passphrase, and how it compares to sending a password over chat.",
  path: "/faq",
  keywords: [
    "how does encrypted link sharing work",
    "is it safe to share passwords online",
    "expiring secret link questions",
  ],
});

export default function FaqPage() {
  return (
    <>
      <JsonLd
        data={graph(
          faqPage(FAQ, `${SITE_URL}/faq#faq`),
          breadcrumbs([
            { name: "Credo", path: "/" },
            { name: "Questions", path: "/faq" },
          ]),
        )}
      />
      <Shell>
        <PageHeader
          eyebrow="Questions"
          title="Answers, without the sales pitch"
          lead="If something here is unclear or turns out to be wrong, that is worth knowing about. The security page goes deeper into the cryptography."
        />
        <FaqList entries={FAQ} />
      </Shell>
    </>
  );
}
