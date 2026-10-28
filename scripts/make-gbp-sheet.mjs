#!/usr/bin/env node
/**
 * Fiche de saisie pour Google Business Profile, tirée de content/site.json.
 *
 * La cohérence du NAP — nom, adresse, téléphone — entre la fiche Google, le
 * pied de page et le JSON-LD est l'un des rares facteurs de référencement
 * local qui se vérifie à la lettre près. « 270 Nguyen Luong Bang » et
 * « 270, Nguyễn Lương Bằng » sont deux établissements différents pour un
 * moteur. Recopier à la main depuis le site, c'est introduire l'écart.
 *
 *   node scripts/make-gbp-sheet.mjs
 *
 * Écrit docs/google-business-profile.md, à ouvrir en face du formulaire.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const site = JSON.parse(readFileSync(path.join(ROOT, "content/site.json"), "utf8"));

const JOURS = {
  Monday: "lundi", Tuesday: "mardi", Wednesday: "mercredi",
  Thursday: "jeudi", Friday: "vendredi", Saturday: "samedi", Sunday: "dimanche",
};
const ouverts = site.hours.days.map((j) => JOURS[j]);
const fermes = Object.values(JOURS).filter((j) => !ouverts.includes(j));

const champ = (label, valeur, note = "") =>
  `| ${label} | \`${valeur}\` |${note ? ` ${note} |` : " |"}`;

const md = `# Google Business Profile — fiche de saisie

<!-- ⚠️ FICHIER GÉNÉRÉ par scripts/make-gbp-sheet.mjs. Ne pas modifier à la
     main : corriger content/site.json et relancer \`npm run gbp\`. -->

À créer sur <https://business.google.com>. La vérification — carte postale,
téléphone ou vidéo — ne peut être faite que par l'établissement lui-même.

## Pourquoi copier d'ici plutôt que du site

Le nom, l'adresse et le téléphone doivent être **identiques au caractère
près** entre cette fiche, le pied de page du site et les données structurées.
C'est l'un des rares facteurs de référencement local qui se vérifie à la
lettre : pour un moteur, « 270 Nguyen Luong Bang » et « 270, Nguyễn Lương
Bằng » désignent deux établissements distincts. Ce document est produit
depuis la même source que le site, il n'y a donc rien à retaper.

## Champs à remplir

| Champ Google | Valeur exacte | Remarque |
|---|---|---|
${champ("Nom de l'établissement", site.name, "Sans suffixe ni slogan : Google sanctionne le bourrage de mots-clés dans le nom.")}
${champ("Catégorie principale", "Agence de voyages", "")}
${champ("Catégorie secondaire", "Voyagiste", "")}
${champ("Adresse", `${site.address.street}, ${site.address.city}, ${site.address.countryName}`, "")}
${champ("Code postal", site.address.postalCode, "")}
${champ("Téléphone", site.phoneDisplay, "Le même que sur le site, format international compris.")}
${champ("Site web", site.url, "À mettre à jour le jour du passage au domaine définitif.")}
${champ("Horaires", `${site.hours.opens}–${site.hours.closes}`, `Ouvert ${ouverts.join(", ")}. Fermé ${fermes.join(" et ")}.`)}
${champ("Zone desservie", "Vietnam, Laos, Cambodge", "L'agence se déplace chez le client : déclarer la zone en plus de l'adresse.")}
${champ("Année d'ouverture", site.founded, "Correspond à la licence de tour-opérateur.")}

## Description (750 caractères maximum)

> ${site.legalName} est une ${site.tagline.toLowerCase()}, installée à
> ${site.address.city} et titulaire de la licence de tour-opérateur
> international ${site.license}. Nous concevons et opérons nous-mêmes des
> circuits privés sur mesure au Vietnam, au Laos et au Cambodge, pour une
> clientèle francophone. Pas d'intermédiaire entre vous et l'équipe qui
> réserve les hôtels et missionne les guides : le même interlocuteur du
> premier message jusqu'au retour. Devis gratuit et détaillé sous
> ${site.responseTime} ouvrées.

## Après la validation

1. Ajouter l'adresse de la fiche à \`sameAs\` dans \`content/site.json\`, puis
   \`npm run build\`. Les moteurs sauront alors que la fiche et le site
   désignent la même entreprise — ce qui compte d'autant plus qu'une
   « Jasmine Tours Ha Giang » sans rapport est bien mieux référencée.
2. Basculer \`reviewSource\` de Tripadvisor vers Google dès que les avis y
   sont plus nombreux.
3. Demander un avis après chaque voyage. C'est la seule façon d'en obtenir,
   et la raison pour laquelle une agence en activité depuis ${site.founded}
   n'en compte que ${site.reviewSource.count} : personne n'a encore posé la
   question.

## Message à envoyer au retour

> Bonjour {prénom},
>
> J'espère que le retour s'est bien passé et que le Vietnam vous laisse de
> beaux souvenirs.
>
> Si le voyage vous a plu, quelques lignes publiques nous aideraient
> beaucoup — c'est ce que lisent les voyageurs qui hésitent encore, et nous
> n'avons pas d'autre moyen de leur montrer notre travail :
> {lien court de la fiche Google}
>
> Et si quelque chose n'a pas été à la hauteur, dites-le-moi d'abord à moi.
>
> {prénom du conseiller}, ${site.name}

Un lien direct, un message personnel, envoyé dans la semaine du retour. Ni
relance, ni contrepartie : offrir quoi que ce soit contre un avis est
interdit par Google et par le droit français.
`;

mkdirSync(path.join(ROOT, "docs"), { recursive: true });
writeFileSync(path.join(ROOT, "docs/google-business-profile.md"), md);
console.log("gbp : docs/google-business-profile.md généré depuis content/site.json");
