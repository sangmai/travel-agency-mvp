# Audit SEO — voyagevietnam-surmesure.com

Ré-audit du 18 novembre 2026. Le précédent date du 31 octobre ; la version
intégrale reste dans l'historique git de ce fichier.

Toutes les mesures ont été relevées sur le site déployé. Là où un chiffre vient
d'un outil tiers, l'outil est nommé. Les mesures de performance ont été répétées
trois fois : une seule exécution de Lighthouse ne distingue pas un écart d'un
bruit de mesure.

---

## Synthèse

**Score de santé SEO : 90/100** — contre 85 le 31 octobre.

| Catégorie | Poids | 31 oct | 18 nov | Ce qui a bougé |
|---|---|---|---|---|
| SEO technique | 22 % | 90 | **96** | Cache réglé, `www` redirigé, Search Console vérifiée |
| Qualité du contenu | 23 % | 78 | **84** | Identité tranchée, +18 pages, nouvelle page outil |
| SEO on-page | 20 % | 93 | **94** | 4 réserves sur 40 pages |
| Données structurées | 10 % | 72 | **92** | Avis non conformes retirés, deux entités séparées |
| Performance | 10 % | 88 | **82** | Mobile 93 → 87, LCP 3,1 → 3,5 s |
| Préparation IA | 10 % | 80 | **84** | 217 FAQ, 55 tableaux, `Content-Signal` |
| Images | 5 % | 92 | **90** | Poids du hero inchangé, davantage d'images |

### Les cinq points critiques du 31 octobre

**Les cinq sont traités.** C'est le fait principal de ce ré-audit.

| # | Point | État |
|---|---|---|
| 1 | Balisage d'avis non conforme | **Corrigé** — plus aucun nœud `Review`, plus d'`aggregateRating` |
| 2 | Aucune durée de cache | **Corrigé**, et correctement : voir plus bas |
| 3 | Identité non tranchée (A ou B) | **Tranchée** — option B, deux entités dans le graphe |
| 4 | Search Console non vérifiée | **Vérifiée** par enregistrement TXT |
| 5 | `image` / `logo` absents | **Présents** sur la marque ; absents sur l'opérateur, et c'est défendable |

Le point 2.4 du plan précédent — rediriger `www` vers l'apex — est fait aussi :
`https://www.voyagevietnam-surmesure.com/` renvoie `301`.

### Ce qui reste

1. **Le LCP mobile a reculé** : 3,1 s → 3,5 s, score 93 → 87. Mesuré trois fois.
2. **CrUX ne renvoie toujours rien**, quatre semaines après. Le trafic réel reste
   sous le seuil d'éligibilité. C'est le vrai goulot, et il n'est pas technique.
3. **`docs/google-business-profile.md` contient quatre fois `undefined`** — un
   document destiné à être copié dans une fiche Google publique.
4. Quatre réserves de métadonnées sur quarante pages.

---

## 1. SEO technique — 96/100

### Exploration

```
40 pages explorées        0 cassée
39 URL au sitemap         0 hors domaine · 0 doublon
liées mais hors sitemap   1  →  /credits-photos/, qui porte noindex : correct
au sitemap mais non liées 0
```

### Le cache, et pourquoi il faut lire plus d'un en-tête

Le correctif demandé le 31 octobre a été appliqué, et appliqué avec la nuance
qui comptait — chaque type de ressource a la durée qui lui convient :

| Ressource | Empreinte dans le nom | `Cache-Control` servi |
|---|---|---|
| HTML | non | `public, max-age=0, must-revalidate` |
| `/_next/static/*.css` | **oui** | `public, max-age=31536000, immutable` |
| `/photos/v/*.webp` | non | `public, max-age=86400, stale-while-revalidate=604800` |

Les photos reçoivent une journée de cache plus une semaine de revalidation en
arrière-plan, et non un an : leur nom ne change pas quand l'image change, ce qui
était exactement l'avertissement du précédent audit.

**Une mise en garde de méthode.** Le script d'exploration du dépôt ne lit que
l'en-tête du document HTML. Il affiche donc `max-age=0, must-revalidate` et
donne l'impression que rien n'a été corrigé. Lire ce seul en-tête a failli
produire ici un constat faux ; il faut interroger une ressource de chaque type.

### En-têtes

Six en-têtes de sécurité et de cache présents, aucun manquant : `HSTS`
(`max-age=63072000; includeSubDomains`), `X-Content-Type-Options`,
`Referrer-Policy`, `Permissions-Policy`, `Content-Encoding: gzip`,
`Cache-Control`.

### Hôtes et vérification

- `www` → apex en `301`
- Search Console vérifiée par TXT DNS (`google-site-verification=rUGy…`), soit
  la voie recommandée : une propriété `sc-domain:` couvre les deux hôtes

---

## 2. Qualité du contenu — 84/100

