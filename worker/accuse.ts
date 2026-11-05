import site from "../content/site.json";
import saisons from "../content/seasons.json";
import budget from "../content/budget.json";
import nordSud from "../content/itineraries/vietnam-du-nord-au-sud.json";
import montagnes from "../content/itineraries/montagnes-et-baies-du-nord.json";
import famille from "../content/itineraries/vietnam-en-famille.json";
import cambodge from "../content/itineraries/vietnam-et-cambodge.json";
import horsSentiers from "../content/itineraries/vietnam-authentique-hors-sentiers.json";
import signature from "../content/itineraries/vietnam-collection-signature.json";

/**
 * The first reply, written the moment the form is submitted.
 *
 * ## Why this exists
 *
 * A French traveller writes in the evening, which is the middle of the night in
 * Da Nang. Nobody answers until the next Vietnamese morning — six to eight
 * hours later at best. Meanwhile the same person has written to four other
 * agencies. Whoever answers first with something concrete sets the terms of the
 * comparison; everyone else is read against it.
 *
 * This reply leaves in seconds. It is not a quote and does not pretend to be:
 * it answers the part of the question that the site already answers in public,
 * and says when the priced itinerary follows.
 *
 * ## The rule that makes it safe
 *
 * Every sentence below is either fixed template text or a value read from
 * content/. Nothing is generated, inferred or rounded. A price quoted to a
 * consumer can bind in French law, so the only figures that appear are the ones
 * already published on the pages this person has just read — and when a lookup
 * finds nothing, the paragraph is dropped rather than filled in.
 *
 * That constraint is the whole design. A model asked to "write a nice reply"
 * would invent a hotel name or a transfer time, and would do it to someone
 * holding a 9,000 € budget.
 */

const CIRCUITS = [nordSud, montagnes, famille, cambodge, horsSentiers, signature];

export type Demande = {
  circuit: string;
  prenom: string;
  nom: string;
  email: string;
  depart: string;
  duree: string;
  voyageurs: string;
  gamme: string;
};

/** The trip this request is about: the one named by the hidden field if the
 *  visitor came from a trip page, otherwise the closest on duration. */
function choisirCircuit(d: Demande) {
  if (d.circuit) {
    const exact = CIRCUITS.find((t) => t.name === d.circuit);
    if (exact) return exact;
  }
  const jours = Number.parseInt(d.duree, 10);
  if (!Number.isFinite(jours)) return null;
  return CIRCUITS.reduce((a, b) =>
    Math.abs(b.days - jours) < Math.abs(a.days - jours) ? b : a,
  );
}

/* `<input type="month">` posts "2027-03". Anything else — including the empty
   value, which is what most people leave — gives no month and therefore no
   seasonal paragraph. */
function choisirSaison(depart: string) {
  const m = /^\d{4}-(\d{2})$/.exec(depart);
  if (!m) return null;
  const i = Number.parseInt(m[1], 10) - 1;
  return i >= 0 && i < saisons.length ? saisons[i] : null;
}

function choisirGamme(gamme: string) {
  const g = gamme.toLowerCase();
  return budget.find((b) => b.gamme.toLowerCase() === g) ?? null;
}

const euro = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

/* The same four words the season table prints on /quand-partir-au-vietnam.
   content/seasons.json stores `ideal`, `bon`, `moyen`, `deconseille` — values
   meant for a CSS class, not for a reader. Sent raw they arrived as
   « Centre : deconseille », which looks like a bug and is one. */
const NIVEAUX: Record<string, string> = {
  ideal: "Idéal",
  bon: "Bon",
  moyen: "Moyen",
  deconseille: "À éviter",
};
const niveau = (v: string) => NIVEAUX[v] ?? v;

/** Lowers the first letter only, leaving proper nouns alone. The inclusions are
 *  written as list items and start with a capital; strung into one sentence
 *  they read « …chambre double ; Les petits-déjeuners ; Un guide… ». */
const minuscule = (x: string) => x.charAt(0).toLowerCase() + x.slice(1);

/** "a, b et c" — the inclusions carry their own commas, so the separator rises
 *  to a semicolon exactly as it does on the trip pages. */
function liste(xs: string[]): string {
  if (xs.length <= 1) return xs[0] ?? "";
  if (xs.some((x) => x.includes(","))) return xs.join(" ; ");
  return `${xs.slice(0, -1).join(", ")} et ${xs[xs.length - 1]}`;
}

