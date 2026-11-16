/**
 * Where the money would come from, kept behind one interface.
 *
 * v1 emits plain deep links and nothing else: no script, no pixel, no iframe.
 * That is deliberate — the site sets no cookie at all, a decision documented in
 * app/layout.tsx and worth more than the commission. A bare <a href> stores
 * nothing on the visitor's machine; whatever Booking does once they arrive
 * happens on Booking's domain under Booking's own consent banner.
 *
 * GetYourGuide is approved and live; Booking is not, since it routes
 * applicants through CJ and may yet refuse a site this new. The two are
 * independent: an identifier that is still empty produces a link that works
 * and earns nothing, with `partenaire` null so the page knows not to print a
 * disclosure it has not earned. Nothing has to be rewritten the day the
 * second one arrives.
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

/* GetYourGuide is live; Booking still has none. These are public identifiers —
   they travel in every outbound URL — which is why they sit in the source
   rather than in a Cloudflare secret like RESEND_API_KEY.

   Fill AID_BOOKING in once CJ has approved the account.

   Klook is not wired and is not named above for that reason: the spec prefers
   it for experiences, at 6.5 % against GetYourGuide's 8 % on a deeper
   Vietnamese catalogue, but adding a second partner is a decision with its own
   disclosure and its own link shape, not a line in this file. */
const AID_BOOKING = "";
const AID_GETYOURGUIDE = "GX9EJC1";

/* Klook needs two, and unlike GetYourGuide it does not take them as query
   parameters on its own pages at all: the link goes through a redirect on
   affiliate.klook.com carrying the destination in `k_site`. Both values and
   that shape are read off a link Klook's own tool generated — the form I had
   inferred from third-party write-ups would have tracked nothing. */
const KLOOK_WID = "143639";
const KLOOK_AID = "1572853";

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

/** One hand-picked activity, as stored in content/experiences.json. */
export type Experience = { titre: string; url: string };

/**
 * Experiences rather than beds, for two reasons that point the same way:
 * GetYourGuide pays roughly twice what a room does, and a traveller who has
 * left room in the itinerary has days to fill. Honest advice and the revenue
 * agree here, which is rare enough to be worth writing down.
 *
 * A hand-picked activity where we have one, a search page where we do not.
 * "Activités et excursions à Hoi An" is the least characteristic sentence on a
 * page that otherwise names the hour a train leaves and where the figure came
 * from; "My Son et la montagne de Marbre" is the page speaking in its own
 * voice, and it converts better for the same reason.
 *
 * The fallback is what makes an incomplete list safe: a place nobody has got
 * round to choosing for still produces a working link that earns, rather than
 * a gap.
 */
/**
 * Attaches the right tracking to a bare partner URL, chosen by host.
 *
 * One link per activity, never two. Offering the same excursion through two
 * sellers side by side asks the traveller to arbitrate a question they have no
 * way to answer, and the page loses more to the hesitation than it gains on
 * the better rate.
 *
 * Which partner a chosen activity uses is therefore a property of the
 * activity, not a global setting: whoever actually sells the best version of
 * that excursion gets the link.
 */
function tracer(url: string): { url: string; partenaire: string | null } {
  const sep = url.includes("?") ? "&" : "?";

  if (url.includes("getyourguide.com")) {
    return {
      url: url + sep + q({
        partner_id: AID_GETYOURGUIDE,
        /* GetYourGuide's own link builder emits this; it is the "placement"
           field of their form, and the value it gives an online publisher. */
        utm_medium: "online_publisher",
        /* Tags the link in the partner dashboard, so a booking traced back
           here can be told apart from one that came off a guide page. */
        cmp: "planificateur",
      }),
      partenaire: AID_GETYOURGUIDE ? "GetYourGuide" : null,
    };
  }

  if (url.includes("klook.com")) {
    /* Without the ids there is no redirect to build, so the bare Klook address
       goes out instead: it works, and it earns nothing, which is the honest
       state of a partner we have not signed with. */
    if (!KLOOK_WID || !KLOOK_AID) return { url, partenaire: null };
    return {
      url:
        "https://affiliate.klook.com/redirect?" +
        q({ aid: KLOOK_WID, aff_adid: KLOOK_AID, k_site: url }),
      partenaire: "Klook",
    };
  }

  /* An unknown host earns nothing and says nothing — better than a link that
     claims a commission through a partner we have no account with. */
  return { url, partenaire: null };
}

/**
 * Experiences rather than beds, for two reasons that point the same way: an
 * experience pays roughly twice what a room does, and a traveller who has left
 * room in the itinerary has days to fill. Honest advice and the revenue agree
 * here, which is rare enough to be worth writing down.
 *
 * A hand-picked activity where we have one, a search page where we do not.
 * "Activités et excursions à Hoi An" is the least characteristic sentence on a
 * page that otherwise names the hour a train leaves and where the figure came
 * from; "My Son et la montagne de Marbre" is the page speaking in its own
 * voice, and it converts better for the same reason.
 *
 * The fallback goes to GetYourGuide rather than Klook even though Klook's
 * Vietnamese catalogue is deeper: a French traveller knows the first name and
 * not the second, and on a search link the click-through is the bottleneck,
 * not the commission rate. Klook earns its place on individual activities
 * where it genuinely has the better one.
 */
export function experiences(
  placeId: string,
  ville: string,
  choisies: Record<string, Experience[]> = {},
): LienPartenaire[] {
  const propres = choisies[placeId] ?? [];

  if (propres.length) {
    return propres.map((x) => ({ libelle: x.titre, ...tracer(x.url) }));
  }

  const recherche = "https://www.getyourguide.com/s/?" + q({ q: ville });
  return [{ libelle: `Activités et excursions à ${ville}`, ...tracer(recherche) }];
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
 * Whether any affiliate account exists yet. True since GetYourGuide approved
 * the site, so the page now prints the disclosure — and printed none before,
 * because claiming a commission we did not earn would have been its own small
 * lie on a page whose whole argument is that it tells the truth.
 */
export const AFFILIE = Boolean(AID_BOOKING || AID_GETYOURGUIDE);