```
40 pages explorées         0 page sous 300 mots
/organiser-son-voyage-au-vietnam/   1 500 mots
217 questions FAQPage      217 <details> rendus — concordance exacte
55 tableaux
```

Le site est passé de 22 à 40 pages depuis le dernier audit, dont une page
outil et neuf articles de blog.

### L'identité est tranchée, et c'est le changement le plus important

Le précédent audit appelait cela « le risque qui n'est pas technique » et le
plaçait au-dessus de toute correction de balisage. L'option B a été retenue et
réellement mise en œuvre, pas seulement déclarée :

- la marque — *Voyage Vietnam Sur Mesure* — porte le site, le domaine et l'adresse
  de contact ;
- l'opérateur — *Jasmin Travel* — porte la licence, l'adresse physique et le
  téléphone, avec son propre domaine ;
- l'en-tête du site affiche « by Jasmin Travel · Da Nang ».

La relation est donc énoncée plutôt que dissimulée, ce qui supprime le moment
« laquelle des deux est réelle ? » pour un voyageur qui cherche l'agence avant
de virer trois mille euros.

### Ce qui retient encore la note

L'`author` des guides renvoie au nœud organisation, pas à une `Person`. C'était
un choix délibéré et il reste défendable — nommer quelqu'un qui n'a pas relu la
page serait un faux signal — mais tant que personne n'est nommé, le critère
« expérience » d'E-E-A-T n'a rien à mesurer.

---

## 3. SEO on-page — 94/100

Quatre réserves sur quarante pages :

| Page | Réserve |
|---|---|
| `/blog/` | pas d'`og:image` |
| `/blog/internet-vietnam/` | description 174 caractères (limite ~165) |
| `/voyage-noces-vietnam/` | description 167 caractères |
| `/credits-photos/` | description 69 caractères — **sans objet**, la page est `noindex` |

Trois corrections réelles, donc, toutes mineures.

---

## 4. Données structurées — 92/100

### Le graphe

| Type | Occurrences |
|---|---|
| `FAQPage` | 37 |
| `BreadcrumbList` | 37 |
| `Article` | 20 |
| `BlogPosting` | 9 |
| `TouristTrip` | 6 |
| `ItemList` | 4 |
| `Person` | 3 |
| `TravelAgency` / `LocalBusiness` | 1 |
| `Organization`, `WebSite`, `WebPage`, `CollectionPage`, `AboutPage`, `Event`, `Blog` | 1 chacun |

### Les deux entités

C'est le correctif de fond :

```
Organization        « Voyage Vietnam Sur Mesure »   image ✓  logo ✓
  parentOrganization ─────────────────────────────┐
TravelAgency        « Jasmin Travel »   ◀─────────┘
                    hasCredential : licence de tour-opérateur international
                    telephone ✓  address ✓  url : jasmin-travel.com
```

La licence est attribuée à son titulaire au lieu d'être revendiquée par le site.
Aucun nœud `Review` ne subsiste, et `aggregateRating` est absent de toute la
page.

### `image` et `logo` sur l'opérateur

Absents du nœud `TravelAgency`. Ils sont recommandés pour `LocalBusiness`, mais
ce nœud décrit désormais **l'entreprise de Jasmin**, pas celle du site. Y mettre
une photo libre de droits de la baie d'Halong reviendrait à illustrer l'agence
d'un tiers avec une image qui n'est pas la sienne. À demander à Jasmin, ou à
laisser vide — ce n'est pas un défaut à corriger seul.

---

## 5. Performance — 82/100

Lighthouse 13.6.0 via l'API PageSpeed Insights. **Trois exécutions** sur la page
d'accueil mobile, pour séparer l'écart du bruit.

| | accueil mobile | accueil bureau | planner mobile | planner bureau |
|---|---|---|---|---|
| Performance | **86 / 88 / 88** | 99 | **97** | **100** |
| Accessibilité | 100 | 100 | 100 | 100 |
| Bonnes pratiques | 100 | 100 | 100 | 100 |
| SEO | 100 | 100 | 100 | 100 |
| LCP | **3,5 s** | 0,82 s | **1,74 s** | 0,53 s |
| TBT | 3 ms | 0 ms | 8,5 ms | 0 ms |
| CLS | 0 | 0 | 0 | 0 |

Le 31 octobre : accueil mobile 93, LCP 3,1 s. **Le recul est réel**, pas un
artefact : trois exécutions donnent 86/88/88 et un LCP stable à 3,49 s. Le TBT
de 76 ms relevé au premier passage, lui, était du bruit — les deux suivants
donnent 3 ms.

### Ce qui pèse, mesuré

| | accueil mobile | planner mobile |
|---|---|---|
| Requêtes | 21 | 16 |
| Poids total | 892 Ko | 374 Ko |
| **Images** | **509 Ko** | **0** |
| Polices | 220 Ko | 220 Ko |
| Scripts | 115 Ko | 121 Ko |

