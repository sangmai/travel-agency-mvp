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
  /** Daytime eaten by transport, in days. Does not include `vecue` legs. */
  joursPerdus: number;
};

/** Legs are stored one way round; travellers go both. */
export function trouverLeg(legs: Leg[], a: string, b: string): Leg | null {
  return (
    legs.find(
      (l) => (l.from === a && l.to === b) || (l.from === b && l.to === a),
    ) ?? null
  );
}

/**
 * The mode a traveller is offered first: the one costing fewest days, ties
 * broken by fewest hours. That ordering is what puts the Hanoï–Hué night train
 * ahead of the plane despite taking ten times longer — it consumes no daytime
 * and replaces a hotel night.
 */
export function modeDefaut(leg: Leg): LegMode | null {
  if (!leg.modes.length) return null;
  return [...leg.modes].sort(
    (x, y) => x.days - y.days || x.hours - y.hours,
  )[0];
}

export function bilan(plan: Plan, legs: Leg[]): Bilan {
  let nuitsPlacees = 0;
  let joursPerdus = 0;

  for (const e of plan.etapes) nuitsPlacees += e.nuits;

  for (let i = 0; i < plan.etapes.length - 1; i++) {
    const leg = trouverLeg(legs, plan.etapes[i].place, plan.etapes[i + 1].place);
    const m = leg ? modeDefaut(leg) : null;
    if (!m) continue;
    if (m.nuit) nuitsPlacees += 1;
    if (m.journee === "perdue") joursPerdus += m.days;
  }

  const nuitsDisponibles = plan.jours - 1;
  return {
    nuitsPlacees,
    nuitsDisponibles,
    reste: nuitsDisponibles - nuitsPlacees,
    joursPerdus,
  };
}
