# Plan d'action — voyagevietnam-surmesure.com

Issu du ré-audit du 18 novembre 2026. Comme le précédent, chaque entrée porte
une manière de savoir qu'elle a échoué : une recommandation qu'on ne peut pas
réfuter ne vaut rien.

**Les cinq points critiques du 31 octobre sont traités.** Ce plan ne les répète
pas. Ce qui suit est ce qui reste, et il est court.

---

## Phase 1 — Cette semaine

### 1.1 Corriger `docs/google-business-profile.md` — **Haute**

**Constat.** Quatre occurrences de la chaîne littérale `undefined` : année
d'ouverture, deux fois dans le texte de description, et le numéro de licence.

**Pourquoi c'est haut.** Le document existe pour être copié-collé dans une fiche
Google publique. Le défaut quitte le dépôt dès que quelqu'un suit le document.

**Cause.** `scripts/make-gbp-sheet.mjs` lit `site.founded`, `site.legalName` et
`site.license`. Ces trois champs sont passés dans `site.operator` quand la
marque et l'opérateur ont été séparés, et le script n'a pas suivi.

**La partie mécanique est de trois lignes.** La partie qui ne l'est pas : la
description doit-elle commencer par « Jasmin Travel est une agence… » ou par
« Voyage Vietnam Sur Mesure est une agence… » ? La fiche Google décrit un
établissement physique à Da Nang, qui est celui de Jasmin. C'est une décision
à prendre, pas une substitution à faire.

**Comment savoir que c'est raté :** `grep -c undefined docs/google-business-profile.md`
renvoie autre chose que `0`.

### 1.2 Trois métadonnées — **Basse, mais c'est l'affaire de dix minutes**

| Page | À faire |
|---|---|
| `/blog/` | ajouter une `og:image` |
| `/blog/internet-vietnam/` | description à 174 caractères → sous 165 |
| `/voyage-noces-vietnam/` | description à 167 caractères → sous 165 |

Ne pas toucher à `/credits-photos/` : sa description de 69 caractères ne sera
jamais affichée, la page est `noindex`.

**Comment savoir que c'est raté :** `python3 scripts/check-seo.py` signale
toujours quatre réserves.

---

## Phase 2 — Le vrai sujet

### 2.1 Le trafic, pas la vitesse — **Critique, et ce n'est pas technique**

**Constat.** CrUX ne renvoie toujours rien, dix-huit jours après le précédent
essai et quatre semaines après l'audit qui disait « reprendre dans 4 à 6
semaines ». Le site n'atteint pas le seuil d'éligibilité, qui demande un volume
de trafic Chrome que ce site n'a pas.

**Ce que cela veut dire.** Tout le reste de ce plan est secondaire. Un LCP
mobile de 3,5 s sur une page que personne ne visite ne coûte rien ; la même page
visitée mille fois par mois coûte des clients. L'ordre des priorités suit le
trafic, pas l'inverse.

**Ce qui est déjà en place pour en obtenir.** Search Console est vérifiée, le
sitemap compte 39 URL, 217 questions sont balisées et rendues, 55 tableaux sont
lisibles par un moteur génératif, et la page outil vise une requête que les
pages circuit ne visent pas.

**Ce qui manque est hors du code** : la présence de marque. Par ordre de
corrélation décroissante avec les citations d'IA — YouTube, Reddit, LinkedIn.
Pour Reddit : participer, pas publier.

**Indicateur à suivre, sans ré-auditer :** les impressions dans Search Console,
qui est enfin vérifiée. Et, dans six semaines, un nouvel essai CrUX : le jour où
il renvoie des données, le site a franchi un seuil réel.

### 2.2 Nommer un auteur — **Moyenne**

Le champ existe et attend un nom. Le JSON-LD bascule tout seul d'organisation
vers `Person`. Ne demande pas de code : demande que quelqu'un relise et assume
la page.

**Comment savoir que c'est raté :** aucun guide ne déclare d'`author` de type
`Person` six semaines après.

