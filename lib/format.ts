import siteJson from "@/content/site.json";

/**
 * Mise en forme locale, construite une fois depuis content/site.json.
 *
 * Elle était auparavant instanciée cinq fois dans quatre fichiers, avec
 * « fr-FR » et « EUR » écrits en dur à chaque fois, pendant que la virgule
 * décimale des notes était bricolée par `.toFixed(1).replace(".", ",")` dans
 * cinq autres. Rassembler ces choix ici est aussi ce qui rend une seconde
 * langue possible sans parcourir les composants.
 */
const { locale, currency } = siteJson;

const euroFmt = new Intl.NumberFormat(locale.replace("_", "-"), {
  style: "currency",
  currency,
  maximumFractionDigits: 0,
});

const monthYearFmt = new Intl.DateTimeFormat(locale.replace("_", "-"), {
  month: "long",
  year: "numeric",
});

const decimalFmt = new Intl.NumberFormat(locale.replace("_", "-"), {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const euro = (n: number) => euroFmt.format(n);
export const monthYear = (iso: string) => monthYearFmt.format(new Date(iso));
/** Note sur 5, virgule décimale comprise. */
export const score = (n: number) => decimalFmt.format(n);
