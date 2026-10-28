#!/usr/bin/env node
/**
 * Génère les variantes d'images et leur manifeste.
 *
 * Lancé par `prebuild`, donc aussi sur Cloudflare.
 *
 * Cloudflare n'a pas d'optimiseur d'images Next : plutôt que de payer
 * Cloudflare Images ou de servir des JPEG de 2000 px, on fabrique les
 * variantes au build. Elles sont servies comme n'importe quel fichier
 * statique, donc gratuitement et depuis l'edge.
 *
 * Un seul format, WebP : universellement supporté et 25 à 30 % plus léger que
 * le JPEG. L'AVIF ferait mieux encore, mais obligerait à un <picture> avec
 * négociation de type pour les navigateurs qui ne le lisent pas — davantage de
 * pièces pour un gain marginal à cette échelle.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(import.meta.dirname, "..");
/* Les sources vivent hors de public/ : sinon Next les copie telles quelles
   dans le build et l'on déploierait 8,7 Mo de JPEG que personne ne demande. */
const SRC = path.join(ROOT, "assets", "photos");
const OUT = path.join(ROOT, "public", "photos", "v");
const MANIFEST = path.join(ROOT, "lib", "image-manifest.json");
const META = path.join(ROOT, "content", "photos.json");

/** Échelle commune ; les largeurs au-dessus de la source sont ignorées — on
 *  n'agrandit jamais une image. */
const WIDTHS = [256, 384, 640, 960, 1280, 1920];
const QUALITY = 74;

const meta = JSON.parse(readFileSync(META, "utf8"));

mkdirSync(OUT, { recursive: true });

const sources = readdirSync(SRC).filter((f) => /\.(jpe?g|png)$/i.test(f));
const byFile = new Map(Object.entries(meta).map(([id, m]) => [m.file, id]));

const orphans = sources.filter((f) => !byFile.has(f));
if (orphans.length) {
  throw new Error(
    `Photos sans description dans content/photos.json : ${orphans.join(", ")}.\n` +
      `Ajoutez-y au moins un \`alt\` — une image sans texte alternatif est ` +
      `invisible pour un lecteur d'écran et pour Google Images.`,
  );
}

const manifest = {};
let written = 0;
let skipped = 0;

for (const [id, m] of Object.entries(meta)) {
  const file = path.join(SRC, m.file);
  if (!existsSync(file)) {
    throw new Error(`content/photos.json référence ${m.file}, absent de public/photos/.`);
  }

  const image = sharp(file);
  const { width: w0, height: h0 } = await image.metadata();
  const widths = WIDTHS.filter((w) => w <= w0);
  if (widths.at(-1) !== w0 && widths.length < WIDTHS.length) widths.push(w0);

  for (const w of widths) {
    const dest = path.join(OUT, `${id}-${w}.webp`);
    if (existsSync(dest)) {
      skipped++;
      continue;
    }
    await sharp(file).resize({ width: w }).webp({ quality: QUALITY }).toFile(dest);
    written++;
  }

  // Vignette floue encodée en base64, affichée pendant le chargement. Next la
  // fabriquait tout seul ; sans lui, seize pixels suffisent.
  const blur = await sharp(file)
    .resize({ width: 16 })
    .webp({ quality: 40 })
    .toBuffer();

  manifest[id] = {
    w: w0,
    h: h0,
    widths,
    blur: `data:image/webp;base64,${blur.toString("base64")}`,
  };
}

const next = JSON.stringify(manifest, null, 2) + "\n";
const prev = existsSync(MANIFEST) ? readFileSync(MANIFEST, "utf8") : "";
if (next !== prev) writeFileSync(MANIFEST, next);

const hash = createHash("sha1").update(next).digest("hex").slice(0, 7);
console.log(
  `images : ${Object.keys(manifest).length} photos, ${written} variantes écrites, ` +
    `${skipped} déjà présentes — manifeste ${hash}${next === prev ? " (inchangé)" : ""}`,
);
