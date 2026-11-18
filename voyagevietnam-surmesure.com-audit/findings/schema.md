# Données structurées — 18 novembre 2026

92/100 (31 octobre : 72). La plus forte progression du ré-audit.

## Les avis non conformes sont partis

Aucun nœud `Review` sur le site, aucun `aggregateRating`. Le risque d'action
manuelle « données structurées trompeuses » est levé.

## Deux entités, correctement liées

    Organization   « Voyage Vietnam Sur Mesure »     image ✓  logo ✓
      parentOrganization ──────────────────────┐
    TravelAgency   « Jasmin Travel »   ◀───────┘
                   hasCredential : licence de tour-opérateur international
                   telephone ✓  address ✓  url : jasmin-travel.com

La licence est attribuée à son titulaire au lieu d'être revendiquée par le site.
C'est la mise en œuvre de l'option B, et c'était le risque que le précédent
audit plaçait au-dessus de toute correction technique.

## Reste

`image` et `logo` absents du nœud `TravelAgency`. Ce nœud décrit l'entreprise
de Jasmin, pas celle du site : à demander à Jasmin, ou à laisser vide. Ne pas
y mettre une photo libre de droits.
