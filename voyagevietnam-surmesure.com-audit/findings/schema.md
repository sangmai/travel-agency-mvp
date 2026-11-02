# Données structurées

## Le graphe

| Type | Occurrences |
|---|---|
| `BreadcrumbList` | 19 |
| `FAQPage` | 14 |
| `Article` | 13 |
| `TouristTrip` | 6 |
| `ItemList` | 4 |
| `Person` | 3 |
| `TravelAgency` / `LocalBusiness` | 1 |
| `WebSite` · `WebPage` · `CollectionPage` · `AboutPage` | 1 chacun |

**Toutes les références `@id` internes se résolvent.** Aucun JSON-LD invalide
sur l'ensemble du site.

## Critique — le balisage des avis

Deux avis sont déclarés en `review` sur le nœud `TravelAgency` :

| Auteur | Date | Source réelle | Sujet |
|---|---|---|---|
| Frédéric D. | 2025-08-01 | Tripadvisor | Vietnam, 15 jours |
| Alain V. | 2017-02-01 | Tripadvisor | **Laos et Cambodge** |

Trois problèmes distincts, à ne pas confondre.

**Conformité.** Google demande que les avis balisés soient recueillis
directement par le site. Reprendre des avis Tripadvisor et les déclarer comme
avis de l'organisation sort du cadre, et c'est le type de balisage qui
déclenche une action manuelle « données structurées trompeuses ».

**Pertinence.** Le second avis parle du Laos et du Cambodge, sur un site dont
la promesse entière est le Vietnam.

**Âge.** Février 2017 — neuf ans.

Le correctif n'est pas de supprimer les citations : c'est le **balisage** qui
pose problème, pas la citation. Garder le texte visible avec attribution claire
et lien vers Tripadvisor est légitime et conserve la preuve sociale.

`site.json` déclare par ailleurs `reviewSource` avec 3 avis, alors que 2 sont
publiés.

## Champs recommandés absents

`TravelAgency` ne déclare ni `image` ni `logo` — recommandés pour
`LocalBusiness`, utilisés par Google pour les panneaux de connaissance. Les
fichiers existent : `scripts/make-images.mjs` produit des images OG 1200 × 630.

## À ne pas rétablir

`aggregateRating` est absent **volontairement** : la note qui s'y trouvait
(4,9 sur 384 avis) était inventée et a été publiée à Google avant d'être
retirée. Ne pas la remettre tant qu'aucun avis n'est recueilli par le site.
