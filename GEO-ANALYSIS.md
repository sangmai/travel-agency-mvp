# GEO — voyagevietnam-surmesure.com

Analyse du 31 octobre 2026. Les outils bundlés n'ont pas pu être employés :
le résolveur de la machine garde en mémoire l'absence du domaine, créé il y a
deux jours. Les mesures ont été prises par méthode équivalente, en forçant
l'adresse IP et en conservant l'en-tête `Host`.

## Score de préparation : 84/100

> Mis à jour le 31 octobre 2026, après correction des deux lacunes de
> structure. Le score reste plafonné par la présence de marque, qui ne se
> corrige pas par du code.

| Critère | Poids | Note | Raison |
|---|---|---|---|
| Citabilité | 25 % | 22 | Réponse directe en tête de chaque page, 65 à 76 mots |
| Lisibilité structurelle | 20 % | 19 | 27 tableaux, titres interrogatifs, hiérarchie sans saut |
| Contenu multi-modal | 15 % | 7 | Photos et une carte SVG, aucune vidéo |
| Autorité et signaux de marque | 20 % | 12 | Dates et éditeur déclarés ; présence de marque toujours quasi nulle |
| Accessibilité technique | 20 % | 16 | Rendu serveur intégral, tous les robots autorisés |

Le score n'est pas mesuré par plateforme : aucun outil de mesure de citation
n'est branché. Les notes ci-dessus décrivent la préparation, pas la
visibilité constatée.

## Accès des robots, capacité par capacité

`robots.txt` n'édicte aucune règle nommant un robot d'IA : tous passent par
`User-agent: *`, qui autorise tout sauf `/api/`, `/merci`, `/auth` et
`/callback`. Chaque ligne ci-dessous gouverne une capacité distincte et ne
doit pas être lue comme équivalente aux autres.

| Robot | Ce qu'il gouverne | Accès |
|---|---|---|
| `OAI-SearchBot` | Citabilité dans ChatGPT Search | autorisé |
| `GPTBot` | Entraînement OpenAI | autorisé |
| `Claude-SearchBot` | Citabilité dans les recherches de Claude | autorisé |
| `ClaudeBot` | Entraînement Anthropic | autorisé |
| `PerplexityBot` | Recherche Perplexity | autorisé |
| `Googlebot` | Search, AI Overviews et AI Mode | autorisé |
| `Google-Extended` | Entraînement et ancrage Gemini / Vertex | autorisé |
| `Applebot` | Siri, Spotlight, Safari | autorisé |
| `CCBot` | Common Crawl | autorisé |

Rien à corriger. À noter pour les rapports futurs : `Google-Extended` ne
gouverne pas l'inclusion dans Google Search, et `ClaudeBot` ne gouverne pas la
citabilité dans Claude — ce sont `Googlebot` et `Claude-SearchBot` qui s'en
chargent.

## Rendu serveur

Intégral. Sur `/visa-vietnam/`, 915 mots sont présents dans le HTML brut, et
les réponses des questions fréquentes y figurent **même repliées** : elles
vivent dans des `<details>` natifs, pas dans un accordéon JavaScript.

C'est ce qui compte le plus ici, car plusieurs robots d'IA lisent le HTML sans
exécuter de JavaScript.

## Fraîcheur — corrigé le 31 octobre 2026

Les treize pages guides déclarent désormais un nœud `Article` avec
`datePublished` et `dateModified`, et affichent la date en clair sous le
chapô, dans un élément `<time>` lisible par un lecteur d'écran.

Les dates viennent de l'historique du dépôt, pas d'une estimation : une date
inventée serait un faux signal de fraîcheur, c'est-à-dire exactement ce que ce
critère cherche à mesurer. `/carte-vietnam/` est la seule à porter deux dates
distinctes, publiée le 29 et révisée le 31.

L'état précédent, pour mémoire :

