import { getSite } from "@/lib/content";
import type { Guide } from "@/lib/content";

/** « 28 octobre 2026 » — le format que lit un visiteur, pas l'ISO. */
export function dateFr(iso: string) {
  const [a, m, j] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" })
    .format(new Date(Date.UTC(a, m - 1, j)));
}

/**
 * Ligne de publication affichée sous le titre.
 *
 * Elle existe pour deux lecteurs à la fois. Un visiteur qui consulte des
 * règles de visa ou des prix veut savoir de quand ils datent ; un moteur
 * génératif cite nettement plus volontiers un contenu récent, et écarte ce
 * qu'il ne peut pas dater.
 *
 * La date de mise à jour n'est répétée que si elle diffère de la publication :
 * « publié et mis à jour le même jour » n'apprend rien.
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
 * Nœud `Article` du JSON-LD. L'auteur est une `Person` quand l'agence a nommé
 * quelqu'un, l'organisation elle-même sinon — jamais un nom inventé pour
 * remplir un champ.
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
