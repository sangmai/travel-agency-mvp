# content/ — le contenu éditorial

Tout ce qu'un non-développeur peut vouloir changer vit ici, en JSON. Pour
corriger un prix, ajouter une étape ou publier un avis, on édite un fichier de
ce dossier ; on ne touche pas au code.

```
site.json                  NAP, licence, note agrégée, conseillère
places.json                un lieu = un identifiant, ses noms, ses coordonnées
photos.json                alt, lieu, latitude et crédit, par identifiant d'image
carnet.json                les photos du bandeau d'ambiance, dans l'ordre
regions.json  envies.json  process.json  comparison.json
seasons.json  budget.json  faq.json  reviews.json  story.json
itineraries/<slug>.json    une fiche voyage = un fichier
```

## Comment ça se branche

`lib/content/source.ts` est **le seul fichier qui sache d'où vient le
contenu**. Il importe ces JSON ; les composants, eux, appellent
`lib/content/index.ts`. Pour passer à un CMS ou une API, on réécrit
`source.ts` et rien d'autre.

Trois choses ont été faites pour que cette bascule reste un seul fichier :

**L'API est asynchrone dès maintenant.** `getTrips()` renvoie une promesse
alors qu'un import JSON est synchrone. C'est délibéré : un CMS ne le sera pas,
et si l'API était synchrone aujourd'hui, la bascule toucherait chaque appelant.

**Les formes sont vérifiées à la compilation.** `resolveJsonModule` étant
activé, un JSON mal formé casse `npm run build` — sans bibliothèque de
validation ni coût à l'exécution. ⚠️ Cette garantie disparaît le jour où la
source devient un `fetch` : il faudra alors valider dans `source.ts`, à
l'entrée, et nulle part ailleurs.

**Les images sont référencées par identifiant, jamais par URL.** Le contenu dit
`"photo": "halong"` ; `lib/photos.ts` fait la correspondance avec le fichier.
C'est la seule chose qui ne peut pas vivre en JSON — un `import` d'image est
résolu au build, ce qui donne les dimensions et la vignette floue. Quand un CMS
fournira des URL, seule cette table changera.

## Ce qui n'est volontairement PAS ici

Les chaînes d'interface — libellés de boutons, intitulés de colonnes,
« à partir de », « Jour ». Elles font partie du dessin de la page, et les
pousser en JSON transformerait chaque composant en table de correspondance
illisible. Si une deuxième langue devient nécessaire, c'est un travail d'i18n,
pas un travail de CMS.

## Règles de forme

- **Le contenu porte des valeurs, les composants décident de l'affichage.**
  Une latitude est un nombre (`21.03`), pas `"21°N"`. Un niveau de saison est
  `"ideal"`, pas un nom de classe CSS.
- **Une étape référence un lieu par identifiant**, et peut porter son propre
  libellé : `{ "place": "lan-ha", "label": "Croisière Halong privée" }`.
  Ajouter une étape sans l'ajouter à `places.json` fait échouer le build, ce
  qui est voulu — une carte amputée en silence serait pire.
- **Les prix de `itineraries/*.json` partent directement dans le JSON-LD
  `Offer`.** Le prix affiché et le prix balisé doivent donc rester égaux ;
  c'est vérifié à chaque passage sur les six fiches.

## ⚠️ Avant mise en production

`reviews.json`, `story.json` et les six `itineraries/*.json` sont du contenu de
démonstration. Les avis et le carnet inventés présentés comme réels sont une
pratique commerciale trompeuse, et un `AggregateRating` fabriqué viole les
règles Google. Les remplacer, et renseigner les `[À REMPLIR]` de `site.json`.