La page qui porte le plus de JavaScript — le planner, seul composant client du
site — obtient **97**. Celle qui n'en porte presque pas obtient **87**. La
différence entre les deux, ce sont 509 Ko d'images.

Deux postes identifiés sur l'accueil :

- **CSS bloquant le rendu** : un fichier de 12 Ko, 179 ms d'attente ;
- **un tiers nouveau depuis le dernier audit** : Cloudflare, 10,6 Ko,
  11,6 ms de fil principal — la balise Web Analytics, injectée en « Automatic
  setup » au niveau du proxy.

Ces deux postes n'expliquent pas 400 ms à eux seuls. Le reste est le poids du
hero, déjà analysé le 31 octobre, et l'instruction d'alors tient toujours.

### Et c'est là que CrUX compte

```
CrUX, 18 novembre : No CrUX data for this origin.
                    Insufficient Chrome traffic volume for eligibility.
```

Quatre semaines après le précédent audit, le site n'atteint toujours pas le
seuil d'éligibilité. Le plan d'alors disait « reprendre dans 4 à 6 semaines,
c'est à ce moment qu'on saura si le LCP de laboratoire correspond à quelque
chose de réel ». La réponse est : **on ne sait toujours pas, et on ne saura pas
avant d'avoir du trafic.**

Optimiser le hero maintenant reviendrait toujours à optimiser à l'aveugle — avec
cette fois une raison supplémentaire de s'abstenir : le goulot n'est pas la
vitesse.

---

## 6. Préparation à la recherche IA — 84/100

- **217 questions** balisées `FAQPage`, **217 `<details>`** rendus : concordance
  exacte. Les réponses sont dans le HTML même repliées, ce qui compte pour les
  robots qui n'exécutent pas de JavaScript.
- **55 tableaux**, le format le plus repris en réponse générative.
- `robots.txt` déclare un en-tête **`Content-Signal: search=yes, ai-input=yes,
  ai-train=no`** — une préférence, pas un contrôle d'accès, et le fichier le dit
  lui-même.
- Aucune règle ne nomme un robot d'IA : tous passent par `User-agent: *`.
- `llms.txt` mentionne la nouvelle page outil.

**Ce qui plafonne la note reste la présence de marque**, et aucune ligne de code
ne la corrige.

---

## 7. Le tiers qui n'est chargé que sur demande

Depuis le dernier audit, la page planner peut charger le widget d'activités de
GetYourGuide. Mesuré sur une page nue, ce widget coûte quatre requêtes et un
`Set-Cookie` avant toute interaction.

Il est donc placé derrière un bouton. Vérifié sur la production : avant le clic,
le HTML ne contient **ni script, ni balise `data-gyg`, ni requête tierce**. Le
visiteur qui ne clique pas reste dans l'architecture sans cookie du site.

C'est la bonne façon de l'intégrer, et cela mérite d'être noté parce que
l'inverse — un widget chargé d'office — aurait coûté à la fois les Core Web
Vitals et la question du consentement.

---

## 8. Un défaut hors du site, mais destiné à en sortir

`docs/google-business-profile.md` contient **quatre fois la chaîne littérale
`undefined`** : année d'ouverture, deux fois dans le texte de description, et
le numéro de licence.

Le fichier est généré par `scripts/make-gbp-sheet.mjs`, qui lit `site.founded`,
`site.legalName` et `site.license` — trois champs déplacés dans `site.operator`
lors de la séparation des deux entités, sans que le script suive.

Ce document est fait pour être copié-collé dans une fiche Google publique. Le
défaut quitte donc le dépôt dès que quelqu'un suit le document.

---

## 9. Ce qui n'est toujours pas mesurable

| Donnée | État | Pourquoi |
|---|---|---|
| CrUX / terrain | **absente** | trafic Chrome sous le seuil, à 18 jours du dernier essai |
| Positions réelles | **inconnues** | Search Console vérifiée mais aucune clé API configurée ici |
| Trafic organique | **partiel** | Cloudflare Web Analytics tourne ; pas d'accès API depuis ce poste |
| Backlinks | **non mesurés** | aucune clé Moz / Bing configurée |
| Citations IA | **non mesurées** | aucun outil de suivi branché |

Search Console est désormais vérifiée : les positions et les impressions sont
lisibles dans l'interface, même si ce rapport ne peut pas les lire.

---

## Méthode

- Exploration : `scripts/check-seo.py`, suivi de tous les liens internes, 40 pages
- Performance : API PageSpeed Insights, Lighthouse 13.6.0, **trois exécutions**
  sur l'accueil mobile, une sur chaque autre combinaison
- Terrain : API CrUX — aucune donnée pour cette origine
- En-têtes : `curl -I` sur une ressource de **chaque type**, pas seulement le HTML
- Données structurées : JSON-LD extrait et résolu nœud par nœud
- Tiers : requêtes réseau relevées dans un navigateur réel, avant et après clic
- Aucun sous-agent n'a été employé ; tout a été exécuté séquentiellement
