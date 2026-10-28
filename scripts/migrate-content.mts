/**
 * Convertit le contenu encore codé en dur (lib/data.ts, lib/itineraries.ts,
 * lib/site.ts, lib/photos.ts, lib/places.ts) en fichiers JSON sous content/,
 * en appliquant au passage les corrections de forme issues de la revue :
 *
 *  - les lieux reçoivent un identifiant stable ; leurs noms deviennent une
 *    table de registres (fr / map) au lieu d'un nom + un champ d'exception ;
 *  - une étape référence un lieu par id et peut porter son propre libellé,
 *    si bien que « Croisière Halong privée » cesse d'être un faux lieu ;
 *  - les données pratiques d'une journée deviennent des paires clé/valeur ;
 *  - la latitude redevient un nombre, plus une chaîne « 21°N » ;
 *  - les avis n'ont plus qu'un seul schéma, rattaché au voyage par slug.
 *
 * Script jetable : il a servi une fois, à la migration depuis les anciens
 * lib/data.ts et lib/itineraries.ts, aujourd'hui supprimés. Conservé pour que
 * la transformation reste relisible — il ne peut plus être rejoué.
 */
import { mkdirSync, writeFileSync } from "node:fs";

const ROOT = "/Users/vnhcmlap-0070/Desktop/TRAINING/travel/";
const OUT = ROOT + "content/";

const data: any = await import("@/lib/data");
const itin: any = await import("@/lib/itineraries");
const site: any = await import("@/lib/site");
const photos: any = await import("@/lib/photos");
const places: any = await import("@/lib/places");
const credits: any = (
  await import("@/public/photos/CREDITS.json", { with: { type: "json" } })
).default;

