# Plan d'action — voyagevietnam-surmesure.com

Issu de l'audit du 31 octobre 2026. Chaque entrée porte une manière de savoir
qu'elle a échoué — une recommandation qu'on ne peut pas réfuter ne vaut rien.

---

## Phase 1 — Semaine 1

### 1.1 Corriger le balisage des avis — **Critique**

**Constat.** Deux avis Tripadvisor sont déclarés en `review` du nœud
`TravelAgency` comme s'ils avaient été recueillis par le site. L'un porte sur
un voyage au **Laos et au Cambodge**, daté de **février 2017**.

**Pourquoi c'est critique.** Google demande que les avis balisés soient
recueillis directement par le site. C'est le type de balisage qui déclenche une
action manuelle « données structurées trompeuses ». Le coût d'une action
manuelle dépasse de très loin le gain de deux avis.

**Trois décisions distinctes, à prendre séparément :**

| | Action | Effet |
|---|---|---|
| Balisage | Retirer `review` du JSON-LD | Supprime le risque de conformité |
| Affichage | Garder les citations visibles, avec lien vers Tripadvisor | Garde la preuve sociale, honnêtement sourcée |
| Avis Laos/Cambodge | Retirer | Hors sujet et vieux de neuf ans |

Garder le texte visible sur la page est parfaitement légitime — c'est le
*balisage en données structurées* qui pose problème, pas la citation. Attribuer
clairement (« Avis publié sur Tripadvisor ») est ce qui distingue la citation
de l'appropriation.

**Ne pas remettre `aggregateRating`.** Il a été retiré parce qu'il était
inventé.

**Corriger aussi `site.json`** : `reviewSource` annonce 3 avis, 2 sont publiés.

**Comment savoir que c'est raté :** le Rich Results Test continue de signaler
un extrait d'avis ; ou Search Console affiche un avertissement « avis » une
fois la propriété vérifiée.

---

### 1.2 Vérifier Search Console — **Critique**

**Constat.** Ni TXT DNS ni balise meta. Aucune donnée Google n'est accessible.

**Pourquoi c'est critique.** Tout le reste du suivi en dépend. Sans propriété,
vous ne savez pas ce qui est indexé, ce qui remonte, ni ce qui casse.

**Voie recommandée : TXT DNS**, pas la balise meta — une propriété `sc-domain:`
couvre apex + `www` + http + https d'un coup, et vous avez les deux hôtes.

1. `search.google.com/search-console` → **Domaine** → `voyagevietnam-surmesure.com`
2. Cloudflare → DNS → `TXT`, nom `@`, contenu = la chaîne fournie
3. **Valider**

Je ne peux pas le faire à votre place : le jeton wrangler lit les zones mais
n'écrit pas le DNS (`10000 Authentication error`, scope Workers uniquement).

**Puis nommer le sitemap** dans *Sitemaps* → `sitemap.xml`. À savoir : Google
l'a déjà découvert via `robots.txt`. Le nommer n'accélère pas l'exploration —
cela ouvre le **rapport d'erreurs**. C'est de la visibilité, pas de la vitesse.

**Comment savoir que c'est raté :** la validation échoue, ou le sitemap reste
en `N'a pas pu être récupéré` plus de 48 heures.

---

### 1.3 Régler les durées de cache — **Haute**

**Constat.** `public/_headers` ne contient aucune règle de cache. Cloudflare
applique `max-age=0, must-revalidate` à tout, y compris aux fichiers dont le
nom contient déjà une empreinte. Confirmé indépendamment par Lighthouse
(« Use efficient cache lifetimes », score 0,5).

**Le correctif n'est pas uniforme, et c'est le point à ne pas rater :**

| Ressource | Empreinte dans le nom | Traitement |
|---|---|---|
| `/_next/static/*` | **oui** | `max-age=31536000, immutable` — sans risque |
| `/photos/*` | **non** | cache court + revalidation en arrière-plan |
| HTML | non | laisser revalider |

Mettre un an sur `/photos/` servirait l'ancienne image à tout visiteur déjà
venu, parfois pendant des mois, puisque le nom ne change pas quand l'image
change. C'est exactement le genre de correctif « évident » qui crée un bug
qu'on ne reproduit jamais sur sa propre machine.

**Comment savoir que c'est raté :** après déploiement, `curl -I` sur un fichier
`/_next/static/` ne renvoie pas `immutable` ; ou bien une photo remplacée
continue d'apparaître en ancienne version après vidage du cache Cloudflare.

**Dépendance :** aucune. À faire indépendamment du reste.

---

### 1.4 Trancher l'identité — option A ou B — **Haute**

**Constat.** Quatorze affirmations à la première personne, une licence, une
adresse et trois personnes nommées, pour un modèle d'apport d'affaires.

Ce n'est pas une tâche technique et je ne peux pas la trancher à votre place.
Mais elle **bloque** tout travail E-E-A-T sérieux : nommer un auteur, écrire
une page « à propos » crédible, demander des avis en son nom propre.

