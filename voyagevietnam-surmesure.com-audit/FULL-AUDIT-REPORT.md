# Audit SEO complet — voyagevietnam-surmesure.com

Audit du 31 octobre 2026. Domaine créé il y a quatre jours.

Toutes les mesures de cette page ont été relevées sur le site déployé, pas sur
le dépôt. Là où un chiffre vient d'un outil tiers, l'outil est nommé.

---

## Synthèse

**Score de santé SEO : 85/100**

| Catégorie | Poids | Note | Ce qui pèse |
|---|---|---|---|
| SEO technique | 22 % | 90 | En-têtes complets, zéro lien cassé ; cache mal réglé |
| Qualité du contenu | 23 % | 78 | 1 356 mots de moyenne, zéro page mince ; auteur non nommé, contenu de démonstration |
| SEO on-page | 20 % | 93 | Titres et descriptions propres, hiérarchie sans saut |
| Données structurées | 10 % | 72 | Graphe riche et cohérent ; `image`/`logo` absents, balisage d'avis non conforme |
| Performance | 10 % | 88 | 93–95 mobile, 98–100 bureau, CLS 0 ; durées de cache |
| Préparation IA | 10 % | 80 | Rendu serveur intégral, 27 tableaux ; présence de marque nulle |
| Images | 5 % | 92 | WebP, six largeurs, tous les `alt` corrects |

**Type d'activité détecté :** service local / agence de voyage (téléphone,
adresse physique à Da Nang, `TravelAgency` balisé, zone desservie).

### Les cinq points à traiter en premier

1. **Le balisage d'avis n'est pas conforme à la politique de Google.** Deux avis
   Tripadvisor sont déclarés en `review` de l'organisation comme s'ils avaient
   été recueillis par le site.
2. **Aucune ressource n'est mise en cache.** Tout est servi en
   `max-age=0, must-revalidate`, y compris des fichiers dont le nom contient
   déjà une empreinte.
3. **L'identité du site reste non tranchée** (option A ou B). C'est le risque
   le plus sérieux du projet, et il n'est pas technique.
4. **Aucune donnée de terrain.** Pas de Search Console vérifiée, pas de CrUX.
5. **`image` et `logo` absents** du nœud `TravelAgency`.

### Ce qui est déjà solide

- 22 pages explorées, **zéro lien interne cassé**
- 21 URL au sitemap, **toutes répondent 200 sans redirection**
- Six en-têtes de sécurité et de cache présents, **aucun manquant**
- **Zéro page sous 300 mots** — 28 486 mots au total
- 85 questions balisées en `FAQPage`, **85 `<details>` rendus** : concordance exacte
- Accessibilité **100/100** sur mobile comme sur bureau
- **CLS à 0** partout

---

## 1. SEO technique — 90/100

### Exploration et indexation

```
22 pages explorées         0 cassée
21 URL au sitemap          0 hors domaine · 0 doublon · 0 sans slash final
21/21 répondent 200        aucune redirection intermédiaire
robots.txt                 Sitemap déclaré
```

Une page est liée sans figurer au sitemap : `/credits-photos/`. **Ce n'est pas
un défaut** — la page porte `noindex`, et une page `noindex` n'a rien à faire
dans un sitemap. Même remarque pour sa méta-description de 69 caractères,
relevée par le script : elle ne sera jamais affichée.

### En-têtes

