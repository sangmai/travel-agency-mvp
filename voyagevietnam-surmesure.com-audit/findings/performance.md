# Performance

API PageSpeed Insights, Lighthouse 13.6.0.

| | `/` mobile | `/` bureau | `/carte-vietnam/` mobile | `/carte-vietnam/` bureau |
|---|---|---|---|---|
| Performance | 93 | 98 | **95** | **100** |
| Accessibilité | 100 | 100 | 100 | 100 |
| Bonnes pratiques | 100 | 100 | 100 | 100 |
| SEO | 100 | 100 | 100 | 100 |
| LCP | **3,1 s** | 1,0 s | 2,0 s | 0,3 s |
| TBT | 30 ms | 50 ms | 31 ms | 0 ms |
| CLS | 0 | 0 | 0 | 0 |
| Speed Index | — | — | 4,6 s | 0,4 s |

## Un résultat contre-intuitif

`/carte-vietnam/` embarque une carte SVG de 17 Ko **en ligne** dans le HTML.
Je la soupçonnais d'être la page la plus lourde du site. Elle est en fait **plus
rapide que la page d'accueil** : le SVG en ligne ne coûte aucune requête, et la
page n'a pas de grande photo au-dessus de la ligne de flottaison.

## Le LCP de la page d'accueil

L'élément LCP est la photo du hero. Les bonnes pratiques sont **déjà toutes
appliquées** :

```
loading="eager"   fetchPriority="high"   decoding="async"
sizes="100vw"     width=2000 height=1248
préchargement dans le <head> : oui
```

Le coût est le poids, pas la stratégie :

| Variante | Poids |
|---|---|
| `hagiang-640.webp` | 44,0 Ko |
| `hagiang-960.webp` | 94,4 Ko |
| `hagiang-1280.webp` | **158,4 Ko** ← mobile courant (390 pt, DPR 3) |
| `hagiang-1920.webp` | 314,4 Ko |

**Ne pas optimiser maintenant.** CrUX renvoie `404 — chrome ux report data not
found` pour ce domaine, ce qui est normal à quatre jours. Le LCP de laboratoire
n'est pas le LCP réel : les utilisateurs français sur fibre ou 5G verront un
chiffre très différent. Reprendre la mesure après 4 à 6 semaines de trafic.

## Autres relevés

- **JavaScript inutilisé : 270 ms** — `255-a7ba37dca2f1fa.js` (20,9 Ko inutiles
  sur 44,5), `4bd1b696-c023c6e3521b1417.js` (20,7 sur 54,3)
- **Legacy JavaScript**, score 0,5 — polyfills pour des navigateurs que la cible
  française n'utilise plus

Impact ressenti marginal : le TBT mesuré est de 30 ms.

## Audits écartés

« Render-blocking requests », « Network dependency tree » et « LCP breakdown »
apparaissent en échec dans la sortie brute. Ce sont les audits *insight* de
Lighthouse 13, purement informatifs, sans aucun élément listé.

« label-content-name-mismatch » ne liste aucun élément non plus — et un score
d'accessibilité de 100 serait impossible avec une vraie violation axe.