C'est la lacune la plus coûteuse du site. Selon l'étude SE Ranking citée par
la référence de ce guide (1,3 million de citations), un contenu de moins de
trois mois est environ trois fois plus cité, et une page laissée six mois sans
mise à jour perd son éligibilité. Sans date, un moteur ne peut pas en juger.

Le cas le plus net est `/visa-vietnam/` : la page affiche en clair « Vérifié
le 28 octobre 2026 » dans son texte, mais ce fait n'est déclaré nulle part en
données structurées.

## Signaux d'auteur — partiellement corrigé

Chaque page déclare un éditeur et un auteur. L'auteur est l'agence
elle-même tant que personne n'est nommé : le champ existe dans le CMS, il est
vide, et le JSON-LD renvoie alors vers le nœud `organisation`.

Ce choix est délibéré. Nommer une des trois personnes de l'équipe serait une
affirmation sur qui a écrit la page et qui en répond — la même catégorie de
problème que la fondatrice inventée retirée plus tôt. Le jour où quelqu'un
relit et assume une page, son nom remplace celui de l'agence et le JSON-LD
passe de lui-même à une `Person`.

## Présence de marque

C'est ici que le site est le plus faible, et l'écart ne se comble pas par du
contenu. Les mentions de marque corrèlent trois fois plus fortement avec les
citations d'IA que les backlinks (Ahrefs, 75 000 marques, décembre 2025).

| Plateforme | Présence |
|---|---|
| Wikipedia / Wikidata | aucune |
| Reddit | aucune trouvée |
| YouTube | aucune — le signal le plus corrélé (≈ 0,737) |
| LinkedIn | aucune trouvée |
| Tripadvisor | 3 avis |
| Petit Futé | fiche présente |

Les quatre profils connus sont déclarés en `sameAs`, ce qui désambiguïse
l'entité — utile, car une « Jasmine Tours Ha Giang » sans rapport est bien
mieux référencée.

## Citabilité au niveau du passage

Le motif est appliqué partout : réponse directe en gras, puis la nuance.

| Page | Longueur | Première phrase |
|---|---|---|
| `/quand-partir-au-vietnam/` | 74 mots | « Mars et avril sont les deux meilleurs mois… » |
| `/visa-vietnam/` | 65 mots | « Non, pas pour un séjour de 45 jours ou moins. » |
| `/halong-ou-lan-ha/` | 76 mots | « Lan Ha, dans neuf cas sur dix. » |

Les 27 tableaux du site renforcent ce point : c'est le format le plus repris
en réponse générative, et le site en compte davantage que ses concurrents
directs.

## Les cinq changements à plus fort effet

1. ~~Dater les pages guides.~~ **Fait le 31 octobre 2026.**
2. **Ouvrir une chaîne YouTube.** Signal le plus corrélé aux citations, et
   totalement absent. Quelques vidéos de terrain suffisent à exister.
3. **Nommer un auteur réel.** Le champ attend un nom dans le CMS. Il ne
   demande pas de code, il demande que quelqu'un relise et assume.
4. **Programmer une relecture.** La page visa porte une date de vérification
   dans son texte : en faire une habitude trimestrielle, et refléter la date
   en données structurées.
5. **Exister sur Reddit.** Première source citée par Perplexity (46,7 % du
   top 10, Profound, juin 2025). Participer, pas publier.

## À ne pas faire

**Ne pas compter sur `llms.txt`.** Le site en sert un, généré depuis le
contenu. Google indique explicitement qu'il n'aide ni ne nuit au référencement,
et aucun grand fournisseur n'a confirmé l'utiliser. Il reste en place parce
qu'il ne coûte rien, mais il ne doit figurer dans aucun plan comme levier.

**Ne pas compter sur le balisage `FAQPage`.** Google a retiré les résultats
enrichis de FAQ pour tous les sites le 7 mai 2026. Les 85 questions du site
gardent leur valeur par leur texte, lisible dans le HTML même replié — pas par
leur balisage. Le conserver ne nuit pas ; le présenter comme un levier serait
faux.