---

## Phase 3 — Quand CrUX parlera

### 3.1 Le LCP mobile — **à ne pas toucher avant**

**Constat mesuré.** Accueil mobile 86/88/88 sur trois exécutions, LCP 3,49 s
stable. Contre 93 et 3,1 s le 31 octobre. Le recul est réel.

**Ce qui a été identifié, et ce qui ne l'a pas été.** Deux postes sont mesurés :
12 Ko de CSS bloquant le rendu pour 179 ms, et un tiers nouveau depuis le dernier
audit — Cloudflare Web Analytics, 10,6 Ko, 11,6 ms de fil principal. Les deux
ensemble n'expliquent pas 400 ms. Le reste est le poids du hero.

**La comparaison qui tranche :** la page planner, qui porte le seul composant
client du site et 121 Ko de script, obtient **97**. L'accueil, qui n'en porte
presque pas, obtient **87**. L'écart tient aux **509 Ko d'images** que la
première n'a pas.

**Pourquoi attendre quand même.** Le LCP de laboratoire n'est pas le LCP réel,
et CrUX ne dit rien. Optimiser le hero aujourd'hui, c'est deviner — exactement
ce que le précédent plan interdisait, pour la même raison, et la raison n'a pas
changé.

**Quand ce sera le moment :** le hero est déjà en `eager`, `fetchPriority=high`,
dimensions déclarées et préchargé. Il ne restera que le poids à travailler, donc
les largeurs servies.

### 3.2 `image` et `logo` sur le nœud opérateur — **Basse**

Absents du nœud `TravelAgency`, qui décrit désormais l'entreprise de Jasmin et
non celle du site. La marque, elle, porte les deux.

**Ne pas combler avec une photo du site.** Illustrer l'agence d'un tiers avec
une image libre de droits de la baie d'Halong serait un faux signal de la même
famille que les avis retirés en octobre. À demander à Jasmin, ou à laisser vide.

---

## Phase 4 — En continu

### 4.1 Relire les durées de cache après chaque changement d'infrastructure

Elles sont correctes aujourd'hui, et c'est la correction la plus précise du
trimestre : un an et `immutable` sur les fichiers à empreinte, une journée plus
revalidation en arrière-plan sur les photos qui n'en ont pas.

**Comment savoir que c'est raté :** `curl -I` sur `/photos/v/*.webp` renvoie un
`max-age` d'un an — ce qui servirait l'ancienne image pendant des mois.

### 4.2 Interroger une ressource de chaque type, pas seulement le HTML

`scripts/check-seo.py` ne lit que l'en-tête du document. Il affiche donc
`max-age=0, must-revalidate` même quand tout est correctement réglé. Ce ré-audit
a failli conclure que rien n'avait été corrigé.

### 4.3 Relecture trimestrielle des guides

Avancer `dateModified` sans rouvrir le texte est le mensonge que le critère de
fraîcheur cherche à détecter.

### 4.4 Rejouer `check-seo.py` après chaque déploiement

Il attrape les liens cassés, les dérives de métadonnées et les divergences
FAQ / `<details>`.

---

## Ce qu'il ne faut pas faire

**Ne pas charger le widget GetYourGuide d'office.** Il est derrière un bouton,
et la production le confirme : avant le clic, aucune balise, aucun script,
aucune requête tierce. Le charger au rendu coûterait les Core Web Vitals et la
question du consentement d'un seul coup.

**Ne pas remplir `mesure.cloudflare`** tant que l'« Automatic setup » est actif
chez Cloudflare. La page aurait deux balises et compterait chaque vue deux fois.

**Ne pas optimiser le LCP avant CrUX.** Voir 3.1.

**Ne pas remettre `aggregateRating`** tant qu'il n'existe pas d'avis réellement
recueillis par le site.

**Ne pas compter sur `llms.txt`.** Google indique qu'il n'aide ni ne nuit. Il
reste parce qu'il ne coûte rien.
