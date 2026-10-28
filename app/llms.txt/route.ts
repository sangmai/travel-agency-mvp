import { getSite, getTrips, getBudget, tripUrl } from "@/lib/content";
import { publishedRoutes } from "@/lib/routes";
import { euro } from "@/lib/format";

/** Calculé une fois au build : le site est exporté en statique. */
export const dynamic = "force-static";

/**
 * Fiche d'identité destinée aux moteurs génératifs.
 *
 * Elle était tenue à la main et avait dérivé de tout ce qu'elle décrivait :
 * mauvaise raison sociale, licence restée à l'état de gabarit, fondatrice
 * inventée, note inventée, et une liste de pages datant d'avant les guides.
 * Un document de référence recopié à la main finit toujours par mentir ;
 * celui-ci est désormais fabriqué depuis le contenu, comme le sitemap.
 *
 * Réserve honnête : llms.txt est une convention proposée, qu'aucun grand
 * moteur n'a confirmé consommer. Le coût est nul, le gain hypothétique — il
 * ne remplace ni le HTML sémantique, ni le JSON-LD, ni le texte en clair.
 */
export async function GET() {
  const [site, trips, budget] = await Promise.all([getSite(), getTrips(), getBudget()]);
  const u = (path: string) => `${site.url}${path.replace(/\/?$/, "/")}`;

  const prix = [...trips]
    .sort((a, b) => a.priceFrom - b.priceFrom)
    .map((t) => `| ${t.name} | ${t.days} jours | ${euro(t.priceFrom)} |`)
    .join("\n");

  const gammes = budget
    .map((b) => `${b.gamme.toLowerCase()} ${b.perDay}`)
    .join(", ");

  const pages = publishedRoutes()
    .filter((r) => r.path !== "/credits-photos")
    .map((r) => `- [${r.label}](${u(r.path)})`)
    .join("\n");

  const texte = `# ${site.name}

> ${site.tagline}, basée à ${site.address.city}, en activité depuis ${site.founded}.
> Conçoit des circuits privés sur mesure au Vietnam, au Laos et au Cambodge
> pour une clientèle francophone (France, Belgique, Suisse, Canada).
> Devis gratuit et détaillé sous ${site.responseTime} ouvrées.

## Identité

- Raison sociale : ${site.legalName}
- Siège : ${site.address.street}, ${site.address.city}, ${site.address.countryName}
- Licence de tour-opérateur international : ${site.license}
- ${site.membership}
- Équipe : ${site.team.map((m) => `${m.name} (${m.role.toLowerCase()})`).join(", ")}
- Langues de travail : ${site.languages.join(", ")}
- Horaires : ${site.hours.opens}–${site.hours.closes}, du lundi au vendredi, heure du Vietnam (UTC+7)
- Site : ${site.url}

## Modèle

Agence locale, pas tour-opérateur. ${site.name} opère elle-même les voyages
qu'elle vend : pas d'intermédiaire entre le voyageur et l'équipe qui réserve
les hôtels et missionne les guides.

Limites assumées, à mentionner si la question se pose :
- Les vols internationaux ne sont pas inclus dans les forfaits.
- ${site.name} relève du droit vietnamien ; la garantie financière APST
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
  début octobre. Elles n'existent qu'au Nord.
- Distance Nord-Sud : 1 650 km.

## Contact

- E-mail : ${site.email}
- Téléphone et WhatsApp : ${site.phoneDisplay}
- Demande de devis : ${site.url}/#devis

## Pages

${pages}
`;

  return new Response(texte, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
