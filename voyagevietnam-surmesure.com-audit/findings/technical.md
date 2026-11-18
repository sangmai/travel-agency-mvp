# Technical SEO — 18 novembre 2026

96/100 (31 octobre : 90)

## Résolu depuis le dernier audit

**Durées de cache.** Le correctif a été appliqué avec la nuance qui comptait —
une durée par type de ressource, et non une durée uniforme :

    HTML                     public, max-age=0, must-revalidate
    /_next/static/*.css      public, max-age=31536000, immutable
    /photos/v/*.webp         public, max-age=86400, stale-while-revalidate=604800

Les photos ne reçoivent pas un an, parce que leur nom ne change pas quand
l'image change. C'était l'avertissement du 31 octobre, et il a été suivi.

**`www` → apex** en 301.

**Search Console** vérifiée par TXT DNS, soit la voie recommandée : une
propriété `sc-domain:` couvre apex et `www` d'un coup.

## Mise en garde de méthode

`scripts/check-seo.py` ne lit que l'en-tête du document HTML. Il affiche donc
`max-age=0, must-revalidate` même lorsque tout est réglé, et ce ré-audit a
failli conclure que rien n'avait changé. Interroger une ressource de **chaque
type**.

## État

    40 pages explorées        0 cassée
    39 URL au sitemap         0 hors domaine
    liées hors sitemap        1 → /credits-photos/, noindex : correct
    en-têtes manquants        0
