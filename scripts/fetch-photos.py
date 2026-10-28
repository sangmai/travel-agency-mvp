#!/usr/bin/env python3
"""
Récupère un jeu de photographies du Vietnam sous licence libre depuis
Wikimedia Commons, les redimensionne, et consigne les crédits.

Seules les licences libres sont acceptées (CC0, domaine public, CC BY,
CC BY-SA). Tout le reste est écarté. Les crédits sont écrits dans
public/photos/CREDITS.json pour être affichés sur le site : les licences
CC BY et CC BY-SA l'exigent.
"""
import html
import json
import os
import re
import subprocess
import sys
import urllib.parse
import urllib.request

API = "https://commons.wikimedia.org/w/api.php"
OUT = sys.argv[1] if len(sys.argv) > 1 else "assets/photos"
WIDTH = 2000

FREE = re.compile(r"^(cc0|cc by|cc by-sa|public domain|pd)", re.I)

# slug -> (requête, ratio souhaité "paysage"|"portrait"|"tout")
WANTED = [
    ("hero-halong",      "Ha Long Bay junk boat sunset",            "paysage"),
    ("nord-sapa",        "Mu Cang Chai rice terraces",              "paysage"),
    ("centre-hoian",     "Hoi An lanterns night",                   "paysage"),
    ("sud-mekong",       "Cai Rang floating market Can Tho",        "paysage"),
    ("hanoi",            "Hanoi Old Quarter street",                "paysage"),
    ("ninhbinh",         "Trang An Ninh Binh boat",                 "paysage"),
    ("hue",              "Hue Imperial City gate",                  "paysage"),
    ("hagiang",          "Ha Giang Dong Van karst plateau",         "paysage"),
    ("phongnha",         "Phong Nha Ke Bang cave",                  "paysage"),
    ("phuquoc",          "Phu Quoc beach Vietnam",                  "paysage"),
    ("danang",           "Da Nang Hai Van Pass",                    "paysage"),
    ("marche",           "Vietnam market vendor conical hat",       "paysage"),
]


def api(params):
    params = {**params, "format": "json", "formatversion": "2"}
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "JasmineTravelDemo/1.0"})
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.load(r)


def clean(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()


def search(query, limit=14):
    d = api({
        "action": "query",
        "generator": "search",
        "gsrsearch": f"filetype:bitmap {query}",
        "gsrnamespace": "6",
        "gsrlimit": str(limit),
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|size",
        "iiurlwidth": str(WIDTH),
    })
    return d.get("query", {}).get("pages", []) or []


def pick(pages, orientation):
    for p in pages:
        ii = (p.get("imageinfo") or [{}])[0]
        meta = ii.get("extmetadata", {})
        lic = clean(meta.get("LicenseShortName", {}).get("value", ""))
        if not FREE.match(lic):
            continue
        w, h = ii.get("width", 0), ii.get("height", 0)
        if not w or not h or w < 1400:
            continue
        ratio = w / h
        if orientation == "paysage" and not (1.2 <= ratio <= 2.4):
            continue
        return {
            "title": p["title"].replace("File:", ""),
            "url": ii.get("thumburl") or ii.get("url"),
            "page": ii.get("descriptionurl"),
            "licence": lic,
            "auteur": clean(meta.get("Artist", {}).get("value", "")) or "Inconnu",
        }
    return None


def main():
    os.makedirs(OUT, exist_ok=True)
    credits = {}
    for slug, query, orientation in WANTED:
        try:
            hit = pick(search(query), orientation)
        except Exception as e:
            print(f"  ✗ {slug}: recherche échouée ({e})")
            continue
        if not hit:
            print(f"  ✗ {slug}: aucun résultat sous licence libre")
            continue

        dest = os.path.join(OUT, f"{slug}.jpg")
        req = urllib.request.Request(hit["url"], headers={"User-Agent": "JasmineTravelDemo/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=90) as r, open(dest, "wb") as f:
                f.write(r.read())
        except Exception as e:
            print(f"  ✗ {slug}: téléchargement échoué ({e})")
            continue

        # Redimensionnement + recompression (sips, livré avec macOS)
        subprocess.run(
            ["sips", "-Z", str(WIDTH), "-s", "format", "jpeg",
             "-s", "formatOptions", "72", dest, "--out", dest],
            check=False, capture_output=True,
        )
        kb = os.path.getsize(dest) // 1024
        credits[slug] = {k: hit[k] for k in ("title", "auteur", "licence", "page")}
        print(f"  ✓ {slug:14s} {kb:5d} Ko  {hit['licence']:12s} {hit['title'][:48]}")

    with open(os.path.join(OUT, "CREDITS.json"), "w") as f:
        json.dump(credits, f, ensure_ascii=False, indent=2)
    print(f"\n{len(credits)} photos · crédits dans {OUT}/CREDITS.json")


if __name__ == "__main__":
    main()
