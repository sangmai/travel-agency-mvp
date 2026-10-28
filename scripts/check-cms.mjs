#!/usr/bin/env node
/**
 * Vérifie que le CMS décrit exactement le contenu qu'il édite.
 *
 * Sveltia et Decap réécrivent le fichier entier à partir des champs déclarés
 * dans config.yml. Un champ présent dans le JSON mais absent de la
 * configuration disparaît donc au premier enregistrement d'un éditeur — sans
 * message, et sans que personne fasse le lien entre « j'ai corrigé un numéro
 * de téléphone » et « le site ne se construit plus ».
 *
 * C'est arrivé : l'identité de l'agence a été refondue sans que config.yml
 * suive, et six champs dont l'équipe et les horaires n'attendaient qu'une
 * sauvegarde pour être effacés. D'où ce contrôle, lancé au prebuild.
 *
 * Il compare les noms, pas les types : l'objectif est d'empêcher une perte
 * de données, pas de valider la mise en forme.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const ROOT = path.join(import.meta.dirname, "..");
const cfg = parse(readFileSync(path.join(ROOT, "public/admin/config.yml"), "utf8"));

const lire = (rel) => JSON.parse(readFileSync(path.join(ROOT, rel), "utf8"));
const ecarts = [];

/** Noms déclarés à un niveau de la configuration. */
const noms = (fields = []) => new Set(fields.map((f) => f.name));

/**
 * Compare une valeur du contenu à sa déclaration. `chemin` sert uniquement au
 * message d'erreur.
 */
function comparer(valeur, champs, chemin, fichier) {
  if (Array.isArray(valeur)) {
    // Liste d'objets : on compare la forme du premier élément. Une liste de
    // chaînes se déclare avec `field` au singulier, dont le nom est libre.
    const premier = valeur[0];
    if (premier && typeof premier === "object") {
      const sous = champs?.fields ?? [];
      comparer(premier, sous, chemin, fichier);
    }
    return;
  }

  if (valeur && typeof valeur === "object") {
    const declares = noms(Array.isArray(champs) ? champs : champs?.fields);
    for (const cle of Object.keys(valeur)) {
      if (!declares.has(cle)) {
        ecarts.push(`${fichier} : « ${chemin}${cle} » existe dans le contenu mais n'est pas déclaré au CMS — il serait effacé au premier enregistrement.`);
        continue;
      }
      const sous = (Array.isArray(champs) ? champs : champs.fields).find((f) => f.name === cle);
      comparer(valeur[cle], sous, `${chemin}${cle}.`, fichier);
    }
    /* L'inverse n'est signalé que pour les champs obligatoires : un champ
       facultatif — une étiquette d'étape, la photo d'une journée — est
       légitimement absent tant que personne ne l'a rempli. Les signaler
       noierait le seul écart qui fasse perdre des données. */
    const liste = Array.isArray(champs) ? champs : champs.fields;
    for (const d of declares) {
      const decl = liste.find((f) => f.name === d);
      if (!(d in valeur) && decl?.required !== false) {
        ecarts.push(`${fichier} : « ${chemin}${d} » est déclaré au CMS comme obligatoire mais absent du contenu — l'éditeur verra un champ vide qui n'existe pas.`);
      }
    }
  }
}

for (const collection of cfg.collections ?? []) {
  for (const f of collection.files ?? []) {
    comparer(lire(f.file), f.fields, "", f.file);
  }

  // Collection de dossier : on contrôle chaque fiche, les circuits pouvant
  // diverger entre eux.
  if (collection.folder) {
    const { readdirSync } = await import("node:fs");
    for (const nom of readdirSync(path.join(ROOT, collection.folder))) {
      if (!nom.endsWith(".json")) continue;
      comparer(lire(path.join(collection.folder, nom)), collection.fields, "", `${collection.folder}/${nom}`);
    }
  }
}

if (ecarts.length > 0) {
  console.error(`\ncms : ${ecarts.length} écart(s) entre public/admin/config.yml et content/\n`);
  for (const e of ecarts) console.error(`  ✗ ${e}`);
  console.error("");
  process.exit(1);
}

console.log("cms : config.yml et content/ concordent");
