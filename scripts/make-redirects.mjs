#!/usr/bin/env node
/**
 * Writes public/_redirects: one permanent redirect per page, from the
 * slash-less form to the canonical one.
 *
 * Cloudflare's static-asset layer already normalises trailing slashes through
 * `html_handling: "auto-trailing-slash"` — but it answers 307, a *temporary*
 * redirect. The www and http redirects, set as Cloudflare rules, answer 301.
 * Three redirects on one site, two of them saying "permanent" and one saying
 * "ask again next time", for a normalisation that will never change.
 *
 * In practice almost nothing hits the slash-less form: the sitemap, the
 * canonicals and every internal link carry the slash. The form is reachable
 * only from an external link typed without it — which is exactly the link whose
 * signal is worth keeping.
 *
 * `_redirects` is evaluated before the asset layer, which is why a rule here
 * wins over the built-in 307. Verified rather than assumed: a single rule was
 * deployed first, and /visa-vietnam returned 301 while /tet-vietnam still
 * returned 307.
 *
 * Why an explicit list rather than a splat: `/* /:splat/ 301` also matches the
 * already-slashed form and loops. Enumerating is longer and cannot.
 *
 * Generated, not written by hand — so a page added tomorrow gets its redirect
 * without anyone remembering. Regenerated at prebuild and git-ignored, like
 * public/admin/config.yml.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const routes = readFileSync("lib/routes.ts", "utf8");
const chemins = [...routes.matchAll(/\{ path: "([^"]+)",[^}]*published: true \}/g)].map((m) => m[1]);

const circuits = readdirSync("content/itineraries")
  .filter((f) => f.endsWith(".json"))
  .map((f) => `/circuit-vietnam/${f.replace(/\.json$/, "")}`);

const tous = [...chemins, ...circuits].filter((p) => p !== "/");

if (tous.length === 0) {
  console.error("redirects : aucune route trouvée — lib/routes.ts a-t-il changé de forme ?");
  process.exit(1);
}

const lignes = [
  "# Généré par scripts/make-redirects.mjs — ne pas modifier à la main.",
  "#",
  "# Une redirection permanente par page, de la forme sans barre finale vers la",
  "# forme canonique. Sans ces règles, Cloudflare répond 307 (temporaire) là où",
  "# les redirections www et http répondent 301.",
  "",
  ...tous.map((p) => `${p}  ${p}/  301`),
  "",
];

writeFileSync("public/_redirects", lignes.join("\n"));
console.log(`redirects : ${tous.length} règles 301 écrites dans public/_redirects`);