export function accuse(d: Demande): { sujet: string; texte: string } {
  const t = choisirCircuit(d);
  const s = choisirSaison(d.depart);
  const b = choisirGamme(d.gamme);
  const marque = `${site.name} ${site.byline}`;

  const blocs: string[] = [
    `Bonjour ${d.prenom},`,
    "Merci pour votre demande. Voici ce que nous pouvons déjà vous dire, " +
      "le temps de préparer votre devis.",
  ];

  if (s) {
    /* The month note is quoted as it stands on /quand-partir-au-vietnam. The
       three regional ratings follow it unchanged: a month that is "déconseillé"
       somewhere is announced as such, because finding it out on arrival is
       worse than reading it now. */
    blocs.push(
      `VOS DATES — ${s.month}\n` +
        `${s.note}\n` +
        `Nord : ${niveau(s.nord)} · Centre : ${niveau(s.centre)} · Sud : ${niveau(s.sud)}\n` +
        `Le calendrier des trois régions, mois par mois : ${site.url}/quand-partir-au-vietnam/`,
    );
  }

  if (t) {
    blocs.push(
      `LE CIRCUIT QUI S'EN APPROCHE\n` +
        `« ${t.name} » (${t.code}) : ${t.days} jours, à partir de ${euro(t.priceFrom)} € ` +
        `par personne, base deux voyageurs en chambre double.\n` +
        `Niveau ${t.niveau.toLowerCase()}. ${t.confort}.\n` +
        `Le programme jour par jour : ${site.url}/circuit-vietnam/${t.slug}/`,
      `CE QUE LE PRIX COMPREND\n${liste(t.included.slice(0, 5).map(minuscule))}.`,
      `CE QU'IL NE COMPREND PAS\n${liste(t.excluded.slice(0, 3).map(minuscule))}.`,
    );
  }

  if (b) {
    blocs.push(
      `L'ORDRE DE GRANDEUR\n` +
        `En gamme ${b.gamme.toLowerCase()} (${b.hotel}), comptez ${b.perDay} ` +
        `par personne et par jour, soit ${b.twoWeeks} pour deux semaines, ` +
        `hors vols internationaux.\n` +
        `Le détail poste par poste : ${site.url}/budget-voyage-vietnam/`,
    );
  }

  blocs.push(
    `LA SUITE\n` +
      `Votre devis chiffré — itinéraire jour par jour, hôtels nommés, prix ferme — ` +
      `vous parvient sous ${site.responseTime} ouvrées.\n` +
      `Ce programme est un point de départ : une étape en plus, un hôtel différent, ` +
      `deux jours de moins, nous le refaisons sans frais autant de fois qu'il le faut.`,
    `Ce message est automatique et ne vous engage à rien : il reprend ce que publie ` +
      `notre site, rien de plus. Les prix ci-dessus sont des points de départ, ` +
      `pas un devis. Répondez-y directement, votre message nous parvient.`,
    `${marque}\n${site.operator.legalName} — licence ${site.operator.license}\n${site.url}`,
  );

  const sujet = t
    ? `Votre voyage au Vietnam — « ${t.name} », première réponse`
    : "Votre voyage au Vietnam — première réponse";

  return { sujet, texte: blocs.join("\n\n") };
}

/**
 * Sends it.
 *
 * Deliberately swallows its own failures. The message that matters is the one
 * to the agency: a request that reaches nobody is a lost customer, while an
 * acknowledgement that fails to leave costs a first impression. Letting the
 * second break the first would trade the expensive loss for the cheap one.
 */
export async function envoyerAccuse(
  d: Demande,
  env: { RESEND_API_KEY: string; DEVIS_FROM: string },
): Promise<void> {
  const { sujet, texte } = accuse(d);

  /* The agency mail goes out as "Jasmin Travel"; this one carries the brand the
     visitor has just spent twenty minutes reading, and names the operator in
     the signature. Same verified address either way — only the display name
     changes, so nothing about SPF or DKIM moves. */
  const adresse = /<([^>]+)>/.exec(env.DEVIS_FROM)?.[1] ?? env.DEVIS_FROM;
  const from = `${site.name} ${site.byline} <${adresse}>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [d.email],
        /* Replies land on the routed address, not on a personal mailbox. */
        reply_to: site.email,
        subject: sujet,
        text: texte,
      }),
    });
    if (!r.ok) {
      console.warn("[quote] acknowledgement not sent", {
        status: r.status,
        detail: (await r.text()).slice(0, 300),
      });
    }
  } catch (e) {
    console.warn("[quote] acknowledgement failed", { error: String(e) });
  }
}
