/**
 * The planner's arithmetic, and nothing else.
 *
 * This file imports nothing on purpose. `node --test` does not resolve the
 * `@/*` alias, so an import here would cost the ability to test the only part
 * of the planner where a mistake is silent — a wrong sum does not throw, it
 * just sends someone to Ha Giang with four days too few.
 *
 * Every function takes its data as an argument. The page loads JSON through
 * lib/content and passes it in.
 */

export type Region = "nord" | "centre" | "sud";

export type SaisonRow = {
  month: string;
  nord: string;
  centre: string;
  sud: string;
  note: string;
};

export type Lieu = {
  id: string;
  fr: string;
  lat: number;
  nuits: { min: number; ideal: number };
};

/**
 * Vietnam's three climates are latitudinal bands, which is why seasons.json is
 * organised by them and why a coordinate is enough to place a town in one. The
 * boundaries sit in empty space: no place in places.json falls between 13 and
 * 15.88, nor between 17.59 and 19.
 *
 * Cambodia would come out as "sud" and be wrong about it; v1 is Vietnam only,
 * and the caller passes Vietnamese places.
 */
export function region(lat: number): Region {
  if (lat >= 19) return "nord";
  if (lat >= 13) return "centre";
  return "sud";
}

/** Empty string when the month is unknown: a missing verdict must not read as a bad one. */
export function verdictSaison(
  saisons: SaisonRow[],
  mois: string,
  r: Region,
): string {
  const ligne = saisons.find((s) => s.month === mois);
  return ligne ? ligne[r] : "";
}

export type LegMode = {
  mode: string;
  hours: number;
  days: number;
  journee: "perdue" | "vecue";
  nuit?: boolean;
  note: string;
  source: string;
};

export type Leg = { from: string; to: string; modes: LegMode[] };

export type Etape = { place: string; nuits: number };

export type Plan = {
  jours: number;
  mois: string;
  voyageurs: number;
  etapes: Etape[];
};

export type Bilan = {
  /** Nights needing a bed, including nights spent aboard a train or bus. */
  nuitsPlacees: number;
  /** A trip of N days holds N − 1 nights. */
  nuitsDisponibles: number;
  /** Negative when the itinerary does not fit. */
  reste: number;
  /**
   * Legs the data holds nothing about, as `"from → to"`.
   *
   * They used to be skipped in silence, which made Lan Ha → Hué — seven hundred
   * kilometres — cost nothing at all, and let the planner call a trip
   * comfortable that had an unaccounted crossing of the country in it. Silence
   * is the one answer a tool built to say no may never give.
   */
  inconnus: string[];
};

/** Legs are stored one way round; travellers go both. */
export function trouverLeg(legs: Leg[], a: string, b: string): Leg | null {
  return (
    legs.find(
      (l) => (l.from === a && l.to === b) || (l.from === b && l.to === a),
    ) ?? null
  );
}

/** `vecue` sorts ahead of `perdue`. */
const RANG_JOURNEE: Record<"vecue" | "perdue", number> = { vecue: 0, perdue: 1 };

/**
 * The mode a traveller is offered first, decided on three levels in order:
 * fewest days, then a day worth living over a day merely endured, then fewest
 * hours.
 *
 * The first level is what puts the Hanoï–Hué night train ahead of the plane
 * despite taking ten times longer: it consumes no daytime and replaces a hotel
 * night.
 *
 * The second exists because sorting on hours alone sent travellers through the
 * Hai Van tunnel. Tunnel and coastal train cost the same quarter-day; the
 * tunnel is thirty-six minutes quicker and the train is the finest stretch of
 * railway in the country. A tool optimising for speed would save the half-hour
 * and quietly take the journey away, which is the exact failure the `journee`
 * field was added to prevent — it was guarding the rhythm gauge, and the
 * default mode walked into the trap behind its back.
 */
export function modeDefaut(leg: Leg): LegMode | null {
  if (!leg.modes.length) return null;
  return [...leg.modes].sort(
    (x, y) =>
      x.days - y.days ||
      RANG_JOURNEE[x.journee] - RANG_JOURNEE[y.journee] ||
      x.hours - y.hours,
  )[0];
}

