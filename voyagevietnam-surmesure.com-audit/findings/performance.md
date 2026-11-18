# Performance — 18 novembre 2026

82/100 (31 octobre : 88). La seule catégorie en recul.

Lighthouse 13.6.0, API PageSpeed Insights. Trois exécutions sur l'accueil
mobile pour séparer l'écart du bruit.

               perf          LCP      TBT   CLS
    accueil    86 / 88 / 88  3,49 s   3 ms   0
    bureau     99            0,82 s   0 ms   0
    planner    97            1,74 s   8,5 ms 0
    planner b. 100           0,53 s   0 ms   0

31 octobre : accueil mobile 93, LCP 3,1 s. Le recul est réel. Le TBT de 76 ms
du premier passage était du bruit (3 ms aux deux suivants).

## Ce qui pèse, mesuré

                    accueil   planner
    requêtes          21        16
    poids total      892 Ko   374 Ko
    IMAGES           509 Ko     0
    polices          220 Ko   220 Ko
    scripts          115 Ko   121 Ko

La page qui porte le plus de JavaScript obtient 97. Celle qui n'en porte
presque pas obtient 87. La différence, ce sont 509 Ko d'images.

Deux postes identifiés : 12 Ko de CSS bloquant le rendu (179 ms) et un tiers
nouveau depuis octobre — Cloudflare Web Analytics, 10,6 Ko, 11,6 ms de fil
principal. Ensemble ils n'expliquent pas 400 ms.

## CrUX

    18 novembre : No CrUX data for this origin.
                  Insufficient Chrome traffic volume for eligibility.

Quatre semaines après l'audit qui disait « reprendre dans 4 à 6 semaines ».
La réponse est qu'on ne sait toujours pas, et qu'on ne saura pas avant d'avoir
du trafic. Ne pas optimiser le hero avant.
