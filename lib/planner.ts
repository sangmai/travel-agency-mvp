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
