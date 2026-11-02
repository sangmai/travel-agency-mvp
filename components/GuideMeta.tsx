import { getSite } from "@/lib/content";
import type { Guide } from "@/lib/content";

/** "28 octobre 2026" — the form a visitor reads, not the ISO one. */
export function dateFr(iso: string) {
  const [a, m, j] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" })
    .format(new Date(Date.UTC(a, m - 1, j)));
}

/**
 * Publication line shown under the title.
 *
 * It exists for two readers at once. A visitor checking visa rules or prices
 * wants to know how old they are; a generative engine cites recent content far
 * more readily, and discards what it cannot date.
 *
 * The updated date is repeated only when it differs from publication:
 * "published and updated on the same day" teaches nobody anything.
 */
export async function GuideMeta({ guide }: { guide: Guide }) {
  const site = await getSite();
  const aJour = guide.dateModified !== guide.datePublished;

  return (
    <p className="guide__meta">
      Par {guide.author || site.name}
      {" · "}
      <time dateTime={guide.datePublished}>
        {aJour ? "Publié le " : "Publié le "}
        {dateFr(guide.datePublished)}
      </time>
      {aJour && (
        <>
          {" · "}
          <time dateTime={guide.dateModified}>
            Mis à jour le {dateFr(guide.dateModified)}
          </time>
        </>
      )}
    </p>
  );
}

/**
 * The JSON-LD `Article` node. The author is a `Person` when the agency has
 * named someone, the organisation itself otherwise — never a name invented to
 * fill a field.
 */
export function articleNode(guide: Guide, site: { url: string; name: string }) {
  const url = `${site.url}/${guide.slug}/`;
  return {
    "@type": "Article",
    "@id": `${url}#article`,
    headline: guide.title,
    description: guide.description,
    url,
    datePublished: guide.datePublished,
    dateModified: guide.dateModified,
    inLanguage: "fr-FR",
    author: guide.author
      ? { "@type": "Person", name: guide.author }
      : { "@id": `${site.url}/#organisation` },
    publisher: { "@id": `${site.url}/#organisation` },
    image: `${site.url}/photos/og/${guide.photo}.jpg`,
  };
}
