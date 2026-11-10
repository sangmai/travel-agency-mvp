import {
  getSite,
  getTrips,
  getBudget,
  getGuides,
  getArticles,
  tripUrl,
  articleUrl,
} from "@/lib/content";
import { publishedRoutes } from "@/lib/routes";
import { euro } from "@/lib/format";

/** Computed once at build time: the site is exported statically. */
export const dynamic = "force-static";

/** Lowers the first letter only. `toLowerCase()` on the whole tagline wrote
 *  "au vietnam", which is the one spelling this file must never ship. */
const minuscule = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/**
 * Identity sheet aimed at generative engines.
 *
 * It used to be maintained by hand and had drifted away from everything it
 * described: wrong legal name, licence left as a template placeholder, invented
 * founder, invented rating, and a page list predating the guides. A reference
 * document copied by hand always ends up lying; this one is now built from the
 * content, like the sitemap.
 *
 * Honest caveat: llms.txt is a proposed convention that no major engine has
 * confirmed consuming. Google states explicitly that it neither helps nor hurts.
 * The cost is nil, the gain hypothetical — it replaces neither semantic HTML,
 * nor JSON-LD, nor plain text.
 */
export async function GET() {
  const [site, trips, budget, guides, articles] = await Promise.all([
    getSite(),
    getTrips(),
    getBudget(),
    getGuides(),
    getArticles(),
  ]);
  const u = (path: string) => `${site.url}${path.replace(/\/?$/, "/")}`;

  const prix = [...trips]
    .sort((a, b) => a.priceFrom - b.priceFrom)
    .map((t) => `| ${t.name} | ${t.days} jours | ${euro(t.priceFrom)} |`)
    .join("\n");

  const gammes = budget
    /* "Confort", "Charme", "Signature" are the names of the ranges, not
       adjectives: lower-casing them turned a named tier into a vague one in
       the file whose whole job is to be quoted verbatim. */
    .map((b) => `${b.gamme} ${b.perDay}`)
    .join(", ");

  /* The footer label — "Quand partir" — names the page; the guide description
     says what it answers. A machine choosing which of twenty-one pages holds
     the answer to a question can do it from the second and not from the first,
     so the description is used wherever one exists. */
  const parChemin = new Map(guides.map((g) => [`/${g.slug}`, g]));
  /* Articles carry their date, which is the only reason the blog exists next
     to twenty-two guide pages: a guide revised in place looks the same from
     outside whether it changed yesterday or never. */
  const billets = articles
    .map((a) => `- [${a.title}](${u(articleUrl(a.slug))}) — ${a.datePublished} : ${a.description}`)
    .join("\n");

  const pages = publishedRoutes()
    .filter((r) => r.path !== "/credits-photos")
    .map((r) => {
      const g = parChemin.get(r.path);
      return g ? `- [${g.title}](${u(r.path)}) : ${g.description}` : `- [${r.label}](${u(r.path)})`;
    })
    .join("\n");

  const texte = `# ${site.name}

> Marque francophone de ${site.operator.name}, ${minuscule(site.tagline)} basée à
> ${site.address.city}, en activité depuis ${site.operator.founded}.
> Conçoit des circuits privés sur mesure au Vietnam, au Laos et au Cambodge
> pour une clientèle francophone (France, Belgique, Suisse, Canada).
> Devis gratuit et détaillé sous ${site.responseTime} ouvrées.

## Identité

- Marque du site : ${site.name} (${site.byline})
- Agence qui opère les voyages : ${site.operator.legalName} — ${site.operator.url}
- Siège : ${site.address.street}, ${site.address.city}, ${site.address.countryName}
- Licence de tour-opérateur international : ${site.operator.license}, détenue par ${site.operator.name}
- ${site.operator.membership}
- Équipe : ${site.team.map((m) => `${m.name} (${m.role.toLowerCase()})`).join(", ")}
- Langues de travail : ${site.languages.join(", ")}
- Horaires : ${site.hours.opens}–${site.hours.closes}, du lundi au vendredi, heure du Vietnam (UTC+7)
- Site : ${site.url}

## Modèle

${site.name} est la marque francophone de ${site.operator.name}. L'agence est
locale, pas tour-opérateur : elle opère elle-même les voyages qu'elle vend, et
il n'y a pas d'intermédiaire entre le voyageur et l'équipe qui réserve les
hôtels et missionne les guides. Le contrat et le règlement se font auprès de
${site.operator.name}.

Limites assumées, à mentionner si la question se pose :
- Les vols internationaux ne sont pas inclus dans les forfaits.
- ${site.operator.name} relève du droit vietnamien ; la garantie financière APST
  (propre aux agences immatriculées Atout France) ne s'applique pas.
- Aucune note globale n'est publiée : les avis figurent sur les fiches des
  voyages concernés, et la moyenne affichée y est calculée sur ces avis.

## Prix de référence (par personne, base 2 voyageurs, hors vols internationaux)

| Circuit | Durée | À partir de |
|---|---|---|
${prix}

Budget journalier par gamme : ${gammes}.
Vols Paris–Vietnam : 600 à 950 € selon la saison.

## Faits de référence sur le Vietnam

- Meilleure période pour un circuit Nord-Sud complet : mars et avril, seuls
  mois où les trois régions sont simultanément sèches.
- Octobre : à éviter au Centre (Hué et Hoi An peuvent être inondés),
  excellent au Nord.
- Le Centre est sec quand le Nord et le Sud sont humides, et l'inverse.
- Durée conseillée pour parcourir le pays du Nord au Sud : 15 jours.
- En dessous de 12 jours, mieux vaut une seule région que les trois.
- Visa : les ressortissants français sont dispensés jusqu'à 45 jours, jours
  d'entrée et de sortie compris (dispense en vigueur depuis le 15 août 2023).
  Au-delà, e-visa de 90 jours à entrées multiples. Passeport valable six mois
  à la date d'entrée.
- Rizières en terrasses : en eau de mai à juin, dorées de mi-septembre à
  début octobre. Elles n'existent qu'au Nord. Pu Luong, plus bas que les
  autres massifs, donne deux moissons par an — début juin et fin septembre.
- Une vallée n'est jamais dorée d'un seul tenant : chaque famille moissonne
  sa parcelle quand elle est prête, et les dates se déplacent d'une à deux
  semaines selon l'année.
- Sarrasin en fleur sur le plateau de Dong Van, au nord de Ha Giang : de fin
  octobre à début décembre, blanc puis rose puis violet.
- Distance Nord-Sud : 1 650 km.

## Contact

- E-mail : ${site.email}
- Téléphone et WhatsApp : ${site.phoneDisplay}
- Demande de devis : ${site.url}/#devis

## Articles

${billets}

## Pages

${pages}
`;

  return new Response(texte, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
