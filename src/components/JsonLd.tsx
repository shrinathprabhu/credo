/**
 * Structured data is how answer engines and generative engines learn what Credo
 * is without guessing from the markup. Keep the wording here in step with the
 * visible copy so a model quoting one is quoting the other.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // The payload is built in this repo, never from user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
