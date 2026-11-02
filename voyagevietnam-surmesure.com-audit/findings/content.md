# Contenu

```
28 486 mots sur 21 pages     moyenne 1 356
pages sous 300 mots          0
pages sans lien entrant      0
76 <img> dans <main>         76 avec un alt correct
```

Le volume et la structure dépassent ce que fait la concurrence directe.

## Ce qui retient la note

**Aucun auteur nommé.** Les treize guides portent un `Article` avec des dates
réelles tirées de l'historique du dépôt, mais l'`author` renvoie au nœud
`organisation`. Choix délibéré et défendable — nommer quelqu'un qui n'a pas relu
la page serait un faux signal, de la même famille que la fondatrice inventée
retirée plus tôt. Mais le critère « expérience » d'E-E-A-T n'a alors rien à
mesurer.

**Contenu de démonstration.** Six itinéraires, `story.json` et treize photos
Wikimedia n'ont pas été remplacés. Sans impact SEO tant qu'il n'y a pas de
trafic ; impact immédiat le jour où un prospect lit une page circuit.

**Un trou dans le maillage.** `/agence-de-voyage-vietnam/` ne reçoit que **deux
liens internes**, alors que c'est la page de la requête de marque et de la
requête locale. Toutes les autres pages sont correctement maillées.

## Image sans alt : non-défaut

Une seule image porte `alt=""` — le fond de la section devis
(`QuoteForm.tsx:23`), explicitement marqué `decorative`. **`alt=""` est la
valeur correcte** pour une image de décor : un lecteur d'écran doit l'ignorer.