**Comment savoir que c'est raté :** vous ne pouvez pas produire, sur demande,
un document écrit de Jasmin autorisant l'usage de sa licence et de ses avis.

---

## Phase 2 — Semaines 2 et 3

### 2.1 Ajouter `image` et `logo` au nœud `TravelAgency` — **Moyenne**

Les deux sont recommandés pour `LocalBusiness` et servent aux panneaux de
connaissance. Les fichiers existent déjà : `scripts/make-images.mjs` produit
des images OG en 1200 × 630.

**Comment savoir que c'est raté :** le Rich Results Test continue de signaler
`image` comme champ recommandé manquant.

### 2.2 Mailler `/agence-de-voyage-vietnam/` — **Moyenne**

Deux liens entrants seulement, alors que c'est la page de la requête de marque
et de la requête locale. Toutes les autres pages sont correctement maillées.

**Comment savoir que c'est raté :** un nouveau passage de `check-seo.py` montre
toujours ≤ 2 liens entrants.

### 2.3 Brancher la mesure d'audience — **Moyenne**

Les champs sont déjà câblés et vides : `mesure.cloudflare`, `mesure.ga4`.
Cloudflare Web Analytics est le moins coûteux pour la page — pas de cookie,
pas de bandeau.

**Indicateur à suivre ensuite :** première session organique enregistrée.

### 2.4 Rediriger `www` vers l'apex — **Moyenne**

Règle de redirection Cloudflare, 301. Sans elle, deux hôtes servent le même
contenu.

**Comment savoir que c'est raté :** `curl -I https://www.voyagevietnam-surmesure.com/`
ne renvoie pas `301` vers l'apex.

---

## Phase 3 — Mois 2

### 3.1 Remplacer le contenu de démonstration — **Haute avant tout vrai client**

Six itinéraires, `story.json`, treize photos Wikimedia. Sans impact SEO tant
qu'il n'y a pas de trafic ; impact immédiat le jour où un prospect lit une page
circuit.

### 3.2 Nommer un auteur réel — **Moyenne**

Le champ existe dans le CMS et attend un nom. Il ne demande pas de code : il
demande que quelqu'un relise et assume la page. Le JSON-LD bascule tout seul
d'`organisation` vers `Person`.

**Dépend de 1.4** — on ne peut pas nommer quelqu'un avant de savoir au nom de
qui le site parle.

### 3.3 Écrire la politique de confidentialité — **Haute avant tout vrai client**

Texte juridique. Je ne le rédigerai pas.

### 3.4 Vérifier le domaine chez Resend — **Moyenne**

`DEVIS_FROM` utilise encore `onboarding@resend.dev`. L'envoi fonctionne, mais
l'en-tête d'expéditeur est celui d'un bac à sable.

### 3.5 Présence de marque — **Moyenne, effet lent**

C'est ce qui plafonne la note IA, et aucune ligne de code ne le corrige.
Par ordre de corrélation décroissante : YouTube (≈ 0,737), Reddit, LinkedIn.

Pour Reddit : participer, pas publier. La différence décide du résultat.

---

## Phase 4 — En continu

### 4.1 Reprendre CrUX dans 4 à 6 semaines

Aujourd'hui `404 — données insuffisantes`, ce qui est **normal** à quatre jours
et n'indique aucun problème. CrUX agrège sur 28 jours glissants.

C'est seulement à ce moment qu'on saura si le LCP mobile de 3,1 s en
laboratoire correspond à quoi que ce soit de réel. **Ne pas optimiser le hero
avant** : optimiser sans donnée de terrain, c'est deviner.

### 4.2 Relecture trimestrielle des guides

La page visa affiche « Vérifié le 28 octobre 2026 » dans son texte. En faire
une habitude, et déplacer `dateModified` **à cette occasion seulement**.

Avancer une date sans rouvrir le texte est exactement le mensonge que le
critère de fraîcheur cherche à détecter.

### 4.3 Rejouer `check-seo.py` après chaque déploiement

Il attrape les liens cassés, les dérives de métadonnées et les divergences
FAQ / `<details>`.

---

## Ce qu'il ne faut pas faire

**Ne pas compter sur `llms.txt`.** Le site en sert un. Google indique
explicitement qu'il n'aide ni ne nuit. Il reste parce qu'il ne coûte rien, mais
il ne doit figurer dans aucun plan comme levier.

**Ne pas compter sur le balisage `FAQPage`.** Google a retiré les résultats
enrichis de FAQ pour tous les sites le 7 mai 2026. Les 85 questions gardent
leur valeur par leur **texte**, lisible dans le HTML même replié — pas par leur
balisage.

**Ne pas utiliser l'Indexing API** pour ces pages. Google la réserve
officiellement à `JobPosting` et `BroadcastEvent`. Pour forcer l'exploration
d'une page précise, utiliser *Inspection d'URL → Demander une indexation*.

**Ne pas remettre `aggregateRating`** tant qu'il n'existe pas d'avis réellement
recueillis par le site.

**Ne pas optimiser le LCP maintenant.** Voir 4.1.
