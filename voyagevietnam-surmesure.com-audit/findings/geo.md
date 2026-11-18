# Préparation à la recherche IA — 18 novembre 2026

84/100 (31 octobre : 80)

- **217 questions** balisées `FAQPage`, **217 `<details>`** rendus. Les réponses
  sont dans le HTML même repliées : ce qui compte pour les robots qui
  n'exécutent pas de JavaScript.
- **55 tableaux**, le format le plus repris en réponse générative.
- `robots.txt` déclare `Content-Signal: search=yes, ai-input=yes, ai-train=no`,
  et dit lui-même que c'est une préférence et non un contrôle d'accès.
- Aucune règle ne nomme un robot d'IA : tous passent par `User-agent: *`.
- `llms.txt` mentionne la nouvelle page outil.

## Le tiers chargé sur demande

Le widget GetYourGuide de la page planner coûte quatre requêtes et un
`Set-Cookie` — mesuré sur une page nue. Il est derrière un bouton, et la
production le confirme : avant le clic, ni script, ni `data-gyg`, ni requête
tierce.

## Ce qui plafonne la note

La présence de marque, et aucune ligne de code ne la corrige. Par ordre de
corrélation décroissante : YouTube, Reddit, LinkedIn. Pour Reddit, participer
plutôt que publier.