| En-tête | Valeur |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=(), interest-cohort=()` |
| `Content-Encoding` | `gzip` |
| `Cache-Control` | `public, max-age=0, must-revalidate` ← **le problème** |

### Le défaut : aucune durée de cache

Mesuré type par type, directement sur les réponses du site :

| Ressource | Nom contient une empreinte | `Cache-Control` servi |
|---|---|---|
| HTML | non (normal) | `max-age=0, must-revalidate` |
| `/_next/static/*.css` | **oui** (`058c8b23a5094280.css`) | `max-age=0, must-revalidate` |
| `/_next/static/*.js` | **oui** | `max-age=0, must-revalidate` |
| `/photos/v/*.webp` | non (`hagiang-1920.webp`) | `max-age=0, must-revalidate` |

`public/_headers` ne contient aucune règle de cache, donc Cloudflare applique
sa valeur par défaut à tout.

Conséquence concrète : un visiteur qui revient revalide **chaque fichier** —
CSS, JS, et les 78 variantes d'images. Le contenu n'est pas retéléchargé si
rien n'a changé, mais chaque aller-retour coûte une latence complète. Sur un
mobile en 4G depuis la France vers un edge Cloudflare, cela se chiffre en
centaines de millisecondes par visite répétée.

Lighthouse le relève indépendamment : audit **« Use efficient cache lifetimes »,
score 0,5**.

**Nuance importante sur le correctif.** Les fichiers `/_next/static/` portent
une empreinte dans leur nom : un changement de contenu change le nom, donc
`immutable` sur un an est sans risque. **Les photos n'en portent pas** :
`hagiang-1920.webp` garde son nom si l'image est remplacée. Un cache d'un an
sur les photos servirait l'ancienne image à tout visiteur déjà venu, parfois
pendant des mois. Les deux cas ne se traitent pas pareil.

---

## 2. Qualité du contenu — 78/100

```
28 486 mots sur 21 pages     moyenne 1 356
pages sous 300 mots          0
pages sans lien entrant      0
```

Le volume et la structure sont au-dessus de ce que fait la concurrence
directe. Ce qui retient la note est ailleurs.

### Auteur non nommé

Les treize guides déclarent un `Article` avec `datePublished` et
`dateModified` réels, tirés de l'historique du dépôt. Mais l'`author` renvoie
au nœud `organisation`, pas à une `Person`.

C'était un choix délibéré et il reste défendable : nommer quelqu'un qui n'a
pas relu la page serait un faux signal, de la même famille que la fondatrice
inventée retirée plus tôt. Mais tant que personne n'est nommé, le critère
« expérience » d'E-E-A-T n'a rien à mesurer.

### Contenu de démonstration encore en place

Six itinéraires, `story.json` et treize photos Wikimedia n'ont pas été
remplacés par du réel. Pour un site qui n'a pas encore de trafic, ce n'est pas
urgent au sens SEO — mais cela le devient le jour où un prospect lit une page
circuit.

### Un maillage interne à corriger

`/agence-de-voyage-vietnam/` ne reçoit que **deux liens internes**. C'est la
page qui porte la requête de marque et la requête locale — celle qui devrait
en recevoir le plus. Toutes les autres pages sont correctement maillées.

---

## 3. SEO on-page — 93/100

Aucune réserve sur les 21 pages indexables : titres sous 60 caractères,
descriptions entre 110 et 165, un seul `h1`, aucune hiérarchie de titres
sautée, canonique cohérente avec l'URL, `og:image` présente partout.

Aucun titre ni aucune description en double.

---

## 4. Données structurées — 72/100

### Le graphe

| Type | Occurrences |
|---|---|
| `BreadcrumbList` | 19 |
| `FAQPage` | 14 |
| `Article` | 13 |
| `TouristTrip` | 6 |
| `ItemList` | 4 |
| `Person` | 3 |
| `TravelAgency` / `LocalBusiness` | 1 |
| `WebSite`, `WebPage`, `CollectionPage`, `AboutPage` | 1 chacun |

**Toutes les références `@id` internes se résolvent.** Aucun JSON-LD invalide
sur l'ensemble du site.

### Le problème : le balisage des avis

Deux avis sont déclarés en `review` sur le nœud `TravelAgency` :

| Auteur | Date | Source réelle | Sujet |
|---|---|---|---|
| Frédéric D. | 2025-08-01 | Tripadvisor | Voyage de 15 jours au Vietnam |
| Alain V. | 2017-02-01 | Tripadvisor | **Laos et Cambodge** |

Trois choses distinctes ici, et il ne faut pas les confondre.

**La conformité.** Google demande que les avis balisés en données structurées
soient recueillis directement par le site, pas repris d'une plateforme tierce.
Reprendre des avis Tripadvisor et les déclarer comme avis de l'organisation
sort du cadre. Le risque n'est pas théorique : c'est le type de balisage qui
déclenche une action manuelle « données structurées trompeuses ».

**La pertinence.** Le second avis parle d'un voyage au Laos et au Cambodge.
Sur un site dont la promesse entière est le Vietnam, c'est un signal faible,
et pour un lecteur humain, un signal franchement bizarre.

**L'âge.** Février 2017 — neuf ans. Un avis de neuf ans ne porte presque rien.

À noter également : `site.json` déclare `reviewSource` avec **3 avis** et une
note de 4,7, alors que **2** sont publiés.

`aggregateRating` reste absent, et c'est volontaire : la note agrégée inventée
a été retirée plus tôt. Ne pas la remettre.

### Champs recommandés absents

`TravelAgency` ne déclare ni `image` ni `logo`. Les deux sont recommandés pour
`LocalBusiness` et servent à Google pour les panneaux de connaissance. Les
fichiers existent déjà — les images OG sont générées au build en 1200 × 630.

---

## 5. Performance — 88/100

Lighthouse 13.6.0, via l'API PageSpeed Insights.

| | `/` mobile | `/` bureau | `/carte-vietnam/` mobile | `/carte-vietnam/` bureau |
|---|---|---|---|---|
| Performance | 93 | 98 | **95** | **100** |
| Accessibilité | 100 | 100 | 100 | 100 |
| Bonnes pratiques | 100 | 100 | 100 | 100 |
| SEO | 100 | 100 | 100 | 100 |
| LCP | **3,1 s** | 1,0 s | **2,0 s** | 0,3 s |
| TBT | 30 ms | 50 ms | 31 ms | 0 ms |
| CLS | 0 | 0 | 0 | 0 |
| Speed Index | — | — | 4,6 s | 0,4 s |

**Un résultat contre-intuitif :** `/carte-vietnam/`, la page que je soupçonnais
la plus lourde à cause de sa carte SVG de 17 Ko en ligne, est **plus rapide que
la page d'accueil**. Le SVG en ligne ne coûte aucune requête, et la page n'a
pas de grande photo au-dessus de la ligne de flottaison.

### Le LCP de la page d'accueil

L'élément LCP est la photo du hero. Toutes les bonnes pratiques sont déjà
appliquées : `loading="eager"`, `fetchPriority="high"`, `decoding="async"`,
`sizes="100vw"`, dimensions déclarées, et **préchargement dans le `<head>`**.

Le coût est donc le poids, pas la stratégie de chargement :

| Variante | Poids |
|---|---|
| `hagiang-640.webp` | 44,0 Ko |
| `hagiang-960.webp` | 94,4 Ko |
| `hagiang-1280.webp` | **158,4 Ko** ← ce que prend un mobile courant |
| `hagiang-1920.webp` | 314,4 Ko |

Un téléphone de 390 points en DPR 3 demande 1 170 px et reçoit donc la
variante 1280. Sur le réseau bridé que simule Lighthouse, 158 Ko représentent à
eux seuls près d'une seconde.

**Avant de toucher à quoi que ce soit :** le LCP de laboratoire n'est pas le
LCP réel. CrUX ne renvoie encore rien pour ce domaine (`404 — chrome ux report
data not found`), ce qui est normal à quatre jours. Les utilisateurs français
réels sur fibre ou 5G verront un chiffre très différent. Optimiser maintenant,
c'est optimiser à l'aveugle.

### Autres relevés

- **JavaScript inutilisé** : 270 ms, concentrés sur deux fragments
  (`255-a7ba…js`, 20,9 Ko inutiles sur 44,5 ; `4bd1b696-…js`, 20,7 sur 54,3)
- **Legacy JavaScript** : score 0,5 — polyfills pour des navigateurs que la
  cible française n'utilise plus

Trois audits apparaissent en échec dans la sortie brute — « Render-blocking
requests », « Network dependency tree », « LCP breakdown ». **Ce ne sont pas des
échecs** : ce sont les audits *insight* de Lighthouse 13, purement informatifs,
sans aucun élément listé. Même chose pour
« label-content-name-mismatch », qui ne contient aucun élément — un score
d'accessibilité de 100 serait impossible avec une vraie violation axe.

---

## 6. Images — 92/100

```
76 <img> dans <main>        76 avec alt exploitable
78 fichiers générés         7,1 Mo au total
```

Une image porte `alt=""` : le fond de la section devis
(`QuoteForm.tsx:23`). Elle est explicitement marquée `decorative`, et
**`alt=""` est la valeur correcte** pour une image de décor — un lecteur
d'écran doit l'ignorer. Ce n'est pas un défaut.

Chaîne de génération solide : six largeurs WebP, floutage 16 px pour le
chargement progressif, images OG 1200 × 630 en JPEG, tout produit au build par
`scripts/make-images.mjs` et contrôlé par `scripts/check-images.mjs`.

---

## 7. Préparation à la recherche IA — 80/100

Reprend l'analyse de `GEO-ANALYSIS.md` du 31 octobre, inchangée sur le fond.

### Accès des robots

`robots.txt` n'édicte aucune règle nommant un robot d'IA : tous passent par
`User-agent: *`, qui autorise tout sauf `/api/`, `/merci`, `/auth`,
`/callback`.

| Robot | Capacité gouvernée | Accès |
|---|---|---|
| `OAI-SearchBot` | citabilité ChatGPT Search | autorisé |
| `GPTBot` | entraînement OpenAI | autorisé |
| `Claude-SearchBot` | citabilité dans la recherche Claude | autorisé |
| `ClaudeBot` | entraînement Anthropic | autorisé |
| `PerplexityBot` | recherche Perplexity | autorisé |
| `Googlebot` | Search, AI Overviews, AI Mode | autorisé |
| `Google-Extended` | entraînement et ancrage Gemini | autorisé |
| `Applebot` | Siri, Spotlight, Safari | autorisé |

Rien à corriger. Ces lignes gouvernent des capacités distinctes et ne sont pas
interchangeables : `Google-Extended` ne commande pas l'inclusion dans Google
Search, et `ClaudeBot` ne commande pas la citabilité dans Claude.

### Citabilité

Rendu serveur intégral — les réponses des FAQ sont dans le HTML **même
repliées**, parce qu'elles vivent dans des `<details>` natifs. Plusieurs robots
d'IA lisent le HTML sans exécuter de JavaScript ; c'est ce qui compte le plus
ici.

**27 tableaux** sur l'ensemble du site : c'est le format le plus repris en
réponse générative.

### Ce qui plafonne la note

La présence de marque, et elle ne se corrige pas par du code : aucune présence
sur Wikipedia, Reddit, YouTube ni LinkedIn. Trois avis Tripadvisor, une fiche
Petit Futé. Les mentions de marque corrèlent trois fois plus fortement avec les
citations d'IA que les backlinks (Ahrefs, 75 000 marques, décembre 2025).

---

## 8. Ce qui n'est pas mesurable aujourd'hui

À dire franchement plutôt que de le combler par des estimations :

| Donnée | État | Pourquoi |
|---|---|---|
| CrUX / données de terrain | **absente** | `404` — trafic Chrome insuffisant, normal à 4 jours |
| Search Console | **non vérifiée** | aucun TXT, aucune balise meta sur le site |
| Positions réelles | **inconnues** | pas de propriété, pas d'outil de suivi branché |
| Trafic organique | **inconnu** | GA4 et Cloudflare Analytics non branchés |
| Backlinks | **non mesurés** | aucune clé Moz / Bing configurée |
| Citations IA | **non mesurées** | aucun outil de suivi de citation branché |

Les notes de cet audit décrivent donc une **préparation**, pas une visibilité
constatée. Aucune des deux ne remplace l'autre.

---

## 9. Le risque qui n'est pas technique

Il faut le redire ici parce qu'un audit SEO qui l'omettrait serait incomplet.

Le site parle à la première personne au nom de Jasmin Travel : « nous »,
licence `48-049/2015/TCDL-GP LHQT`, adresse à Da Nang, trois membres d'équipe
nommés, avis Tripadvisor de l'agence. Or le modèle décrit est celui d'un
**apporteur d'affaires** — le client contracte et paie Jasmin, qui opère le
voyage, et vous touchez une commission.

Pour la chaîne financière et opérationnelle, « sans intermédiaire » reste
exact. Mais quatorze affirmations à la première personne supposent une
autorisation que rien n'atteste.

Les deux issues sont toujours ouvertes et exclusives :

**Option A** — le site est la vitrine francophone de Jasmin. Demande une
**autorisation écrite** de Jasmin pour sa licence, ses personnes et ses avis.

**Option B** — marque d'apport distincte, Jasmin nommé comme partenaire
opérateur. Demande de réécrire les quatorze affirmations et `site.json`.

Ce n'est pas un détail de conformité : E-E-A-T repose sur l'identité de
l'éditeur, et `TravelAgency` déclare une entité juridique précise. Une
mauvaise déclaration ici fragilise tout le reste.

---

## Méthode

- Exploration : suivi de tous les liens internes depuis la racine, 22 pages
- Performance : API PageSpeed Insights, Lighthouse 13.6.0, mobile et bureau
- Terrain : API CrUX — aucune donnée disponible pour ce domaine
- En-têtes et poids : mesurés sur les réponses réelles, avec `Accept-Encoding`
- Données structurées : JSON-LD extrait et analysé page par page
- Aucun sous-agent n'a été employé ; tout a été exécuté séquentiellement
