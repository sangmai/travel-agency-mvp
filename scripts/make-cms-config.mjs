#!/usr/bin/env node
/**
 * Builds public/admin/config.yml from the content.
 *
 * Three fields — an itinerary's photo, a stop's place, the trip a review refers
 * to — expect an exact identifier. They used to be typed by hand, with the list
 * of valid values copied into a tooltip: "halong" typed as "ha-long" passes
 * entry, breaks the build, and the person who corrected a price has no way of
 * connecting the two. The option lists are therefore extracted from the content
 * itself, which makes the mistake impossible and removes one more transcription.
 *
 * The generated file is not versioned: it is regenerated at prebuild, like the
 * image variants.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
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
 * A complete select field, indented according to the requested depth.
 *
 * A first attempt computed the options' indentation separately from the
 * field's: the four lists nested at different depths ended up misaligned, and
 * YAML read them as unnamed fields. Here the caller supplies only a depth, and
 * everything follows from it.
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

/* A section heading: three fields, repeated twelve times. Generating them
   avoids twelve copies that would diverge at the first label change. */
const SECTIONS = [
  ["regions", "Les trois régions"], ["envies", "Par envie"],
  ["circuits", "Les circuits"], ["process", "Notre méthode"],
  ["comparatif", "Agence locale ou TO"], ["saison", "Quand partir"],
  ["budget", "Budget"], ["avis", "Avis"], ["faq", "Questions fréquentes"],
];

const HINT_ACCENT =
  "Un mot entre *astérisques* s'affiche en ambre et en italique. " +
  "Entre accolades, {ville} {delai} {annee} {note} {avis} reprennent les valeurs du site.";

const headSveltia = (cle, label, prof) => {
  const t = " ".repeat(prof);
  return [
    `${t}- name: ${cle}`,
    `${t}  label: ${label}`,
    `${t}  widget: object`,
    `${t}  collapsed: true`,
    `${t}  fields:`,
    `${t}    - { name: kicker, label: Surtitre, widget: string }`,
    `${t}    - { name: title, label: Titre, widget: string, hint: "${HINT_ACCENT}" }`,
    `${t}    - { name: lede, label: Chapô, widget: text, required: false }`,
  ].join("\n");
};

const headPages = (cle, label, prof) => {
  const t = " ".repeat(prof);
  return [
    `${t}- name: ${cle}`,
    `${t}  label: ${label}`,
    `${t}  type: object`,
    `${t}  fields:`,
    `${t}    - { name: kicker, label: Surtitre, type: string, required: true }`,
    `${t}    - { name: title, label: Titre, type: string, required: true, description: "${HINT_ACCENT}" }`,
    `${t}    - { name: lede, label: Chapô, type: text }`,
  ].join("\n");
};

const OPT_PHOTOS = photos.map((p) => ({ label: p, value: p }));
const OPT_LIEUX = lieux.map((l) => ({ label: `${l.fr} (${l.id})`, value: l.id }));
const OPT_CIRCUITS = circuits.map((c) => ({ label: `${c.name} — ${c.days} j`, value: c.slug }));

