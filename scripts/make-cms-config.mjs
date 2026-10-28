#!/usr/bin/env node
/**
 * Fabrique public/admin/config.yml depuis le contenu.
 *
 * Trois champs — la photo d'un circuit, le lieu d'une étape, le voyage
 * concerné par un avis — attendent un identifiant exact. Ils étaient saisis
 * au clavier, avec la liste des valeurs valides recopiée dans une
 * info-bulle : « halong » tapé « ha-long » passe la saisie, casse la
 * construction, et la personne qui a corrigé un prix n'a aucun moyen de
 * relier les deux. Les listes de choix sont donc extraites du contenu lui-
 * même, ce qui rend la faute impossible et supprime une recopie de plus.
 *
 * Le fichier produit n'est pas versionné : il se régénère au prebuild, comme
 * les variantes d'images.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const lire = (rel) => JSON.parse(readFileSync(path.join(ROOT, rel), "utf8"));

const photos = Object.keys(lire("content/photos.json"));
const lieux = lire("content/places.json").map((p) => ({ id: p.id, fr: p.fr }));
const circuits = readdirSync(path.join(ROOT, "content/itineraries"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => lire(`content/itineraries/${f}`))
  .sort((a, b) => a.days - b.days);

/**
 * Champ « liste de choix » complet, indenté d'après la profondeur demandée.
 *
 * Un premier jet calculait l'indentation des options séparément de celle du
 * champ : les quatre listes imbriquées à des profondeurs différentes se sont
 * retrouvées décalées, et le YAML les lisait comme des champs sans nom. Ici
 * l'appelant ne donne qu'une profondeur, tout en découle.
 */
const select = (nom, label, options, prof, extra = []) => {
  const t = " ".repeat(prof);
  return [
    `${t}- name: ${nom}`,
    `${t}  label: ${label}`,
    `${t}  widget: select`,
    ...extra.map((e) => `${t}  ${e}`),
    `${t}  options:`,
    ...options.map((o) => `${t}    - { label: "${o.label}", value: "${o.value}" }`),
  ].join("\n");
};

const OPT_PHOTOS = photos.map((p) => ({ label: p, value: p }));
const OPT_LIEUX = lieux.map((l) => ({ label: `${l.fr} (${l.id})`, value: l.id }));
const OPT_CIRCUITS = circuits.map((c) => ({ label: `${c.name} — ${c.days} j`, value: c.slug }));