const write = (name: string, value: unknown) => {
  const path = OUT + name;
  mkdirSync(path.slice(0, path.lastIndexOf("/")), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
  return path;
};

/* --------------------------------------------------------------- lieux -- */

const PLACE_ID: Record<string, string> = {
  "Hanoï": "hanoi",
  "Ninh Binh": "ninh-binh",
  "Baie de Lan Ha": "lan-ha",
  "Baie d'Halong": "ha-long",
  "Croisière Halong privée": "lan-ha",
  "Pu Luong": "pu-luong",
  "Mai Chau": "mai-chau",
  "Ha Giang": "ha-giang",
  "Dong Van": "dong-van",
  "Cao Bang": "cao-bang",
  "Ban Gioc": "ban-gioc",
  "Ba Be": "ba-be",
  "Sapa": "sapa",
  "Phong Nha": "phong-nha",
  "Hué": "hue",
  "Da Nang": "da-nang",
  "Hoi An": "hoi-an",
  "Hô Chi Minh-Ville": "hcmc",
  "Saïgon": "hcmc",
  "Delta du Mékong": "can-tho",
  "Mékong": "can-tho",
  "Can Tho": "can-tho",
  "Chau Doc": "chau-doc",
  "Phu Quoc": "phu-quoc",
  "Con Dao": "con-dao",
  "Phnom Penh": "phnom-penh",
  "Siem Reap": "siem-reap",
  "Angkor": "siem-reap",
};

// Nom canonique français de chaque lieu, choisi parmi les variantes.
const PLACE_FR: Record<string, string> = {
  hanoi: "Hanoï",
  "ninh-binh": "Ninh Binh",
  "lan-ha": "Baie de Lan Ha",
  "ha-long": "Baie d'Halong",
  "pu-luong": "Pu Luong",
  "mai-chau": "Mai Chau",
  "ha-giang": "Ha Giang",
  "dong-van": "Dong Van",
  "cao-bang": "Cao Bang",
  "ban-gioc": "Ban Gioc",
  "ba-be": "Ba Be",
  sapa: "Sapa",
  "phong-nha": "Phong Nha",
  hue: "Hué",
  "da-nang": "Da Nang",
  "hoi-an": "Hoi An",
  hcmc: "Hô Chi Minh-Ville",
  "can-tho": "Can Tho",
  "chau-doc": "Chau Doc",
  "phu-quoc": "Phu Quoc",
  "con-dao": "Con Dao",
  "phnom-penh": "Phnom Penh",
  "siem-reap": "Siem Reap",
};

const PLACE_MAP: Record<string, string> = {
  hanoi: "Hanoi",
  "ninh-binh": "Ninh Binh",
  "lan-ha": "Lan Ha",
  "ha-long": "Ha Long",
  "pu-luong": "Pu Luong",
  "mai-chau": "Mai Chau",
  "ha-giang": "Ha Giang",
  "dong-van": "Dong Van",
  "cao-bang": "Cao Bang",
  "ban-gioc": "Ban Gioc",
  "ba-be": "Ba Be",
  sapa: "Sapa",
  "phong-nha": "Phong Nha",
  hue: "Hue",
  "da-nang": "Da Nang",
  "hoi-an": "Hoi An",
  hcmc: "Saigon",
  "can-tho": "Can Tho",
  "chau-doc": "Chau Doc",
  "phu-quoc": "Phu Quoc",
  "con-dao": "Con Dao",
  "phnom-penh": "Phnom Penh",
  "siem-reap": "Siem Reap",
};

const placesOut = Object.entries(PLACE_FR).map(([id, fr]) => {
  // On retrouve les coordonnées via n'importe quelle clé française qui pointe
  // sur cet id : elles sont identiques pour toutes les variantes.
  const key = Object.keys(PLACE_ID).find((k) => PLACE_ID[k] === id)!;
  const c = places.PLACES[key];
  return { id, fr, map: PLACE_MAP[id], lat: c.lat, lon: c.lon };
});

/* ------------------------------------------------------------- photos -- */

// Le fichier CREDITS.json est indexé par nom de fichier, pas par clé photo :
// on réunifie les deux espaces de noms en un seul identifiant.
const PHOTO_FILE: Record<string, string> = {
  hagiang: "hagiang",
  halong: "hero-halong",
  rizieres: "nord-rizieres",
  hoian: "centre-hoian",
  mekong: "sud-mekong",
  hanoi: "hanoi",
  ninhbinh: "ninhbinh",
  hue: "hue",
  marche: "marche",
  phuquoc: "phuquoc",
  phongnha: "phongnha",
  trek: "envie-trek",
  cuisine: "envie-cuisine",
};

const degToNum = (s: string) => (s ? Number(s.replace("°N", "")) : null);

const photosOut = Object.fromEntries(
  Object.entries(photos.PHOTOS).map(([id, p]: [string, any]) => {
    const file = PHOTO_FILE[id];
    const c = credits[file];
    if (!c) throw new Error(`crédit manquant pour ${id} (${file})`);
    return [
      id,
      {
        file: `${file}.jpg`,
        alt: p.alt,
        place: p.lieu,
        lat: degToNum(p.lat),
        credit: { title: c.title, author: c.auteur, licence: c.licence, page: c.page },
      },
    ];
  }),
);

/* --------------------------------------------------------- itinéraires -- */

const FACT_KEYS = [
  ["route", "trajet"],
  ["marche", "marche"],
  ["velo", "velo"],
  ["nuit", "nuit"],
  ["repas", "repas"],
] as const;

const tripsOut = itin.ITINERARIES.map((t: any) => ({
  slug: t.slug,
  code: t.code,
  name: t.name,
  tagline: t.tagline,
  days: t.days,
  priceFrom: t.priceFrom,
  niveau: t.niveau,
  confort: t.confort,
  type: t.type,
  region: t.region,
  saison: t.saison,
  groupe: t.groupe,
  photo: t.photo,
  intro: t.intro,
  pitch: t.pitch,
  audience: t.audience,
  ...(t.tag ? { tag: t.tag } : {}),
  plus: t.plus,
  stops: t.etapes.map((e: string) => {
    const place = PLACE_ID[e];
    if (!place) throw new Error(`étape sans id : ${e}`);
    // Le libellé n'est conservé que s'il diffère du nom canonique du lieu.
    return PLACE_FR[place] === e ? { place } : { place, label: e };
  }),
  program: t.program.map((d: any) => ({
    n: d.n,
    title: d.title,
    body: d.body,
    facts: FACT_KEYS.filter(([src]) => d[src]).map(([src, key]) => ({
      key,
      value: d[src],
    })),
    ...(d.photo ? { photo: d.photo } : {}),
  })),
  nights: t.nights,
  included: t.included,
  excluded: t.excluded,
}));

/* --------------------------------------------------------------- avis -- */

// Un seul schéma. Les six avis de la page d'accueil reprenaient les mêmes
// auteurs et dates que des avis de fiche, avec un corps différent et un titre
// en plus : on fusionne au lieu d'en jeter un. `featured` marque ceux que la
// page d'accueil affichait.
const byKey = new Map<string, any>();
for (const t of itin.ITINERARIES) {
  for (const a of t.avis) {
    byKey.set(`${a.author}|${a.date}`, { ...a, trip: t.slug });
  }
}
for (const r of data.REVIEWS) {
  const k = `${r.author}|${r.date}`;
  const prev = byKey.get(k);
  byKey.set(k, { ...(prev ?? {}), ...r, title: r.title, featured: true, trip: prev?.trip });
}
const reviewsOut = [...byKey.values()].map((r) => ({
  author: r.author,
  city: r.city,
  date: r.date,
  rating: r.rating,
  body: r.body,
  ...(r.title ? { title: r.title } : {}),
  ...(r.trip ? { trip: r.trip } : {}),
  ...(r.featured ? { featured: true } : {}),
}));

/* -------------------------------------------------------------- écriture */

const written: string[] = [];
const put = (n: string, v: unknown) => written.push(write(n, v));

put("places.json", placesOut);
put("photos.json", photosOut);
put("reviews.json", reviewsOut);
put("regions.json", data.REGIONS.map((r: any) => ({
  id: r.id,
  name: r.name,
  subtitle: r.subtitle,
  feel: r.feel,
  summary: r.summary,
  highlights: r.highlights,
  duration: r.duration,
  route: r.slug,
  photo: r.photo,
})));
put("envies.json", data.ENVIES.map((e: any) => ({
  route: e.slug, title: e.title, line: e.line, photo: e.photo,
})));
put("process.json", data.PROCESS);
put("comparison.json", data.COMPARISON);
put("seasons.json", data.WHEN_TO_GO);
put("budget.json", data.BUDGET);
put("faq.json", data.FAQ);
put("story.json", data.RECIT);
put("site.json", { ...site.SITE, advisor: site.ADVISOR });
for (const t of tripsOut) put(`itineraries/${t.slug}.json`, t);

console.log(`${written.length} fichiers écrits`);
console.log(`  lieux ${placesOut.length}  photos ${Object.keys(photosOut).length}  avis ${reviewsOut.length} (dont ${reviewsOut.filter((r:any)=>r.featured).length} en vedette, ${reviewsOut.filter((r:any)=>r.trip).length} rattachés à un voyage)`);
console.log(`  voyages ${tripsOut.length}, ${tripsOut.reduce((n: number, t: any) => n + t.program.length, 0)} journées`);
const noFacts = tripsOut.flatMap((t: any) => t.program.filter((d: any) => !d.facts.length));
console.log(`  journées sans donnée pratique : ${noFacts.length}`);
