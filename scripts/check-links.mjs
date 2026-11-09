/**
 * Every internal link must point at the canonical address.
 *
 * `trailingSlash: true` gives each page exactly one address, the one ending in
 * a slash — and that is what the canonical tags and the sitemap declare. The
 * links did not: all thirty-eight of them pointed at the bare form, which
 * answers 301. Visitors paid a round trip on every click, and Google was handed
 * twenty-eight redirecting addresses by the site itself, then reported them
 * back as "Page with redirect".
 *
 * The fix was mechanical and so is the regression: one href written without its
 * slash puts the fault back, and nothing would have failed. This runs on the
 * built HTML rather than the source, so it also covers addresses assembled from
 * the content files, which is where the next one would come from.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const OUT = path.join(ROOT, "out");

function pages(dir) {
  const res = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== "_next") res.push(...pages(p));
    } else if (e.name.endsWith(".html")) res.push(p);
  }
  return res;
}

/* A fragment or a query already names something other than a page, and an
   address carrying an extension is a file, not a route. */
const aCorriger = (href) =>
  href.startsWith("/") &&
  href !== "/" &&
  !href.endsWith("/") &&
  !/[#?]/.test(href) &&
  !/\.[a-z0-9]+$/i.test(href);

const fautes = new Map();
for (const f of pages(OUT)) {
  for (const m of readFileSync(f, "utf8").matchAll(/href="([^"]+)"/g)) {
    if (!aCorriger(m[1])) continue;
    const page = f.replace(OUT, "").replace(/\/index\.html$/, "/") || "/";
    if (!fautes.has(m[1])) fautes.set(m[1], new Set());
    fautes.get(m[1]).add(page);
  }
}

if (fautes.size) {
  console.error(
    `liens : ${fautes.size} adresse(s) interne(s) sans barre finale — chacune coûte une redirection 301 :`,
  );
  for (const [href, pages] of fautes) {
    console.error(`  ${href}  →  sur ${[...pages].slice(0, 3).join(", ")}`);
  }
  process.exit(1);
}

console.log(`liens : ${pages(OUT).length} pages, toutes les adresses internes sont canoniques`);