export function bilan(plan: Plan, legs: Leg[]): Bilan {
  let nuitsPlacees = 0;
  const inconnus: string[] = [];

  for (const e of plan.etapes) nuitsPlacees += e.nuits;

  for (let i = 0; i < plan.etapes.length - 1; i++) {
    const depuis = plan.etapes[i].place;
    const vers = plan.etapes[i + 1].place;
    const leg = trouverLeg(legs, depuis, vers);
    const m = leg ? modeDefaut(leg) : null;
    if (!m) {
      inconnus.push(`${depuis} → ${vers}`);
      continue;
    }
    if (m.nuit) nuitsPlacees += 1;
  }

  const nuitsDisponibles = plan.jours - 1;
  return {
    nuitsPlacees,
    nuitsDisponibles,
    reste: nuitsDisponibles - nuitsPlacees,
    inconnus,
  };
}

export type Rythme = {
  etapes: number;
  /** Suitcases packed. One fewer than the number of étapes. */
  changements: number;
  heuresTransport: number;
  /**
   * The hours held against the traveller: `perdue` only.
   *
   * `heuresTransport` is what to print — a traveller spending six hours on the
   * col des Nuages did spend six hours in a car, and saying otherwise would be
   * a lie. This is what to judge by, and the two differ by exactly the stretch
   * of the trip that was the point of taking it.
   */
  heuresSubies: number;
  /** Days with no transport at all. The point of a holiday. */
  joursLibres: number;
  tendu: boolean;
};

/**
 * The second gauge, and the one no competitor has.
 *
 * An itinerary can fit its days exactly and still be a bad holiday: seven
 * étapes in fifteen days means a suitcase every two mornings. Days are
 * arithmetic; rhythm is whether the arithmetic was worth doing.
 *
 * Only `perdue` days count against the traveller. A day on the Hai Van pass IS
 * the journey, and penalising it would push people through the tunnel to save
 * ninety minutes and rob them of the best road in the country.
 *
 * The three thresholds are judgements, not measurements. They are set so that
 * the two itineraries weighed during design fall on opposite sides, and they
 * belong in one place so they can be argued with.
 */
export function rythme(plan: Plan, legs: Leg[]): Rythme {
  let heuresTransport = 0;
  let heuresSubies = 0;

  for (let i = 0; i < plan.etapes.length - 1; i++) {
    const leg = trouverLeg(legs, plan.etapes[i].place, plan.etapes[i + 1].place);
    const m = leg ? modeDefaut(leg) : null;
    if (!m) continue;
    heuresTransport += m.hours;
    /* A berth's hours are not endured, they are slept through. Counting them
       made the gauge contradict the page's own headline advice — and `tendu`
       fires on this number alone, so the Hanoï–Hué sleeper was by itself enough
       to condemn a trip the design calls restful. Eight hours is the night; what
       is left over is the morning that really is spent travelling. */
    if (m.journee === "perdue") heuresSubies += m.nuit ? Math.max(0, m.hours - 8) : m.hours;
  }

  const etapes = plan.etapes.length;
  /* A stop of N nights buys N−1 whole days there; a one-night stop buys none.
     The previous formula subtracted travel from the trip length and returned
     twelve or thirteen for every itinerary ever built, which would have printed
     "13 journées sans bouger" above a seven-stop forced march and cost the
     reader's trust in one line. */
  const joursLibres = plan.etapes.reduce((n, e) => n + Math.max(0, e.nuits - 1), 0);
  const arrondi = (h: number) => Math.round(h * 10) / 10;

  return {
    etapes,
    changements: Math.max(0, etapes - 1),
    heuresTransport: arrondi(heuresTransport),
    heuresSubies: arrondi(heuresSubies),
    joursLibres,
    tendu: etapes - 1 > 5 || heuresSubies > 20 || joursLibres < 2,
  };
}

export type Retrait = {
  /** French label shown to the traveller. */
  libelle: string;
  places: string[];
  /** Nights this would free. */
  nuits: number;
};

const NOM_REGION: Record<Region, string> = {
  nord: "le Nord",
  centre: "le Centre",
  sud: "le Sud",
};

/**
 * What has to go, when the itinerary does not fit.
 *
 * This is the whole product. An agency configurator has no reason to tell
 * anyone to do less, which is exactly why a tool that does is believed. It
 * proposes and never applies: the traveller decides, and the options are
 * ordered by how closely each one covers the shortfall, so the cheapest
 * sacrifice is read first.
 *
 * Grouping is by region rather than by étape because that is how the loss is
 * actually felt — nobody drops Hué and keeps Hoi An.
 */
