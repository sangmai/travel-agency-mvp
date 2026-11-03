#!/usr/bin/env node
/**
 * Fails the build when the Tết table is about to run out.
 *
 * /tet-vietnam states a date in its headline and its JSON-LD Event. The site is
 * a static export, so that date is baked into the HTML: once the first row of
 * the table is in the past, the page announces a Tết that has already happened
 * and keeps doing so until somebody notices.
 *
 * Nobody notices. That is the whole problem with dated content — it does not
 * break, it just quietly becomes false. So the build refuses to pass while
 * fewer than two future dates remain, which leaves roughly a year of margin to
 * extend the table.
 *
 * To extend it: recompute with Hồ Ngọc Đức's algorithm on UTC+7 (see the
 * comment at the top of app/tet-vietnam/page.tsx), never by copying Chinese New
 * Year dates — the two differ in some years, 2030 among them.
 */
import { readFileSync } from "node:fs";

const MINIMUM = 2;
const source = readFileSync("app/tet-vietnam/page.tsx", "utf8");

const dates = [...source.matchAll(/date: "(\d{4}-\d{2}-\d{2})"/g)].map((m) => m[1]);

if (dates.length === 0) {
  console.error("tet : aucune date trouvée dans app/tet-vietnam/page.tsx.");
  console.error("      Le tableau TETS a-t-il été renommé ou supprimé ?");
  process.exit(1);
}

const aujourdhui = new Date().toISOString().slice(0, 10);
const futures = dates.filter((d) => d > aujourdhui);
const passees = dates.length - futures.length;

if (futures.length < MINIMUM) {
  console.error(
    `tet : ${futures.length} date(s) à venir seulement — il en faut au moins ${MINIMUM}.`,
  );
  console.error(
    `      ${passees} date(s) déjà passée(s). La page annonce « le prochain Tết »`,
  );
  console.error(
    "      depuis la première ligne du tableau : si elle est dépassée, la page ment.",
  );
  console.error(
    "      Prolonger TETS dans app/tet-vietnam/page.tsx (algorithme Hồ Ngọc Đức, UTC+7).",
  );
  process.exit(1);
}

console.log(
  `tet : ${futures.length} date(s) à venir, la prochaine le ${futures[0]}` +
    (passees ? ` (${passees} passée(s), à retirer du tableau)` : ""),
);
