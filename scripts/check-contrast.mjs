#!/usr/bin/env node
/**
 * WCAG AA contrast audit, driving a real browser.
 *
 * Effective colours cannot be read from the stylesheet: they depend on
 * inheritance and on stacked backgrounds. Two traps already escaped a reading
 * of the CSS, and this script is what found them — a light block laid inside a
 * dark band whose text inherited the band's colour, and a 95% white that let
 * the amber bleed through.
 *
 * Backgrounds are composited, alpha included, down to the first opaque layer.
 * Without that, a 7% veil is read as a solid colour and the script invents
 * failures that do not exist.
 *
 *   npx playwright install chromium   # once
 *   node scripts/check-contrast.mjs [base-url]
 *
 * Exits 1 if any failure remains, so it can act as a CI gate.
 */
/* playwright is not in package.json: installing it downloads browsers, and
   Cloudflare installs dev dependencies on every build. A few hundred megabytes
   per deploy for a tool only used during review does not justify itself.

   It is therefore loaded from wherever it already lives, pointed at by
   PLAYWRIGHT_PATH. NODE_PATH is useless here: ES modules do not consult it. */
let chromium;
try {
  ({ chromium } = await import(process.env.PLAYWRIGHT_PATH || "playwright"));
} catch {
  console.error(
    "playwright est introuvable.\n\n" +
      "  mkdir -p /tmp/pw && cd /tmp/pw && npm i playwright\n" +
      "  npx playwright install chromium\n\n" +
      "puis, depuis ce dépôt :\n" +
      "  PLAYWRIGHT_PATH=/tmp/pw/node_modules/playwright/index.mjs npm run contrast -- <url>",
  );
  process.exit(2);
}

const BASE = process.argv[2] ?? "http://localhost:8787";
const PAGES = ["/", "/circuit-vietnam/", "/circuit-vietnam/vietnam-du-nord-au-sud/", "/visa-vietnam/",
  "/nord-ou-sud-vietnam/", "/quand-partir-au-vietnam/", "/budget-voyage-vietnam/", "/itineraire-vietnam/", "/que-faire-au-vietnam/", "/agence-de-voyage-vietnam/", "/halong-ou-lan-ha/", "/agence-locale-ou-tour-operateur/", "/vietnam-ou-thailande/", "/vietnam-cuisine/", "/carte-vietnam/", "/trek-vietnam/", "/credits-photos/", "/merci/"];
const b = await chromium.launch();
let total = 0;
for (const w of [1440, 390]) {
  for (const p of PAGES) {
    const pg = await (await b.newContext({ viewport: { width: w, height: 900 } })).newPage();
    await pg.goto(BASE + p, { waitUntil: "networkidle" });
    const bad = await pg.evaluate(() => {
      const parse = (c) => { const n = c.match(/[\d.]+/g).map(Number); return { r:n[0], g:n[1], b:n[2], a: n[3] ?? 1 }; };
      const over = (f, bg) => ({ r: f.r*f.a + bg.r*(1-f.a), g: f.g*f.a + bg.g*(1-f.a), b: f.b*f.a + bg.b*(1-f.a), a: 1 });
      const lum = ({r,g,b}) => { const f = (v) => { v/=255; return v<=.03928 ? v/12.92 : ((v+.055)/1.055)**2.4; }; return .2126*f(r)+.7152*f(g)+.0722*f(b); };
      // Composites the whole background stack, alpha included, down to an opaque layer.
      const bgOf = (el) => {
        const couches = []; let e = el;
        while (e) { const c = parse(getComputedStyle(e).backgroundColor); if (c.a > 0) { couches.push(c); if (c.a === 1) break; } e = e.parentElement; }
        let acc = couches.pop() ?? { r:255,g:255,b:255,a:1 };
        while (couches.length) acc = over(couches.pop(), acc);
        return acc;
      };
      const out = [];
      for (const el of document.querySelectorAll("p,li,a,span,td,th,h1,h2,h3,b,em,small,summary,figcaption,label,button")) {
        const t = el.textContent?.trim(); if (!t || el.children.length) continue;
        const s = getComputedStyle(el); if (s.visibility === "hidden" || s.opacity === "0") continue;
        if (!el.getClientRects().length) continue;
        const size = parseFloat(s.fontSize), bold = parseInt(s.fontWeight) >= 700;
        const need = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5;
        const bg = bgOf(el);
        const l1 = lum(over(parse(s.color), bg)), l2 = lum(bg);
        const r = (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
        if (r < need) out.push({ t: t.slice(0,38), r: +r.toFixed(2), need, c: el.className });
      }
      return out;
    });
    total += bad.length;
    if (bad.length) { console.log(`  ${w} ${p} — ${bad.length} ÉCHECS`); bad.slice(0,3).forEach(x => console.log(`      ${x.r}:1 (min ${x.need}) « ${x.t} » .${x.c}`)); }
  }
}
console.log(`\n  ${PAGES.length} pages × 2 largeurs — ${total} échec${total === 1 ? "" : "s"} WCAG AA`);
await b.close();
if (total > 0) process.exit(1);