const yml = `# ⚠️ FICHIER GÉNÉRÉ — ne pas modifier à la main.
# Source : scripts/make-cms-config.mjs, exécuté au prebuild.
# Les listes de choix ci-dessous sont extraites de content/ : ajouter une
# photo ou un lieu les y fait apparaître sans toucher à ce fichier.

backend:
  name: github
  repo: sangmai/travel-agency-mvp
  branch: main
  # Sans ceci, le CMS s'adresse à api.netlify.com, qui ne répond que pour les
  # sites hébergés chez Netlify. Le relais vit dans worker/auth.ts.
  base_url: https://travel-agency-mvp.maisang90dn.workers.dev
  commit_messages:
    create: 'Ajout {{collection}} "{{slug}}"'
    update: 'Modif {{collection}} "{{slug}}"'
    delete: 'Suppr {{collection}} "{{slug}}"'

# La langue de l'interface suit celle du navigateur : un éditeur vietnamien
# obtient le vietnamien sans rien régler.
media_folder: assets/photos
public_folder: /photos/v

collections:
  # ------------------------------------------------------------- circuits --
  - name: circuits
    label: Circuits
    label_singular: Circuit
    folder: content/itineraries
    extension: json
    format: json
    create: true
    slug: '{{fields.slug}}'
    identifier_field: name
    summary: '{{name}} — {{days}} j, dès {{priceFrom}} €'
    fields:
      - { name: slug, label: Identifiant d'URL, widget: string, hint: "Sans accent ni espace. Change l'adresse de la page." }
      - { name: code, label: Code voyage, widget: string }
      - { name: name, label: Nom, widget: string }
      - { name: tagline, label: Sous-titre, widget: string }
      - { name: days, label: Durée (jours), widget: number, value_type: int, min: 1 }
      - { name: priceFrom, label: Prix à partir de (€), widget: number, value_type: int, min: 0, hint: "Par personne, hors vols. Ce prix part aussi dans les données structurées Google." }
      - { name: niveau, label: Niveau, widget: select, options: [Facile, Facile à modéré, Modéré, Modéré à soutenu] }
      - { name: confort, label: Hébergement, widget: string }
      - { name: type, label: Type de voyage, widget: string }
      - { name: region, label: Régions, widget: string }
      - { name: saison, label: Meilleure saison, widget: string }
      - { name: groupe, label: Groupe, widget: string }
${select("photo", "Photo", OPT_PHOTOS, 6)}
      - { name: intro, label: Chapô, widget: text }
      - { name: pitch, label: Accroche (page d'accueil), widget: text }
      - { name: audience, label: Pour qui, widget: string }
      - { name: tag, label: Étiquette, widget: string, required: false, hint: "Ex. « Le plus demandé ». Laisser vide si aucune." }
      - { name: plus, label: Les plus, widget: list, collapsed: true, field: { name: item, label: Point fort, widget: string } }
      - name: stops
        label: Étapes du parcours
        widget: list
        collapsed: true
        summary: '{{fields.place}}'
        fields:
${select("place", "Lieu", OPT_LIEUX, 10)}
          - { name: label, label: Libellé affiché, widget: string, required: false, hint: "Seulement s'il diffère du nom du lieu." }
      - name: program
        label: Programme jour par jour
        widget: list
        collapsed: true
        summary: 'Jour {{fields.n}} — {{fields.title}}'
        fields:
          - { name: n, label: Jour, widget: string, hint: "« 3 », ou « 8-9 » pour deux journées décrites ensemble." }
          - { name: title, label: Titre, widget: string }
          - { name: body, label: Texte, widget: text }
          - name: facts
            label: Données pratiques
            widget: list
            collapsed: true
            summary: '{{fields.key}} · {{fields.value}}'
            fields:
              - { name: key, label: Type, widget: select, options: [trajet, marche, velo, bateau, vol, nuit, repas] }
              - { name: value, label: Valeur, widget: string, hint: "Ex. « Transfert 2 h (100 km) », « 5 h de marche, +400 m »." }
${select("photo", "Photo", OPT_PHOTOS, 10, ["required: false"])}
      - { name: nights, label: Hébergement nuit par nuit, widget: list, collapsed: true, field: { name: item, label: Nuit, widget: string } }
      - { name: included, label: Le prix comprend, widget: list, collapsed: true, field: { name: item, label: Ligne, widget: string } }
      - { name: excluded, label: Le prix ne comprend pas, widget: list, collapsed: true, field: { name: item, label: Ligne, widget: string } }

  # ----------------------------------------------------------------- avis --
  - name: avis
    label: Avis
    files:
      - name: reviews
        label: Tous les avis
        file: content/reviews.json
        fields:
          - name: reviews
            label: Avis
            widget: list
            collapsed: true
            summary: '{{fields.author}} — {{fields.rating}}/5'
            fields:
              - { name: author, label: Auteur, widget: string }
              - { name: city, label: Ville, widget: string }
              - { name: date, label: Date de départ, widget: datetime, date_format: YYYY-MM-DD, time_format: false, picker_utc: true }
              - { name: rating, label: Note sur 5, widget: number, value_type: int, min: 1, max: 5 }
              - { name: body, label: Texte, widget: text }
              - { name: title, label: Titre, widget: string, required: false }
${select("trip", "Voyage concerné", OPT_CIRCUITS, 14, ["required: false"])}
              - { name: featured, label: Afficher sur la page d'accueil, widget: boolean, required: false, default: false }

  # ---------------------------------------------------------------- pages --
  - name: pages
    label: Pages
    files:
      - name: site
        label: Agence et coordonnées
        file: content/site.json
        fields:
          - { name: name, label: Nom, widget: string }
          - { name: legalName, label: Raison sociale, widget: string }
          - { name: url, label: URL du site, widget: string }
          - { name: locale, label: Locale, widget: hidden }
          - { name: lang, label: Langue, widget: hidden }
          - { name: tagline, label: Phrase de positionnement, widget: string }
          - { name: founded, label: En activité depuis, widget: string }
          - { name: license, label: Licence tour-opérateur international, widget: string, hint: "Délivrée par l'administration vietnamienne. Affichée sur le site et déclarée à Google : doit être exacte." }
          - { name: membership, label: Autorité de tutelle, widget: string }
          - { name: phone, label: Téléphone (format technique), widget: string }
          - { name: phoneDisplay, label: Téléphone affiché, widget: string }
          - { name: phoneAlt, label: Second numéro, widget: string }
          - { name: whatsapp, label: WhatsApp, widget: string }
          - { name: email, label: E-mail, widget: string }
          - name: address
            label: Adresse
            widget: object
            collapsed: true
            fields:
              - { name: street, label: Rue, widget: string }
              - { name: city, label: Ville, widget: string }
              - { name: region, label: Région, widget: string }
              - { name: postalCode, label: Code postal, widget: string }
              - { name: country, label: Code pays, widget: string }
              - { name: countryName, label: Pays, widget: string }
          - { name: geo, label: Coordonnées, widget: object, collapsed: true, fields: [{ name: lat, label: Latitude, widget: number, value_type: float }, { name: lng, label: Longitude, widget: number, value_type: float }] }
          - name: hours
            label: Horaires d'ouverture
            widget: object
            collapsed: true
            hint: "Repris dans la fiche Google. Annoncer une plage pendant laquelle personne ne répond coûte l'appel."
            fields:
              - { name: opens, label: Ouverture, widget: string }
              - { name: closes, label: Fermeture, widget: string }
              - { name: days, label: Jours, widget: list, field: { name: day, label: Jour, widget: string } }
          - { name: social, label: Réseaux, widget: object, collapsed: true, fields: [{ name: facebook, label: Facebook, widget: string }, { name: instagram, label: Instagram, widget: string }] }
          - { name: languages, label: Langues de travail, widget: list, field: { name: langue, label: Langue, widget: string } }
          - { name: responseTime, label: Délai de réponse, widget: string }
          - { name: currency, label: Devise, widget: hidden }
          - name: team
            label: Équipe
            widget: list
            collapsed: true
            summary: '{{fields.name}} — {{fields.role}}'
            hint: "Les personnes réellement joignables. Déclarées à Google comme employées de l'agence : n'y mettre que des noms réels."
            fields:
              - { name: name, label: Nom, widget: string }
              - { name: role, label: Fonction, widget: string }

          # Aucun champ « note globale ». Une note agrégée ne se saisit pas :
          # elle se calcule depuis les avis publiés. Le champ qui existait ici
          # a servi à déclarer à Google une moyenne inventée.

      - name: faq
        label: Questions fréquentes
        file: content/faq.json
        fields:
          - name: faq
            label: Questions
            widget: list
            collapsed: true
            summary: '{{fields.q}}'
            fields:
              - { name: q, label: Question, widget: string }
              - { name: a, label: Réponse, widget: text, hint: "Commencer par l'information directe, puis la nuance : c'est ce qu'un moteur génératif reprend." }

      - name: regions
        label: Les trois régions
        file: content/regions.json
        fields:
          - name: regions
            label: Régions
            widget: list
            collapsed: true
            summary: '{{fields.name}}'
            fields:
              - { name: id, label: Identifiant, widget: string }
              - { name: name, label: Nom, widget: string }
              - { name: subtitle, label: Sous-titre, widget: string }
              - { name: feel, label: Phrase sensorielle, widget: text }
              - { name: summary, label: Description, widget: text }
              - { name: highlights, label: Étapes phares, widget: list, field: { name: item, label: Lieu, widget: string } }
              - { name: duration, label: Durée conseillée, widget: string }
              - { name: route, label: Lien, widget: string, hint: "Doit mener à une page existante : la construction échoue sinon." }
${select("photo", "Photo", OPT_PHOTOS, 14)}

      - name: envies
        label: Par envie
        file: content/envies.json
        fields:
          - name: envies
            label: Envies
            widget: list
            collapsed: true
            summary: '{{fields.title}}'
            fields:
              - { name: route, label: Lien, widget: string, hint: "Doit mener à une page existante : la construction échoue sinon." }
              - { name: title, label: Titre, widget: string }
              - { name: line, label: Phrase, widget: text, hint: "Concrète et sensorielle. « Un séjour inoubliable » ne fait rien imaginer." }
${select("photo", "Photo", OPT_PHOTOS, 14)}

  # Pas de collection « photos » : content/photos.json est un objet à clés
  # dynamiques, forme que le CMS ne sait pas éditer. Les crédits sont de toute
  # façon écrits par scripts/fetch-photos.py, et une licence CC BY mal
  # recopiée est un problème juridique, pas une coquille.
`;

writeFileSync(path.join(ROOT, "public/admin/config.yml"), yml);
console.log(
  `cms : config.yml généré — ${photos.length} photos, ${lieux.length} lieux, ` +
    `${circuits.length} circuits en listes de choix`,
);
