/**
 * The site had no favicon at all: no file, no link tag, /favicon.ico a 404.
 *
 * That is visible in three places at once. The browser tab shows a blank sheet;
 * Google prints a favicon beside every result on mobile and falls back to a grey
 * globe without one; and Applebot, which asked this site for 303 things in a
 * week, found no touch icon. For a site whose difficulty is being believed, a
 * missing mark on every search result is not a detail.
 *
 * ## Why the petals are filled here and stroked in the header
 *
 * The mark in components/Art.tsx draws five ellipses at 1.5 units of stroke in
 * a 32-unit box. At the 30px it occupies in the header that is a fine line and
 * exactly right. Rendered at 16px — the size a tab and a mobile search result
 * use — the outlines fall below one pixel and break into noise; rendered side by
 * side the stroked version was unreadable and the filled one still legible.
 *
 * So this is the same flower, built for a different size: petals filled, a jade
 * tile behind it so the mark carries its own background on a light or a dark tab
 * bar, and a sand dot at the centre.
 *
 * If the glyph in Art.tsx ever changes, change PETALE here and re-run.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(import.meta.dirname, "..");
const APP = path.join(ROOT, "app");

/* Same geometry as components/Art.tsx, filled rather than stroked. */
const PETALE = { cx: 16, cy: 9.2, rx: 3.6, ry: 5.9, angles: [0, 72, 144, 216, 288] };
const JADE = "#1b4238";
const AMBER = "#b85c12";
const SABLE = "#ece4d7";

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="Voyage Vietnam Sur Mesure">` +
  `<rect width="32" height="32" rx="7" fill="${JADE}"/>` +
  PETALE.angles
    .map(
      (d) =>
        `<ellipse cx="${PETALE.cx}" cy="${PETALE.cy}" rx="${PETALE.rx}" ry="${PETALE.ry}" ` +
        `fill="${AMBER}" transform="rotate(${d} 16 16)"/>`,
    )
    .join("") +
  `<circle cx="16" cy="16" r="2.4" fill="${SABLE}"/>` +
  `</svg>\n`;

/**
 * ICO wrapping a single PNG.
 *
 * Nothing here encodes a bitmap: since Vista the format accepts a PNG payload
 * verbatim, so the file is a 6-byte directory, one 16-byte entry and the PNG.
 * Written out rather than pulled from a dependency because that is the whole of
 * it, and a mystery binary in app/ is worse than twelve lines.
 *
 * A width byte of 0 means 256 — the field is one byte, so 256 does not fit.
 */
const ico = (png, taille) => {
  const dir = Buffer.alloc(6);
  dir.writeUInt16LE(0, 0); // réservé
  dir.writeUInt16LE(1, 2); // type : icône
  dir.writeUInt16LE(1, 4); // une seule image
  const entree = Buffer.alloc(16);
  entree.writeUInt8(taille >= 256 ? 0 : taille, 0);
  entree.writeUInt8(taille >= 256 ? 0 : taille, 1);
  entree.writeUInt8(0, 2); // palette : aucune
  entree.writeUInt8(0, 3); // réservé
  entree.writeUInt16LE(1, 4); // plans
  entree.writeUInt16LE(32, 6); // bits par pixel
  entree.writeUInt32LE(png.length, 8);
  entree.writeUInt32LE(22, 12); // décalage : 6 + 16
  return Buffer.concat([dir, entree, png]);
};

const ecrit = (nom, donnees) => {
  const chemin = path.join(APP, nom);
  const avant = existsSync(chemin) ? readFileSync(chemin) : null;
  if (avant && Buffer.compare(Buffer.from(donnees), avant) === 0) return false;
  writeFileSync(chemin, donnees);
  return true;
};

const rendu = (taille) =>
  sharp(Buffer.from(svg)).resize(taille, taille).png({ compressionLevel: 9 }).toBuffer();

let ecrits = 0;
if (ecrit("icon.svg", svg)) ecrits++;
/* 180 px is what iOS asks for; Android reads the SVG. */
if (ecrit("apple-icon.png", await rendu(180))) ecrits++;
if (ecrit("favicon.ico", ico(await rendu(32), 32))) ecrits++;

console.log(
  `icônes : ${ecrits || "aucun"} fichier${ecrits > 1 ? "s" : ""} écrit${ecrits > 1 ? "s" : ""}` +
    (ecrits ? "" : " (inchangés)") +
    ` — empreinte ${createHash("sha1").update(svg).digest("hex").slice(0, 7)}`,
);
