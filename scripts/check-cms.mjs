#!/usr/bin/env node
/**
 * Checks that the CMS describes exactly the content it edits.
 *
 * Sveltia and Decap rewrite the whole file from the fields declared in
 * config.yml. A field present in the JSON but missing from the configuration
 * therefore disappears the first time an editor saves — with no message, and
 * with nobody connecting "I fixed a phone number" to "the site no longer
 * builds".
 *
 * It happened: the agency identity was reworked without config.yml following,
 * and six fields including the team and the opening hours were one save away
 * from being wiped. Hence this check, run at prebuild.
 *
 * It compares names, not types: the goal is preventing data loss, not
 * validating presentation.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const ROOT = path.join(import.meta.dirname, "..");
const cfg = parse(readFileSync(path.join(ROOT, "public/admin/config.yml"), "utf8"));

const lire = (rel) => JSON.parse(readFileSync(path.join(ROOT, rel), "utf8"));
const ecarts = [];

/** Names declared at one level of the configuration. */
const noms = (fields = []) => new Set(fields.map((f) => f.name));

/**
 * Compares a content value against its declaration. `chemin` is used only for
 * the error message.
 */
function comparer(valeur, champs, chemin, fichier) {
  if (Array.isArray(valeur)) {
    // List of objects: we compare the shape of the first element. A list of
    // strings is declared with a singular `field`, whose name is free.
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
    /* The reverse is only reported for required fields: an optional one — a stop
       label, a day's photo — is legitimately absent until somebody fills it in.
       Reporting those would drown the one discrepancy that loses data. */
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

  // Folder collection: every entry is checked, since itineraries can diverge
  // from one another.
  if (collection.folder) {
    const { readdirSync } = await import("node:fs");
    for (const nom of readdirSync(path.join(ROOT, collection.folder))) {
      if (!nom.endsWith(".json")) continue;
      comparer(lire(path.join(collection.folder, nom)), collection.fields, "", `${collection.folder}/${nom}`);
    }
  }
}

/* ------------------------------------------------- Pages CMS ------------
 *
 * The same name checks, against Pages CMS's grammar: `type` and `list` instead
 * of `widget`.
 *
 * No freshness check here: prebuild regenerates .pages.yml just before, so a
 * comparison against disk would always pass. The fact that it must be committed
 * is reported by the generator itself, at the moment it sees a change.
 */
const pcfg = parse(readFileSync(path.join(ROOT, ".pages.yml"), "utf8"));

function comparerPages(valeur, champ, chemin, fichier) {
  if (Array.isArray(valeur)) {
    const premier = valeur[0];
    if (premier && typeof premier === "object") comparerPages(premier, champ, chemin, fichier);
    return;
  }
  if (!valeur || typeof valeur !== "object") return;

  const liste = Array.isArray(champ) ? champ : champ?.fields;
  if (!liste) return;
  const declares = new Set(liste.map((f) => f.name));

  for (const cle of Object.keys(valeur)) {
    if (!declares.has(cle)) {
      ecarts.push(`.pages.yml → ${fichier} : « ${chemin}${cle} » existe dans le contenu mais n'est pas déclaré.`);
      continue;
    }
    comparerPages(valeur[cle], liste.find((f) => f.name === cle), `${chemin}${cle}.`, fichier);
  }
  for (const d of declares) {
    const decl = liste.find((f) => f.name === d);
    if (!(d in valeur) && decl?.required) {
      ecarts.push(`.pages.yml → ${fichier} : « ${chemin}${d} » est obligatoire mais absent du contenu.`);
    }
  }
}

for (const e of pcfg.content ?? []) {
  if (e.type === "file") {
    comparerPages(lire(e.path), e.fields, "", e.path);
  } else if (e.type === "collection") {
    const { readdirSync } = await import("node:fs");
    for (const nom of readdirSync(path.join(ROOT, e.path))) {
      if (nom.endsWith(".json")) comparerPages(lire(`${e.path}/${nom}`), e.fields, "", `${e.path}/${nom}`);
    }
  }
}

if (ecarts.length > 0) {
  console.error(`\ncms : ${ecarts.length} écart(s) entre public/admin/config.yml et content/\n`);
  for (const e of ecarts) console.error(`  ✗ ${e}`);
  console.error("");
  process.exit(1);
}

console.log("cms : config.yml, .pages.yml et content/ concordent");
