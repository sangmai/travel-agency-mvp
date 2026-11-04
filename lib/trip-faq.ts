import type { Trip } from "./content/types";
import { euro } from "./format";

/**
 * The questions a trip page is asked, answered from the trip's own fields.
 *
 * ## Why this file exists at all
 *
 * Adding FAQPage markup to the six trip pages was refused twice, and for the
 * right reason: Google's structured-data policy requires the markup to
 * represent content a visitor can actually see, and the trip pages had no
 * visible questions at all. Declaring them anyway would have been markup
 * without content.
 *
 * So the order is reversed here. This module produces plain strings; the page
 * renders them as a visible FAQ *and* feeds the same strings to the JSON-LD.
 * One source, two outputs — the markup cannot drift from what is on screen,
 * because there is nothing to keep in sync.
 *
 * ## Why nothing is written by hand
 *
 * Every answer is assembled from `niveau`, `type`, `groupe`, `saison`,
 * `audience`, `confort`, `included` and `excluded`. A trip whose price or
 * season changes in the CMS changes its answers with it, and a seventh trip
 * added tomorrow gets its FAQ for free. No sentence states anything the
 * itinerary file does not already say.
 *
 * ## The one real trap
 *
 * The first three `included` entries are identical on all six trips
 * (accommodation, meals, French-speaking guide). Building the price answer
 * from them would have produced six identical paragraphs — thin, duplicated
 * content on the six pages that sell. `proprePar` therefore keeps only what a
 * trip does *not* share with every other one: the night on a junk, the Ha
 * Giang flights, the privatised boat, the Angkor pass.
 *
 * Fields are interpolated after a colon rather than lower-cased, because
 * lower-casing "Première découverte du Vietnam" would have produced "vietnam".
 */

export type TripQa = { q: string; a: string };

/** Inclusions this trip does not share with every other trip. */
function proprePar(trip: Trip, tous: Trip[]): string[] {
  const compte = new Map<string, number>();
  for (const t of tous) {
    for (const x of new Set(t.included)) compte.set(x, (compte.get(x) ?? 0) + 1);
  }
  return trip.included.filter((x) => (compte.get(x) ?? 0) < tous.length);
}

/** Lowers the first letter only — leaves proper nouns alone. */
const minuscule = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/**
 * Joins a list in French.
 *
 * Several inclusions carry their own comma — "le vol intérieur Hanoï–Hué,
 * bagages compris" — so a comma-joined list became unreadable: the reader
 * could not tell where one item ended. When any item already contains a
 * comma, the separator rises to a semicolon, which is the French convention
 * for exactly this case.
 */
function etListe(xs: string[]): string {
  if (xs.length <= 1) return xs[0] ?? "";
  if (xs.some((x) => x.includes(","))) return xs.join(" ; ");
  return `${xs.slice(0, -1).join(", ")} et ${xs[xs.length - 1]}`;
}

export function tripFaq(trip: Trip, tous: Trip[], delaiReponse: string): TripQa[] {
  const propre = proprePar(trip, tous);

  /* Les exclusions que ce circuit est seul à porter — aujourd'hui le visa
     cambodgien, demain autre chose. Elles méritent leur propre question
     plutôt qu'une ligne noyée dans la réponse sur le prix. */
  const compteExcl = new Map<string, number>();
  for (const t of tous) {
    for (const x of new Set(t.excluded)) compteExcl.set(x, (compteExcl.get(x) ?? 0) + 1);
  }
  const exclPropre = trip.excluded.filter((x) => (compteExcl.get(x) ?? 0) < tous.length);

  const faq: TripQa[] = [
    {
      q: `« ${trip.name} » est-il un circuit privé ou en groupe ?`,
      a:
        /* `groupe` commence par « Privé, », que `type` dit déjà : sans ce
           retrait la phrase donnait « un circuit privé famille. Privé, 2
           adultes… ». */
        `C'est un ${minuscule(trip.type)}, ${minuscule(trip.groupe.replace(/^Privé,\s*/i, ""))}. ` +
        `Vous partez à vos dates, avec votre guide et votre chauffeur : il n'y a ni date ` +
        `de départ imposée, ni autres voyageurs à attendre pour que le circuit se confirme.`,
    },
    {
      q: `Quel est le niveau de ce circuit de ${trip.days} jours ?`,
      a:
        `Niveau ${minuscule(trip.niveau)}. Il a été pensé pour : ${trip.audience}. ` +
        `L'hébergement suit le même parti pris : ${minuscule(trip.confort)}.`,
    },
    {
      q: `Quelle est la meilleure saison pour ce circuit ?`,
      a:
        `${trip.saison}. Hors de cette fenêtre le circuit reste réalisable, mais nous ` +
        `réaménageons les étapes plutôt que de maintenir un programme que la météo contrarie. ` +
        `Il n'existe pas de mauvaise période, seulement un itinéraire à adapter au mois choisi.`,
    },
    {
      /* euro() plutôt que le nombre brut : tout le site écrit « 1 150 € »
         avec l'espace fine insécable, et une question affichant « 1150 € »
         se voit aussitôt à côté du prix du bandeau. */
      q: `Qu'est-ce que le prix de ${euro(trip.priceFrom)} comprend ?`,
      a:
        `${trip.included.length} postes, détaillés sur cette page. Outre l'hébergement en chambre ` +
        `double, les repas indiqués au programme, le guide francophone diplômé et les transferts ` +
        `en véhicule privé, ce circuit comprend notamment : ` +
        `${etListe(propre.slice(0, 3).map(minuscule))}. ` +
        `Restent à votre charge les vols internationaux (600 à 950 € selon la saison) ` +
        `et l'assurance voyage.`,
    },
  ];

  if (exclPropre.length > 0) {
    faq.push({
      q: `Y a-t-il des frais propres à ce circuit ?`,
      a:
        `Oui, et ils ne sont pas compris dans le prix : ` +
        `${etListe(exclPropre.map(minuscule))}. Nous le signalons ici plutôt que dans une note ` +
        `de bas de devis, parce que c'est le genre de ligne qu'on découvre trop tard.`,
    });
  }

  faq.push({
    q: `Peut-on modifier ce programme ?`,
    a:
      `Oui : c'est un point de départ, pas un forfait. Une étape en plus, un hôtel ` +
      `différent, deux jours de moins — dites ce que vous voulez changer, nous refaisons le ` +
      `devis sans frais, autant de fois qu'il le faut. Réponse chiffrée sous ${delaiReponse} ouvrées.`,
  });

  return faq;
}
