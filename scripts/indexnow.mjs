/**
 * IndexNow: tell the engines which pages actually changed.
 *
 * ## What this buys, and what it does not
 *
 * IndexNow is read by Bing, Yandex, Seznam, Naver and Yep. Google tested it and
 * never adopted it for Search, so nothing here affects Google — the sitemap and
 * Search Console remain the only levers there. Said plainly because "submit to
 * IndexNow" is routinely sold as a general indexing accelerator.
 *
 * It still earns its place on this site. Bing had indexed none of these pages —
 * not one URL, not even for the brand name in quotes — and Copilot answers from
 * the Bing index. For a site whose whole bet is being quoted by generative
 * engines, being absent from that index is worse than the French market share
 * of Bing suggests.
 *
 * ## Why it hashes the pages instead of reading lastmod
 *
 * The sitemap carries a real `dateModified` for guide pages and the build date
 * for the home page and the trips, because those are assembled rather than
 * written and there is no honest date to give them. Diffing on lastmod would
 * therefore re-announce seven unchanged URLs after every deploy, and submitting
 * unchanged URLs is how a source stops being trusted.
 *
 * So it hashes what was actually built. Next stamps a fresh build id into every
 * page as an HTML comment, and the chunk file names move with the JavaScript,
 * so comments, scripts and styles come out before hashing: what is left is the
 * markup and the words, which is what an engine is being told has changed.
 *
 * Usage:
 *   node scripts/indexnow.mjs --dry-run   # show what would be sent
 *   node scripts/indexnow.mjs             # send it
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const OUT = path.join(ROOT, "out");
const ETAT = path.join(ROOT, "scripts", "indexnow-state.json");
const CLE = "ab7c1c8c68d2c3e22663aaaabc775d68";
const ENDPOINT = "https://api.indexnow.org/IndexNow";

const essai = process.argv.includes("--dry-run");

if (!existsSync(path.join(OUT, "sitemap.xml"))) {
  throw new Error("out/sitemap.xml absent — lancez `npm run build` d'abord.");
}

/* The sitemap is the list of URLs we are willing to have indexed: it already
   excludes /credits-photos, which carries noindex. Reading it here rather than
   walking out/ keeps the two from ever disagreeing. */
const sitemap = readFileSync(path.join(OUT, "sitemap.xml"), "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urls.length) throw new Error("Aucune URL dans out/sitemap.xml.");

const host = new URL(urls[0]).host;

/** Everything a build changes on its own, removed. What remains is the page. */
const stable = (html) =>
  html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "");

const fichier = (u) => {
  const p = new URL(u).pathname;
  return path.join(OUT, p === "/" ? "index.html" : path.join(p, "index.html"));
};

const empreintes = {};
const manquants = [];
for (const u of urls) {
  const f = fichier(u);
  if (!existsSync(f)) {
    manquants.push(u);
    continue;
  }
  empreintes[u] = createHash("sha1").update(stable(readFileSync(f, "utf8"))).digest("hex").slice(0, 16);
}

/* A URL in the sitemap with no page behind it is a 404 we would be asking an
   engine to crawl. Loud, not skipped. */
if (manquants.length) {
  throw new Error(`Le sitemap annonce des pages absentes de out/ :\n  ${manquants.join("\n  ")}`);
}

const avant = existsSync(ETAT) ? JSON.parse(readFileSync(ETAT, "utf8")).pages ?? {} : {};
const changees = Object.keys(empreintes).filter((u) => avant[u] !== empreintes[u]);
const disparues = Object.keys(avant).filter((u) => !(u in empreintes));

console.log(
  `indexnow : ${urls.length} pages, ${changees.length} modifiée(s)` +
    (disparues.length ? `, ${disparues.length} retirée(s) du sitemap` : "") +
    (Object.keys(avant).length ? "" : " — premier envoi, tout est nouveau"),
);
for (const u of changees) console.log(`  → ${u}`);

if (!changees.length) {
  console.log("  rien à signaler.");
  process.exit(0);
}

if (essai) {
  console.log("  --dry-run : rien n'a été envoyé.");
  process.exit(0);
}

const reponse = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host,
    key: CLE,
    keyLocation: `https://${host}/${CLE}.txt`,
    urlList: changees,
  }),
});

/**
 * 200 accepted, 202 accepted while the key file is still being verified.
 *
 * Anything else leaves the state file untouched, so the next run retries the
 * same URLs instead of believing they were announced — and it does not fail.
 * This step runs after `wrangler deploy` in `npm run deploy`: throwing here
 * returned a non-zero exit code for a deployment that had already succeeded,
 * which reads as "the deploy failed" to anybody and to any CI. Announcing a
 * release is not the release.
 *
 * Silence would be worse than a wrong exit code, so the refusal is printed in
 * full and will be printed again on every deploy until it is dealt with.
 */
if (reponse.status !== 200 && reponse.status !== 202) {
  const corps = await reponse.text().catch(() => "");
  console.error(
    `indexnow : refus ${reponse.status} ${reponse.statusText} — ${corps.slice(0, 300)}\n` +
      `  ${changees.length} URL non annoncée(s) ; elles seront reproposées au prochain déploiement.`,
  );
  process.exit(0);
}

writeFileSync(
  ETAT,
  `${JSON.stringify({ host, envoye: new Date().toISOString(), pages: empreintes }, null, 2)}\n`,
);
console.log(`  ${reponse.status} ${reponse.statusText} — ${changees.length} URL annoncée(s).`);
