/**
 * Renders structured data as <script type="application/ld+json">.
 * "<" is escaped so user-provided strings (titles, abstracts) can never close
 * the script tag early.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
