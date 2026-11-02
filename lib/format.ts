import siteJson from "@/content/site.json";

/**
 * Locale formatting, built once from content/site.json.
 *
 * It used to be instantiated five times across four files, with "fr-FR" and
 * "EUR" hard-coded each time, while the decimal comma on ratings was hacked in
 * with `.toFixed(1).replace(".", ",")` in five others. Gathering these choices
 * here is also what makes a second language possible without walking through
 * every component.
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
/** Rating out of 5, decimal comma included. */
export const score = (n: number) => decimalFmt.format(n);