const yml = `# ⚠️ FICHIER GÉNÉRÉ — ne pas modifier à la main.
# Source: scripts/make-cms-config.mjs, run at prebuild.
# The option lists below are extracted from content/: adding a photo or a place
# makes it appear here without touching this file.

backend:
  name: github
  repo: sangmai/travel-agency-mvp
  branch: main
  # Without this, the CMS calls api.netlify.com, which only answers for sites
  # hosted at Netlify. The relay lives in worker/auth.ts.
  base_url: https://voyagevietnam-surmesure.com
  commit_messages:
    create: 'Ajout {{collection}} "{{slug}}"'
    update: 'Modif {{collection}} "{{slug}}"'
    delete: 'Suppr {{collection}} "{{slug}}"'

# The interface language follows the browser's: a Vietnamese editor gets
# Vietnamese without configuring anything.
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

  # --------------------------------------------------------------- guides --
  # One entry per guide page. The answers age there — visa rules, prices,
  # seasons — while the layout does not move.
  - name: guides
    label: Pages guides
    label_singular: Page guide
    folder: content/guides
    extension: json
    format: json
    create: false
    delete: false
    identifier_field: title
    summary: '{{title}} — {{faq.length}} questions'
    fields:
      - { name: slug, label: Identifiant d'URL, widget: string, readonly: true, hint: "Lié au fichier de la page : ne pas modifier." }
      - { name: title, label: Titre de l'onglet, widget: string, hint: "Au-delà de 60 caractères, Google le tronque — suffixe de marque compris." }
      - { name: description, label: Description pour Google, widget: text, hint: "Entre 120 et 165 caractères. C'est l'extrait affiché sous le titre dans les résultats." }
      - { name: ogTitle, label: Titre de partage, widget: string }
      - { name: ogDescription, label: Description de partage, widget: text }
${select("photo", "Photo de partage", OPT_PHOTOS, 6)}
      - { name: photoAlt, label: Description de la photo, widget: string }
      - { name: datePublished, label: Date de publication, widget: datetime, date_format: YYYY-MM-DD, time_format: false, picker_utc: true }
      - { name: dateModified, label: Dernière mise à jour, widget: datetime, date_format: YYYY-MM-DD, time_format: false, picker_utc: true, hint: "À changer à chaque relecture de fond. Un contenu récent est nettement plus cité par les moteurs génératifs ; une date qui n'a pas bougé depuis six mois les en écarte." }
      - { name: author, label: Auteur, widget: string, required: false, hint: "Nom d'une personne de l'équipe. Laisser vide signifie que l'agence publie en son nom — ne nommer quelqu'un que s'il a réellement écrit ou relu la page." }
      - name: faq
        label: Questions fréquentes
        widget: list
        collapsed: true
        summary: '{{fields.q}}'
        fields:
          - { name: q, label: Question, widget: string }
          - { name: a, label: Réponse, widget: text, hint: "Commencer par la réponse directe, puis la nuance : c'est la phrase qu'un moteur génératif reprend." }

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
              - { name: source, label: Source de l'avis, widget: string, required: false, hint: "Ex. Tripadvisor, Google. Un avis sans source vérifiable n'est pas publiable : la loi française l'interdit, et un visiteur a raison de s'en méfier." }
              - { name: sourceUrl, label: Lien vers l'avis d'origine, widget: string, required: false }
              - { name: featured, label: Afficher sur la page d'accueil, widget: boolean, required: false, default: false }

  # ---------------------------------------------------------------- pages --
  - name: pages
    label: Pages
    files:
      - name: site
        label: Agence et coordonnées
        file: content/site.json
        fields:
          - { name: name, label: Nom de la marque, widget: string, hint: "La marque portée par ce site. L'agence qui opère les voyages se renseigne plus bas." }
          - { name: byline, label: Mention sous le nom, widget: string, hint: "« by Jasmin Travel ». Affichée sous le nom dans l'en-tête et le pied de page : c'est elle qui explique au visiteur la relation entre les deux sites." }
          - name: operator
            label: Agence qui opère les voyages
            widget: object
            hint: "Tout ce qui est ici appartient à l'agence partenaire, pas à ce site : la licence, la raison sociale, l'ancienneté. Le site le dit explicitement plutôt que de se l'attribuer."
            fields:
              - { name: name, label: Nom, widget: string }
              - { name: legalName, label: Raison sociale, widget: string }
              - { name: url, label: Site de l'agence, widget: string, hint: "Déclaré en données structurées pour qu'un moteur relie ce site à une entité déjà indexée." }
              - { name: founded, label: En activité depuis, widget: string }
              - { name: license, label: Licence tour-opérateur international, widget: string, hint: "Délivrée par l'administration vietnamienne. Affichée sur le site et déclarée à Google : doit être exacte, et attribuée à son titulaire." }
              - { name: membership, label: Autorité de tutelle, widget: string }
          - { name: url, label: URL du site, widget: string }
          - { name: locale, label: Locale, widget: hidden }
          - { name: lang, label: Langue, widget: hidden }
          - { name: tagline, label: Phrase de positionnement, widget: string }
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
          - { name: sameAs, label: Profils vérifiés — Jasmin Travel, widget: list, collapsed: true, field: { name: url, label: Adresse, widget: string }, hint: "Profils de l'OPÉRATEUR. Réseaux, plateformes d'avis, annuaires. Ces liens disent aux moteurs quelle entreprise nous sommes — utile quand une homonyme mieux référencée existe." }
          - { name: brandSameAs, label: Profils vérifiés — la marque, widget: list, collapsed: true, field: { name: url, label: Adresse, widget: string }, hint: "Profils ouverts au nom de la marque. À ne pas mélanger avec ceux de Jasmin Travel : chaque liste déclare une entité différente aux moteurs." }
          - { name: languages, label: Langues de travail, widget: list, field: { name: langue, label: Langue, widget: string } }
          - name: reviewSource
            label: Note publiée par un tiers
            widget: object
            collapsed: true
            hint: "Recopiée depuis la plateforme et affichée avec son lien. Elle n'est pas déclarée en données structurées : Google ne reconnaît pas la reprise d'une note tierce comme la sienne."
            fields:
              - { name: name, label: Plateforme, widget: string }
              - { name: url, label: Lien vers la page d'avis, widget: string }
              - { name: rating, label: Note, widget: number, value_type: float, min: 1, max: 5 }
              - { name: count, label: Nombre d'avis, widget: number, value_type: int, min: 0 }
              - { name: note, label: Classement, widget: string }
          - { name: responseTime, label: Délai de réponse, widget: string }
          - { name: currency, label: Devise, widget: hidden }
          - name: mesure
            label: Outils de mesure
            widget: object
            collapsed: true
            hint: "Un champ vide désactive l'outil : rien n'est chargé, aucune balise n'est écrite."
            fields:
              - { name: searchConsole, label: Code Search Console, widget: string, required: false, hint: "Le contenu de la balise meta fournie par Google. Ne coûte rien à la page. Dès que le site aura son domaine propre, préférer la vérification par DNS." }
              - { name: ga4, label: Identifiant GA4, widget: string, required: false, hint: "⚠️ GA4 pose des cookies. En France il ne doit se charger qu'après consentement explicite : ne renseigner ce champ qu'une fois la bannière en place." }
              - { name: cloudflare, label: Jeton Cloudflare Web Analytics, widget: string, required: false, hint: "Sans cookie ni donnée personnelle, donc sans bannière. Environ 1,5 Ko contre 30 Ko pour GA4." }
          - name: team
            label: Équipe
            widget: list
            collapsed: true
            summary: '{{fields.name}} — {{fields.role}}'
            hint: "Les personnes réellement joignables. Déclarées à Google comme employées de l'agence : n'y mettre que des noms réels."
            fields:
              - { name: name, label: Nom, widget: string }
              - { name: role, label: Fonction, widget: string }

          # No "overall rating" field. An aggregate score is not typed in: it is
          # computed from the published reviews. The field that used to be here
          # was used to declare an invented average to Google.

      - name: accueil
        label: Page d'accueil
        file: content/home.json
        fields:
          - name: hero
            label: Bandeau d'ouverture
            widget: object
            fields:
              - { name: caption, label: Légende de la photo, widget: string }
              - { name: captionNote, label: Latitude, widget: string }
              - { name: kicker, label: Surtitre, widget: string }
              - { name: title, label: Titre principal (h1), widget: string, hint: "⚠️ Doit contenir « voyage au Vietnam » ou « voyager au Vietnam » : c'est le mot-clé visé, et il a déjà disparu deux fois d'ici. ${HINT_ACCENT}" }
              - { name: sub, label: Accroche, widget: text }
              - { name: ctaPrimary, label: Bouton principal, widget: string }
              - { name: ctaSecondary, label: Bouton secondaire, widget: string }
              - name: proof
                label: Chiffres de confiance
                widget: list
                collapsed: true
                summary: '{{fields.value}} — {{fields.label}}'
                fields:
                  - { name: value, label: Valeur, widget: string, hint: "${HINT_ACCENT}" }
                  - { name: label, label: Légende, widget: string }
${SECTIONS.map(([c, l]) => headSveltia(c, l, 10)).join("\n")}
          - name: devis
            label: Formulaire de devis
            widget: object
            collapsed: true
            fields:
              - { name: kicker, label: Surtitre, widget: string }
              - { name: title, label: Titre, widget: string, hint: "${HINT_ACCENT}" }
              - { name: lede, label: Chapô, widget: text }
              - name: promises
                label: Nos engagements
                widget: list
                collapsed: true
                summary: '{{fields.title}}'
                fields:
                  - { name: title, label: Promesse, widget: string }
                  - { name: detail, label: Précision, widget: text }
              - { name: submit, label: Texte du bouton, widget: string }
          - name: closing
            label: Bandeau de clôture
            widget: object
            collapsed: true
            fields:
              - { name: title, label: Titre, widget: string }
              - { name: body, label: Texte, widget: text }

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

  # No "photos" collection: content/photos.json is an object with dynamic keys,
  # a shape the CMS cannot edit. The credits are written by
  # scripts/fetch-photos.py anyway, and a mis-transcribed CC BY licence is a
  # legal problem, not a typo.
`;