export function retraits(
  plan: Plan,
  lieux: Lieu[],
  manque: number,
): Retrait[] {
  if (manque <= 0) return [];

  const par: Record<string, { places: string[]; nuits: number }> = {};
  for (const e of plan.etapes) {
    const lieu = lieux.find((l) => l.id === e.place);
    if (!lieu) continue;
    const r = region(lieu.lat);
    par[r] ??= { places: [], nuits: 0 };
    par[r].places.push(e.place);
    par[r].nuits += e.nuits;
  }

  return Object.entries(par)
    .map(([r, v]) => ({
      libelle: `Retirer ${NOM_REGION[r as Region]}`,
      places: v.places,
      nuits: v.nuits,
    }))
    .sort((a, b) => {
      // Options that cover the shortfall come first, smallest of them leading;
      // those that fall short follow, largest first.
      const sa = a.nuits >= manque, sb = b.nuits >= manque;
      if (sa !== sb) return sa ? -1 : 1;
      return sa ? a.nuits - b.nuits : b.nuits - a.nuits;
    });
}

/**
 * The plan lives in the URL and nowhere else.
 *
 * A static export has no database to put it in, and that turns out to be the
 * right answer rather than a constraint: a plan in the address bar is
 * shareable, bookmarkable, and still there in six weeks when the traveller is
 * finally ready to book — which matters, because affiliate cookies last about
 * a day and the French book their hotels late.
 *
 * The format stays legible on purpose. Someone pasting it into a message can
 * see it is their trip.
 */
export function encoder(plan: Plan): string {
  const etapes = plan.etapes.map((e) => `${e.place}-${e.nuits}`).join(",");
  return `${plan.jours}/${plan.mois}/${plan.voyageurs}/${etapes}`;
}

const ENTIER = /^\d+$/;

export function decoder(s: string): Plan | null {
  const parts = s.split("/");
  if (parts.length !== 4) return null;
  const [j, mois, v, etapesRaw] = parts;
  if (!ENTIER.test(j) || !ENTIER.test(v) || !mois || !etapesRaw) return null;

  const jours = Number(j);
  const voyageurs = Number(v);
  /* The URL is this feature's whole persistence mechanism, so it is also the
     one input certain to arrive pasted, truncated and mangled. Syntax was
     checked; magnitude was not, and the gauge renders one element per night. */
  if (jours < 5 || jours > 30 || voyageurs < 1 || voyageurs > 12) return null;

  const etapes: Etape[] = [];
  for (const bout of etapesRaw.split(",")) {
    const coupe = bout.lastIndexOf("-");
    if (coupe < 1) return null;
    const place = bout.slice(0, coupe);
    const nuits = bout.slice(coupe + 1);
    if (!place || !ENTIER.test(nuits)) return null;
    const n = Number(nuits);
    if (n < 1 || n > 30) return null;
    etapes.push({ place, nuits: n });
  }

  return { jours, mois, voyageurs, etapes };
}

/**
 * What a numeric field should commit while the traveller is still typing.
 *
 * Returns null for "not a usable number yet — keep whatever is committed and
 * let them carry on typing".
 *
 * The field used to clamp on every keystroke, which read as the input being
 * broken: on the way to 15 the first keypress produced "1", below the minimum
 * of 5, so the value was rewritten to 5 before the second digit arrived. The
 * caret then sat after a digit nobody had typed and 15 was unreachable from
 * the keyboard entirely — only the spinner arrows could reach most of the
 * valid range.
 *
 * Clamping was the right instinct in the wrong place. `min` and `max` on the
 * element are hints a typed value walks straight past, so the bound does have
 * to be enforced in code; it just has to be enforced when the value is
 * committed, not while it is being composed.
 *
 * The regex rather than Number() alone: Number("1e3") is 1000 and
 * Number(" 12 ") is 12, neither of which anyone typed on purpose.
 */
export function saisie(brut: string, bas: number, haut: number): number | null {
  if (!/^\d+$/.test(brut)) return null;
  const n = Number(brut);
  return n >= bas && n <= haut ? n : null;
}
