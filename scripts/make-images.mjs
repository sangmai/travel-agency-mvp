#!/usr/bin/env node
/**
 * Generates the image variants and their manifest.
 *
 * Run by `prebuild`, so also on Cloudflare.
 *
 * Cloudflare has no Next image optimizer: rather than paying for Cloudflare
 * Images or serving 2000px JPEGs, the variants are produced at build time. They
 * are served like any other static file, so for free and from the edge.
 *
 * One format only, WebP: universally supported and 25-30% lighter than JPEG.
 * AVIF would do better still, but would force a <picture> with type negotiation
 * for browsers that cannot read it — more moving parts for a marginal gain at
 * this scale.
 */
import { createHash } from "node:crypto";
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  statSync,
  unlinkSync,
} from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(import.meta.dirname, "..");
/* The sources live outside public/: otherwise Next copies them verbatim into
   the build and we would deploy 8.7 MB of JPEG nobody asks for. */
const SRC = path.join(ROOT, "assets", "photos");
const OUT = path.join(ROOT, "public", "photos", "v");
const OG = path.join(ROOT, "public", "photos", "og");
const MANIFEST = path.join(ROOT, "lib", "image-manifest.json");
const META = path.join(ROOT, "content", "photos.json");

/** Shared scale; widths above the source are skipped — we never upscale an
 *  image. */
const WIDTHS = [256, 384, 640, 960, 1280, 1920];
const QUALITY = 74;

/* Share image. 1200 × 630 is the format Facebook, LinkedIn, X and WhatsApp
   expect; below 600px wide, several of them degrade the preview to a small
   icon.
   JPEG rather than WebP: some preview renderers — WhatsApp, Slack, several mail
   clients — still cannot read WebP, and a missing preview is worth less than a
   slightly heavier one. */
const OG_W = 1200;
const OG_H = 630;

const meta = JSON.parse(readFileSync(META, "utf8"));

mkdirSync(OUT, { recursive: true });
mkdirSync(OG, { recursive: true });

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
let removed = 0;

/**
 * A derivative is current when it exists *and* is younger than its source.
 *
 * The check used to be `existsSync` alone, which cached on the file name and
 * nothing else. Replacing a photograph while keeping its id — the ordinary way
 * to swap an image — rewrote only the widths that happened not to exist yet:
 * a 1800px source replaced by a 2560px one produced a single new 1920 variant
 * and left 256 through 1280 holding the previous picture. The manifest showed
 * the new dimensions, the page looked right on a wide screen, and every phone
 * was served the old photograph. Nothing failed, which is what made it bad.
 */
const perime = (dest, src) =>
  !existsSync(dest) || statSync(dest).mtimeMs < statSync(src).mtimeMs;

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
    if (!perime(dest, file)) {
      skipped++;
      continue;
    }
    await sharp(file).resize({ width: w }).webp({ quality: QUALITY }).toFile(dest);
    written++;
  }

  /* A taller source shifts the top width — 1800 becomes 1920 — and the old
     variant stops being referenced without stopping being deployed. Sweep the
     widths this id no longer declares, or the bucket keeps every size the
     photograph has ever had. */
  /* The suffix must be digits, not merely anything: `rizieres-` is also the
     start of `rizieres-enfants-256.webp`, and so are `hoian-`/`hoian-noces`
     and `halong-`/`halong-baie`. A prefix test here would delete another
     photograph's variants. */
  const sien = new RegExp(`^${id}-(\\d+)\\.webp$`);
  const gardees = new Set(widths.map((w) => `${id}-${w}.webp`));
  for (const f of readdirSync(OUT)) {
    if (sien.test(f) && !gardees.has(f)) {
      unlinkSync(path.join(OUT, f));
      removed++;
    }
  }

  const og = path.join(OG, `${id}.jpg`);
  if (perime(og, file)) {
    await sharp(file)
      .resize({ width: OG_W, height: OG_H, fit: "cover", position: "attention" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(og);
    written++;
  } else {
    skipped++;
  }

  // Base64-encoded blur placeholder, shown while loading. Next used to make it
  // on its own; without Next, sixteen pixels are enough.
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
    `${skipped} à jour` +
    (removed ? `, ${removed} périmées supprimées` : "") +
    ` — manifeste ${hash}${next === prev ? " (inchangé)" : ""}`,
);