writeFileSync(path.join(ROOT, "public/admin/config.yml"), yml);

/* ------------------------------------------------------------ Pages CMS --
 *
 * A trial configuration, to compare the two tools on the same content.
 *
 * Two behavioural differences matter here. Pages CMS reads its configuration
 * from the GitHub repository rather than from the deployed site: .pages.yml
 * must therefore be versioned, where Sveltia's config.yml is regenerated at
 * build time and stays git-ignored. And it can reference a collection live,
 * which avoids freezing the itinerary list into a menu.
 */
const vals = (options, prof) =>
  options
    .map((o) => `\n${" ".repeat(prof)}- { name: "${o.value}", label: "${o.label}" }`)
    .join("");

const pages = `# ⚠️ FICHIER GÉNÉRÉ — ne pas modifier à la main.
# Source: scripts/make-cms-config.mjs. Unlike Sveltia's config.yml, this one is
# versioned: Pages CMS reads it from the GitHub repository, not from the
# deployed site. If it is out of date, the build fails.

media:
  - name: photos
    label: Photographies
    input: assets/photos
    output: /photos/v
    categories: [image]
    rename: safe

content:
  - name: circuits
    label: Circuits
    type: collection
    path: content/itineraries
    format: json
    filename: "{fields.slug}.json"
    subfolders: false
    view:
      fields: [name, days, priceFrom, region]
      sort: [days, priceFrom, name]
    fields:
      - { name: slug, label: Identifiant d'URL, type: string, required: true, pattern: "^[a-z0-9-]+$", description: "Sans accent ni espace. Change l'adresse de la page." }
      - { name: code, label: Code voyage, type: string, required: true }
      - { name: name, label: Nom, type: string, required: true }
      - { name: tagline, label: Sous-titre, type: string, required: true }
      - { name: days, label: Durée (jours), type: number, required: true, options: { min: 1, step: 1 } }
      - { name: priceFrom, label: Prix à partir de (€), type: number, required: true, options: { min: 0, step: 10 }, description: "Par personne, hors vols. Ce prix part aussi dans les données structurées Google." }
      - name: niveau
        label: Niveau
        type: select
        required: true
        options:
          values: [Facile, Facile à modéré, Modéré, Modéré à soutenu]
      - { name: confort, label: Hébergement, type: string, required: true }
      - { name: type, label: Type de voyage, type: string, required: true }
      - { name: region, label: Régions, type: string, required: true }
      - { name: saison, label: Meilleure saison, type: string, required: true }
      - { name: groupe, label: Groupe, type: string, required: true }
      - name: photo
        label: Photo
        type: select
        required: true
        options:
          values:${vals(OPT_PHOTOS, 12)}
      - { name: intro, label: Chapô, type: text, required: true }
      - { name: pitch, label: Accroche (page d'accueil), type: text, required: true }
      - { name: audience, label: Pour qui, type: string, required: true }
      - { name: tag, label: Étiquette, type: string, description: "Ex. « Le plus demandé ». Laisser vide si aucune." }
      - { name: plus, label: Les plus, type: string, list: true }
      - name: stops
        label: Étapes du parcours
        type: object
        list:
          collapsible: { collapsed: true, summary: "{place}" }
        fields:
          - name: place
            label: Lieu
            type: select
            required: true
            options:
              values:${vals(OPT_LIEUX, 16)}
          - { name: label, label: Libellé affiché, type: string, description: "Seulement s'il diffère du nom du lieu." }
      - name: program
        label: Programme jour par jour
        type: object
        list:
          collapsible: { collapsed: true, summary: "Jour {n} — {title}" }
        fields:
          - { name: n, label: Jour, type: string, required: true, description: "« 3 », ou « 8-9 » pour deux journées décrites ensemble." }
          - { name: title, label: Titre, type: string, required: true }
          - { name: body, label: Texte, type: text, required: true }
          - name: facts
            label: Données pratiques
            type: object
            list:
              collapsible: { collapsed: true, summary: "{key} · {value}" }
            fields:
              - name: key
                label: Type
                type: select
                required: true
                options:
                  values: [trajet, marche, velo, bateau, vol, nuit, repas]
              - { name: value, label: Valeur, type: string, required: true, description: "Ex. « Transfert 2 h (100 km) »." }
          - name: photo
            label: Photo
            type: select
            options:
              values:${vals(OPT_PHOTOS, 16)}
      - { name: nights, label: Hébergement nuit par nuit, type: string, list: true }
      - { name: included, label: Le prix comprend, type: string, list: true }
      - { name: excluded, label: Le prix ne comprend pas, type: string, list: true }

  - name: guides
    label: Pages guides
    type: collection
    path: content/guides
    format: json
    filename: "{fields.slug}.json"
    subfolders: false
    view:
      fields: [title, slug]
      sort: [title]
    fields:
      - { name: slug, label: Identifiant d'URL, type: string, required: true, readonly: true, description: "Lié au fichier de la page : ne pas modifier." }
      - { name: title, label: Titre de l'onglet, type: string, required: true, description: "Au-delà de 60 caractères, Google le tronque." }
      - { name: description, label: Description pour Google, type: text, required: true, description: "Entre 120 et 165 caractères." }
      - { name: ogTitle, label: Titre de partage, type: string, required: true }
      - { name: ogDescription, label: Description de partage, type: text, required: true }
      - name: photo
        label: Photo de partage
        type: select
        required: true
        options:
          values:${vals(OPT_PHOTOS, 12)}
      - { name: photoAlt, label: Description de la photo, type: string, required: true }
      - { name: datePublished, label: Date de publication, type: date, required: true, options: { format: "yyyy-MM-dd" } }
      - { name: dateModified, label: Dernière mise à jour, type: date, required: true, options: { format: "yyyy-MM-dd" }, description: "À changer à chaque relecture de fond : un contenu récent est nettement plus cité." }
      - { name: author, label: Auteur, type: string, description: "Laisser vide = l'agence publie en son nom. Ne nommer quelqu'un que s'il a réellement écrit ou relu la page." }
      - name: faq
        label: Questions fréquentes
        type: object
        list:
          collapsible: { collapsed: true, summary: "{q}" }
        fields:
          - { name: q, label: Question, type: string, required: true }
          - { name: a, label: Réponse, type: text, required: true, description: "Commencer par la réponse directe, puis la nuance." }

  - name: avis
    label: Avis
    type: file
    path: content/reviews.json
    format: json
    fields:
      - name: reviews
        label: Avis
        type: object
        list:
          collapsible: { collapsed: true, summary: "{author} — {rating}/5" }
        fields:
          - { name: author, label: Auteur, type: string, required: true }
          - { name: city, label: Ville, type: string, required: true }
          - { name: date, label: Date de départ, type: date, required: true, options: { format: "yyyy-MM-dd" } }
          - { name: rating, label: Note sur 5, type: number, required: true, options: { min: 1, max: 5, step: 1 } }
          - { name: body, label: Texte, type: text, required: true }
          - { name: title, label: Titre, type: string }
          # Live reference to the itineraries collection: the list updates
          # itself, where Sveltia requires a menu frozen at build time.
          - name: trip
            label: Voyage concerné
            type: reference
            options:
              collection: circuits
              value: "{fields.slug}"
              label: "{fields.name} — {fields.days} j"
              search: "name,slug"
          - { name: source, label: Source de l'avis, type: string, description: "Ex. Tripadvisor. Un avis sans source vérifiable n'est pas publiable." }
          - { name: sourceUrl, label: Lien vers l'avis d'origine, type: string }
          - { name: featured, label: Afficher sur la page d'accueil, type: boolean }

  - name: site
    label: Agence et coordonnées
    type: file
    path: content/site.json
    format: json
    fields:
      - { name: name, label: Nom de la marque, type: string, required: true }
      - { name: byline, label: Mention sous le nom, type: string, required: true, description: "« by Jasmin Travel » — explique la relation entre les deux sites." }
      - name: operator
        label: Agence qui opère les voyages
        type: object
        description: "Appartient à l'agence partenaire, pas à ce site."
        fields:
          - { name: name, label: Nom, type: string, required: true }
          - { name: legalName, label: Raison sociale, type: string, required: true }
          - { name: url, label: Site de l'agence, type: string, required: true }
          - { name: founded, label: En activité depuis, type: string, required: true }
          - { name: license, label: Licence tour-opérateur international, type: string, required: true, description: "Doit être exacte, et attribuée à son titulaire." }
          - { name: membership, label: Autorité de tutelle, type: string, required: true }
      - { name: url, label: URL du site, type: string, required: true }
      - { name: locale, label: Locale, type: string, hidden: true }
      - { name: lang, label: Langue, type: string, hidden: true }
      - { name: tagline, label: Phrase de positionnement, type: string, required: true }
      - { name: phone, label: Téléphone (technique), type: string, required: true }
      - { name: phoneDisplay, label: Téléphone affiché, type: string, required: true }
      - { name: phoneAlt, label: Second numéro, type: string, required: true }
      - { name: whatsapp, label: WhatsApp, type: string, required: true }
      - { name: email, label: E-mail, type: string, required: true }
      - name: address
        label: Adresse
        type: object
        fields:
          - { name: street, label: Rue, type: string, required: true }
          - { name: city, label: Ville, type: string, required: true }
          - { name: region, label: Région, type: string, required: true }
          - { name: postalCode, label: Code postal, type: string, required: true }
          - { name: country, label: Code pays, type: string, required: true }
          - { name: countryName, label: Pays, type: string, required: true }
      - name: geo
        label: Coordonnées
        type: object
        fields:
          - { name: lat, label: Latitude, type: number, required: true }
          - { name: lng, label: Longitude, type: number, required: true }
      - name: hours
        label: Horaires d'ouverture
        type: object
        fields:
          - { name: opens, label: Ouverture, type: string, required: true }
          - { name: closes, label: Fermeture, type: string, required: true }
          - { name: days, label: Jours, type: string, list: true }
      - name: social
        label: Réseaux
        type: object
        fields:
          - { name: facebook, label: Facebook, type: string, required: true }
          - { name: instagram, label: Instagram, type: string, required: true }
      - { name: sameAs, label: Profils vérifiés — Jasmin Travel, type: string, list: true, description: "Profils de l'OPÉRATEUR : réseaux, plateformes d'avis, annuaires." }
      - { name: brandSameAs, label: Profils vérifiés — la marque, type: string, list: true, description: "Profils ouverts au nom de la marque. À ne pas mélanger avec ceux de Jasmin Travel : chaque liste déclare une entité différente." }
      - { name: languages, label: Langues de travail, type: string, list: true }
      - name: reviewSource
        label: Note publiée par un tiers
        type: object
        fields:
          - { name: name, label: Plateforme, type: string, required: true }
          - { name: url, label: Lien vers la page d'avis, type: string, required: true }
          - { name: rating, label: Note, type: number, required: true }
          - { name: count, label: Nombre d'avis, type: number, required: true }
          - { name: note, label: Classement, type: string, required: true }
      - { name: responseTime, label: Délai de réponse, type: string, required: true }
      - { name: currency, label: Devise, type: string, hidden: true }
      - name: mesure
        label: Outils de mesure
        type: object
        fields:
          - { name: searchConsole, label: Code Search Console, type: string, description: "Balise meta fournie par Google. Aucun script, aucun cookie." }
          - { name: ga4, label: Identifiant GA4, type: string, description: "⚠️ Pose des cookies : consentement obligatoire en France avant chargement." }
          - { name: cloudflare, label: Jeton Cloudflare Web Analytics, type: string, description: "Sans cookie ni bannière." }
      - name: team
        label: Équipe
        type: object
        list:
          collapsible: { collapsed: true, summary: "{name} — {role}" }
        fields:
          - { name: name, label: Nom, type: string, required: true }
          - { name: role, label: Fonction, type: string, required: true }

  - name: accueil
    label: Page d'accueil
    type: file
    path: content/home.json
    format: json
    fields:
      - name: hero
        label: Bandeau d'ouverture
        type: object
        fields:
          - { name: caption, label: Légende de la photo, type: string, required: true }
          - { name: captionNote, label: Latitude, type: string, required: true }
          - { name: kicker, label: Surtitre, type: string, required: true }
          - { name: title, label: Titre principal (h1), type: string, required: true, description: "⚠️ Doit contenir « voyage au Vietnam » : c'est le mot-clé visé. ${HINT_ACCENT}" }
          - { name: sub, label: Accroche, type: text, required: true }
          - { name: ctaPrimary, label: Bouton principal, type: string, required: true }
          - { name: ctaSecondary, label: Bouton secondaire, type: string, required: true }
          - name: proof
            label: Chiffres de confiance
            type: object
            list:
              collapsible: { collapsed: true, summary: "{value} — {label}" }
            fields:
              - { name: value, label: Valeur, type: string, required: true, description: "${HINT_ACCENT}" }
              - { name: label, label: Légende, type: string, required: true }
${SECTIONS.map(([c, l]) => headPages(c, l, 6)).join("\n")}
      - name: devis
        label: Formulaire de devis
        type: object
        fields:
          - { name: kicker, label: Surtitre, type: string, required: true }
          - { name: title, label: Titre, type: string, required: true, description: "${HINT_ACCENT}" }
          - { name: lede, label: Chapô, type: text, required: true }
          - name: promises
            label: Nos engagements
            type: object
            list:
              collapsible: { collapsed: true, summary: "{title}" }
            fields:
              - { name: title, label: Promesse, type: string, required: true }
              - { name: detail, label: Précision, type: text, required: true }
          - { name: submit, label: Texte du bouton, type: string, required: true }
      - name: closing
        label: Bandeau de clôture
        type: object
        fields:
          - { name: title, label: Titre, type: string, required: true }
          - { name: body, label: Texte, type: text, required: true }

  - name: faq
    label: Questions fréquentes
    type: file
    path: content/faq.json
    format: json
    fields:
      - name: faq
        label: Questions
        type: object
        list:
          collapsible: { collapsed: true, summary: "{q}" }
        fields:
          - { name: q, label: Question, type: string, required: true }
          - { name: a, label: Réponse, type: text, required: true, description: "Commencer par l'information directe, puis la nuance." }

  - name: regions
    label: Les trois régions
    type: file
    path: content/regions.json
    format: json
    fields:
      - name: regions
        label: Régions
        type: object
        list:
          collapsible: { collapsed: true, summary: "{name}" }
        fields:
          - { name: id, label: Identifiant, type: string, required: true }
          - { name: name, label: Nom, type: string, required: true }
          - { name: subtitle, label: Sous-titre, type: string, required: true }
          - { name: feel, label: Phrase sensorielle, type: text, required: true }
          - { name: summary, label: Description, type: text, required: true }
          - { name: highlights, label: Étapes phares, type: string, list: true }
          - { name: duration, label: Durée conseillée, type: string, required: true }
          - { name: route, label: Lien, type: string, required: true, description: "Doit mener à une page existante : la construction échoue sinon." }
          - name: photo
            label: Photo
            type: select
            required: true
            options:
              values:${vals(OPT_PHOTOS, 16)}

  - name: envies
    label: Par envie
    type: file
    path: content/envies.json
    format: json
    fields:
      - name: envies
        label: Envies
        type: object
        list:
          collapsible: { collapsed: true, summary: "{title}" }
        fields:
          - { name: route, label: Lien, type: string, required: true }
          - { name: title, label: Titre, type: string, required: true }
          - { name: line, label: Phrase, type: text, required: true }
          - name: photo
            label: Photo
            type: select
            required: true
            options:
              values:${vals(OPT_PHOTOS, 16)}

settings:
  content:
    merge: true
`;

/* .pages.yml is versioned — Pages CMS reads it from the GitHub repository, not
   from the deployed site. A change left on disk without being committed leaves
   the CMS working from a stale description of the content: hence the warning,
   clearly visible but non-blocking. */
const chemin = path.join(ROOT, ".pages.yml");
const ancien = existsSync(chemin) ? readFileSync(chemin, "utf8") : "";
writeFileSync(chemin, pages);
if (ancien !== pages) {
  console.warn(
    "\ncms : ⚠️  .pages.yml a changé — il doit être committé, sinon Pages CMS\n" +
      "      continuera de lire l'ancienne version depuis GitHub.\n",
  );
}

console.log(
  `cms : config.yml + .pages.yml générés — ${photos.length} photos, ` +
    `${lieux.length} lieux, ${circuits.length} circuits en listes de choix`,
);
