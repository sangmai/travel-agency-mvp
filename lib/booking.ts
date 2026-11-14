/**
 * Where the money would come from, kept behind one interface.
 *
 * v1 emits plain deep links and nothing else: no script, no pixel, no iframe.
 * That is deliberate — the site sets no cookie at all, a decision documented in
 * app/layout.tsx and worth more than the commission. A bare <a href> stores
 * nothing on the visitor's machine; whatever Booking does once they arrive
 * happens on Booking's domain under Booking's own consent banner.
 *
 * The identifiers are empty because no affiliate account exists yet: Booking
 * routes applicants through CJ and may refuse a site this new. Until one is
 * approved the links still work and simply earn nothing, and `partenaire` is
 * null so the page knows not to print a disclosure it has not earned.
 *
 * This file is also the swap point. Replacing deep links with Booking's Demand
 * API means rewriting these two functions and nothing else — the planner never
 * learns which it got.
 */

export type LienPartenaire = {
  libelle: string;
  url: string;
  /** null until an affiliate account exists. The page hides the disclosure then. */
  partenaire: string | null;
};

/* Fill in once CJ, Klook and GetYourGuide have approved the account. */
const AID_BOOKING = "";
const AID_GETYOURGUIDE = "";

const q = (params: Record<string, string>) =>
  Object.entries(params)
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, "+")}`)
    .join("&");

export function hebergement(
  ville: string,
  arrivee: string,
  depart: string,
  voyageurs: number,
): LienPartenaire {
  return {
    libelle: `Voir les hébergements à ${ville}`,
    url:
      "https://www.booking.com/searchresults.html?" +
      q({
        ss: ville,
        checkin: arrivee,
        checkout: depart,
        group_adults: String(voyageurs),
        aid: AID_BOOKING,
      }),
    partenaire: AID_BOOKING ? "Booking.com" : null,
  };
}

/**
 * Experiences rather than beds, for two reasons that point the same way:
 * GetYourGuide pays roughly twice what a room does, and a traveller who has
 * left room in the itinerary has days to fill. Honest advice and the revenue
 * agree here, which is rare enough to be worth writing down.
 */
export function experiences(ville: string): LienPartenaire[] {
  return [
    {
      libelle: `Activités et excursions à ${ville}`,
      url:
        "https://www.getyourguide.com/s/?" +
        q({ q: ville, partner_id: AID_GETYOURGUIDE }),
      partenaire: AID_GETYOURGUIDE ? "GetYourGuide" : null,
    },
  ];
}

/**
 * The short list of things that genuinely sell out, and why.
 *
 * An explicit list rather than a flag derived from the data, because the honest
 * answer is short and saying so is the point: a tool that marks two items
 * urgent is believed, and one that marks ten is a shop. Hanoï, Hoi An and
 * Saïgon have thousands of rooms between them and belong in "can wait", which
 * costs us most of the accommodation commission and buys the only thing that
 * makes the rest of the page credible.
 *
 * Returns null for everywhere else — and null is the common case on purpose.
 */
export function aReserver(place: string): string | null {
  switch (place) {
    case "lan-ha":
    case "ha-long":
      return "Une trentaine de jonques, une quinzaine de cabines chacune. Elles partent deux mois à l'avance.";
    case "phong-nha":
      return "Les permis d'accès aux grottes sont limités en nombre chaque jour.";
    default:
      return null;
  }
}

/**
 * Whether any affiliate account exists yet. False today, so the page prints no
 * disclosure — claiming a commission we do not earn would be its own small lie,
 * on a page whose whole argument is that it tells the truth.
 */
export const AFFILIE = Boolean(AID_BOOKING || AID_GETYOURGUIDE);
