#!/usr/bin/env node
/**
 * Checks that no image is stretched.
 *
 * A distorted photo breaks neither the build nor the types: it displays,
 * simply askew. Only a measurement in a real browser reveals it, by comparing
 * the rendered ratio against the file's natural ratio.
 *
 * Deliberate cropping — object-fit cover or contain — is ignored: that is a
 * layout choice, not a distortion.
 *
 *   PLAYWRIGHT_PATH=/tmp/pw/node_modules/playwright/index.mjs \
 *     node scripts/check-images.mjs [base-url]
 *
 * Exits 1 if any distorted image remains.
 */
/* playwright is not in package.json: installing it downloads browsers, and
   Cloudflare installs dev dependencies on every build. Loaded the same way as
   scripts/check-contrast.mjs. */
let chromium;
try {
  ({ chromium } = await import(process.env.PLAYWRIGHT_PATH || "playwright"));
} catch {
  console.error(
    "playwright est introuvable.\n\n" +
      "  mkdir -p /tmp/pw && cd /tmp/pw && npm i playwright\n" +
      "  npx playwright install chromium\n\n" +
      "puis, depuis ce dépôt :\n" +
      "  PLAYWRIGHT_PATH=/tmp/pw/node_modules/playwright/index.mjs npm run images:check -- <url>",
  );
  process.exit(2);
}

const BASE = process.argv[2] ?? "http://localhost:8787";
const PAGES = ["/", "/circuit-vietnam/", "/circuit-vietnam/vietnam-du-nord-au-sud/", "/que-faire-au-vietnam/",
  "/trek-vietnam/", "/vietnam-cuisine/", "/carte-vietnam/", "/credits-photos/"];
const b = await chromium.launch();
let total = 0, deformees = 0;
for (const p of PAGES) {
  const pg = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await pg.goto(BASE + p + "?v=" + Math.floor(Date.now()/1000), { waitUntil: "networkidle" });
  const r = await pg.evaluate(() => {
    const out = [];
    for (const img of document.querySelectorAll("img")) {
      if (!img.naturalWidth) continue;
      const b = img.getBoundingClientRect();
      if (b.width < 2 || b.height < 2) continue;
      const nat = img.naturalWidth / img.naturalHeight;
      const aff = b.width / b.height;
      const fit = getComputedStyle(img).objectFit;
      // Distorted = rendered ratio != natural ratio WITHOUT cropping (cover/contain)
      const deforme = fit === "fill" && Math.abs(nat - aff) / nat > 0.03;
      out.push({ deforme, fit, nat: +nat.toFixed(2), aff: +aff.toFixed(2),
                 src: img.currentSrc.split("/").pop(), cls: img.parentElement?.className || "" });
    }
    return out;
  });
  total += r.length;
  const bad = r.filter(x => x.deforme);
  deformees += bad.length;
  console.log(`  ${p.padEnd(42)} ${r.length} images, ${bad.length} déformées`);
  bad.forEach(x => console.log(`      ${x.src} — naturel ${x.nat} affiché ${x.aff} (${x.fit}) dans .${x.cls}`));
  await pg.context().close();
}
console.log(`\n  ${total} images, ${deformees} déformées`);
await b.close();
if (deformees > 0) process.exit(1);
