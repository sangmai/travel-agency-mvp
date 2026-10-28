#!/usr/bin/env python3
"""
Génère lib/map-shapes.ts — le fond de carte des fiches voyage.

    cd scripts
    curl -o ne50.json https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson
    python3 make-map.py

Source : Natural Earth 50m, domaine public. Le résultat est écrit en dur dans
le dépôt : aucune bibliothèque cartographique, aucune tuile, aucun appel réseau
à l'exécution. La carte vit dans le HTML servi.

Deux partis pris :

1. La simplification de Douglas-Peucker opère DANS L'ESPACE ÉCRAN, pas en
   degrés. La tolérance est donc en pixels du viewBox, ce qui donne un trait
   d'une finesse homogène quelle que soit la latitude, et évite de transporter
   des points que personne ne distinguera.

2. La géométrie lointaine (Chine, Thaïlande) est rabattue sur le bord du
   cadre. Elle est de toute façon rognée par le viewBox ; la porter entière
   coûtait 16 Ko pour rien.

3. Chaque tracé est accompagné de son cadre englobant, pour que la carte
   puisse écarter d'emblée ceux qui tombent hors du cadrage d'un voyage. Un
   circuit limité au Nord embarquait sinon le Cambodge et tout le Sud.

⚠️ lib/map/project.ts consomme PROJECTION et se contente d'interpoler : la
formule de Mercator n'est écrite qu'ici.
"""
import json
import math
import os
import sys

sys.setrecursionlimit(20000)

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "ne50.json")
OUT = os.path.join(HERE, "..", "lib", "map-shapes.ts")

# Emprise : tout le Vietnam, plus le Cambodge jusqu'à Angkor (103,9°E ; 13,4°N).
LON0, LON1, LAT0, LAT1 = 101.0, 110.4, 7.6, 24.0
W = 600.0  # largeur du viewBox ; la hauteur en découle
PAD = 60.0  # marge de rabattement au-delà du cadre

merc = lambda la: math.log(math.tan(math.pi / 4 + math.radians(max(-85, min(85, la))) / 2))
MY0, MY1 = merc(LAT0), merc(LAT1)
H = W * (MY1 - MY0) / ((LON1 - LON0) * math.pi / 180)

# Tolérance de simplification (px) et taille minimale retenue (px), par pays.
# Le Vietnam est le sujet : plus de détail. Les voisins sont du contexte.
SPEC = {
    "VNM": (0.7, 6),
    "KHM": (1.6, 16),
    "LAO": (1.6, 16),
    "THA": (2.2, 24),
    "CHN": (2.6, 24),
}


def project(lon, lat):
    x = (lon - LON0) / (LON1 - LON0) * W
    y = (MY1 - merc(lat)) / (MY1 - MY0) * H
    return (max(-PAD, min(W + PAD, x)), max(-PAD, min(H + PAD, y)))


def perp(p, a, b):
    (px, py), (ax, ay), (bx, by) = p, a, b
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def simplify(pts, tol):
    if len(pts) < 3:
        return pts
    dmax, idx = 0.0, 0
    for i in range(1, len(pts) - 1):
        d = perp(pts[i], pts[0], pts[-1])
        if d > dmax:
            dmax, idx = d, i
    if dmax <= tol:
        return [pts[0], pts[-1]]
    return simplify(pts[: idx + 1], tol)[:-1] + simplify(pts[idx:], tol)


def dedup(pts):
    out = [pts[0]]
    for p in pts[1:]:
        if abs(p[0] - out[-1][0]) > 0.05 or abs(p[1] - out[-1][1]) > 0.05:
            out.append(p)
    return out


def ring_path(ring, tol, min_px):
    xy = dedup([project(c[0], c[1]) for c in ring])
    if len(xy) < 4:
        return None
    xs = [p[0] for p in xy]
    ys = [p[1] for p in xy]
    if max(xs) <= 0 or min(xs) >= W or max(ys) <= 0 or min(ys) >= H:
        return None
    if max(max(xs) - min(xs), max(ys) - min(ys)) < min_px:
        return None
    xy = simplify(xy, tol)
    sx = [p[0] for p in xy]
    sy = [p[1] for p in xy]
    d = "M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in xy) + "Z"
    return {"d": d, "b": [round(min(sx), 1), round(min(sy), 1),
                          round(max(sx), 1), round(max(sy), 1)]}


def main():
    data = json.load(open(SRC))
    geo = {}
    for f in data["features"]:
        p = f["properties"]
        iso = p.get("ADM0_A3") or p.get("ISO_A3")
        if iso in SPEC:
            geo[iso] = f["geometry"]

    out = {}
    for iso, g in geo.items():
        tol, mn = SPEC[iso]
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        out[iso] = [p for p in (ring_path(r[0], tol, mn) for r in polys) if p]

    L = [
        "/**",
        " * Fond de carte — tracés SVG générés, jamais dessinés à la main.",
        " *",
        " * Source : Natural Earth 50m (domaine public). Projection de Mercator sur",
        " * une emprise fixe couvrant le Vietnam et le Cambodge jusqu'à Angkor, puis",
        " * simplification de Douglas-Peucker dans l'espace écran.",
        " *",
        " * ⚠️ Régénérer avec scripts/make-map.py ; ne pas retoucher à la main,",
        " * les points des étapes sont projetés depuis PROJECTION ci-dessous.",
        " */",
        "",
        "/**",
        " * Contrat de projection complet : l'emprise, ses bornes DÉJÀ passées",
        " * en Mercator, et les dimensions du viewBox. Le TypeScript n'a donc",
        " * qu'une interpolation linéaire à faire — la formule de Mercator",
        " * n'existe qu'ici, au lieu d'être réimplémentée de l'autre côté.",
        " */",
        "export const PROJECTION = {",
        f"  lon0: {LON0}, lon1: {LON1},",
        f"  mercY0: {MY0!r}, mercY1: {MY1!r},",
        f"  w: {W:.0f}, h: {H:.1f},",
        "};",
        "",
        "/** Un tracé et son cadre englobant [x0, y0, x1, y1]. */",
        "export type Shape = { d: string; b: [number, number, number, number] };",
        "",
        "/** Pays voisins — contexte, tracés en retrait. */",
        "export const NEIGHBOURS: Shape[] = [",
    ]
    fmt = lambda p: f'  {{ d: "{p["d"]}", b: [{", ".join(str(v) for v in p["b"])}] }},'
    for iso in ("CHN", "LAO", "THA", "KHM"):
        L += [fmt(p) for p in out.get(iso, [])]
    L += ["];", "", "/** Le Vietnam, sujet de la carte. */", "export const VIETNAM: Shape[] = ["]
    L += [fmt(p) for p in out.get("VNM", [])]
    L += ["];", ""]

    txt = "\n".join(L)
    open(OUT, "w").write(txt)

    print(f"viewBox 0 0 {W:.0f} {H:.1f}")
    for iso in SPEC:
        pts = sum(p["d"].count("L") for p in out.get(iso, []))
        print(f"  {iso}: {len(out.get(iso, [])):2d} tracés, {pts:4d} points")
    print(f"→ {OUT}  ({len(txt) / 1024:.1f} Ko)")


if __name__ == "__main__":
    main()
