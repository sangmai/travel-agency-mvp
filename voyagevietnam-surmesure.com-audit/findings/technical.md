# Technique

## Mesuré

```
22 pages explorées          0 cassée
21 URL au sitemap           0 hors domaine · 0 doublon · 0 sans slash
21/21 répondent 200         aucune redirection intermédiaire
robots.txt                  Sitemap déclaré · aucun robot d'IA bloqué
```

En-têtes servis sur `/` (avec `Accept-Encoding: gzip`) :

| En-tête | Valeur |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=(), interest-cohort=()` |
| `Content-Encoding` | `gzip` |

Aucun en-tête manquant.

## Le défaut

`public/_headers` ne contient **aucune règle de cache**. Cloudflare applique
donc `public, max-age=0, must-revalidate` à toutes les ressources.

| Ressource | Empreinte dans le nom | Cache servi |
|---|---|---|
| HTML | non (normal) | `max-age=0, must-revalidate` |
| `/_next/static/058c8b23a5094280.css` | **oui** | `max-age=0, must-revalidate` |
| `/_next/static/chunks/*.js` | **oui** | `max-age=0, must-revalidate` |
| `/photos/v/hagiang-1920.webp` | **non** | `max-age=0, must-revalidate` |

Confirmé indépendamment par Lighthouse : « Use efficient cache lifetimes »,
score 0,5.

Le correctif n'est pas uniforme. `/_next/static/` peut prendre `immutable` sur
un an sans risque, parce qu'un changement de contenu change le nom. `/photos/`
ne le peut pas : `hagiang-1920.webp` garde son nom si l'image est remplacée, et
un cache long servirait l'ancienne version à tout visiteur déjà venu.

## Non-défauts écartés

`/credits-photos/` est signalée par le script comme liée hors sitemap et avec
une description de 69 caractères. La page porte `noindex` : son absence du
sitemap est correcte, et sa description ne sera jamais affichée.
