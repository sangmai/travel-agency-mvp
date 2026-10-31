import re, json, ssl, socket, http.client
from collections import defaultdict

HOST, IP = "voyagevietnam-surmesure.com", "172.67.194.172"
ctx = ssl.create_default_context()

def get(path):
    """Contourne le résolveur local, qui garde l'absence du domaine en cache."""
    c = http.client.HTTPSConnection(IP, 443, context=ctx, timeout=25)
    c.sock = None
    c._create_connection = lambda *a, **k: socket.create_connection((IP, 443), 25)
    c.host = HOST
    c.request("GET", path, headers={"Host": HOST, "User-Agent": "Mozilla/5.0 (audit)"})
    r = c.getresponse()
    body = r.read().decode("utf-8", "replace")
    st, hdrs = r.status, dict(r.getheaders())
    c.close()
    return st, body, hdrs

# --- crawl ---------------------------------------------------------------
seen, pages, casses = set(), {}, []
file = ["/"]
while file:
    p = file.pop(0)
    if p in seen: continue
    seen.add(p)
    st, html, _ = get(p)
    if st != 200:
        casses.append((p, st)); continue
    pages[p] = html
    for href in re.findall(r'href="(/[^"#?]*)"', html):
        if re.search(r"\.(webp|png|jpe?g|css|js|ico|xml|txt|woff2?|svg)$", href): continue
        if not href.endswith("/"): href += "/"
        if href not in seen: file.append(href)

print(f"=== CRAWL : {len(pages)} pages, {len(casses)} cassées ===")
for p, s in casses: print(f"  ✗ {s} {p}")
if not casses: print("  aucune ✓")

# --- métadonnées ----------------------------------------------------------
print("\n=== MÉTADONNÉES ===")
titres, descs, pb_total = defaultdict(list), defaultdict(list), 0
for p, h in sorted(pages.items()):
    t = (re.search(r"<title>(.*?)</title>", h, re.S) or [None, ""])[1].strip()
    d = (re.search(r'name="description" content="([^"]*)"', h) or [None, ""])[1]
    can = (re.search(r'rel="canonical" href="([^"]*)"', h) or [None, ""])[1]
    h1 = re.findall(r"<h1[^>]*>(.*?)</h1>", h, re.S)
    og = len(re.findall(r'property="og:image"', h))
    titres[t].append(p); descs[d].append(p)
    pb = []
    if len(t) > 60: pb.append(f"title {len(t)}c")
    if d and not (110 <= len(d) <= 165): pb.append(f"desc {len(d)}c")
    if len(h1) != 1: pb.append(f"{len(h1)} h1")
    if not can.startswith(f"https://{HOST}"): pb.append("canonique hors domaine")
    if can.rstrip("/") != f"https://{HOST}{p}".rstrip("/"): pb.append("canonique ≠ URL")
    if og == 0: pb.append("pas d'og:image")
    niv = [int(x) for x in re.findall(r"<h([1-6])[^>]*>", h)]
    if any(b > a + 1 for a, b in zip(niv, niv[1:])): pb.append("saut de titre")
    pb_total += len(pb)
    if pb: print(f"  {p:<36} {' · '.join(pb)}")
print(f"  → {pb_total} réserve(s) sur {len(pages)} pages")

for lbl, dd in [("TITRES", titres), ("DESCRIPTIONS", descs)]:
    dup = {k: v for k, v in dd.items() if len(v) > 1 and k}
    if dup:
        print(f"  ⚠ {lbl} en double :")
        for k, v in dup.items(): print(f"    « {k[:46]} » → {v}")

# --- données structurées --------------------------------------------------
print("\n=== DONNÉES STRUCTURÉES (GEO) ===")
tot = defaultdict(int)
faq_q = det = tables = 0
for p, h in pages.items():
    for b in re.findall(r'application/ld\+json">(.*?)</script>', h, re.S):
        try: data = json.loads(b)
        except Exception: print(f"  ✗ JSON invalide sur {p}"); continue
        for n in (data.get("@graph") or [data]):
            t = n.get("@type"); t = t if isinstance(t, str) else "/".join(t or [])
            tot[t] += 1
            if t == "FAQPage": faq_q += len(n.get("mainEntity", []))
    det += len(re.findall(r"<details", h))
    tables += len(re.findall(r"<table", h))
for t, n in sorted(tot.items(), key=lambda x: -x[1]):
    print(f"  {t:<28} {n}")
print(f"\n  questions balisées FAQPage : {faq_q}")
print(f"  <details> rendus           : {det}  {'✓ concordent' if faq_q == det else '✗ divergent'}")
print(f"  <table> (format très cité) : {tables}")

# --- robots / sitemap -----------------------------------------------------
print("\n=== ROBOTS & SITEMAP ===")
_, rb, _ = get("/robots.txt")
print("  " + "\n  ".join(l for l in rb.strip().split("\n") if l.strip()))
_, sm, _ = get("/sitemap.xml")
locs = re.findall(r"<loc>([^<]+)</loc>", sm)
print(f"\n  sitemap : {len(locs)} URL")
hors = [l for l in locs if not l.startswith(f"https://{HOST}")]
print(f"  hors domaine : {len(hors)}")
atteintes = {f"https://{HOST}{p}".rstrip("/") + "/" for p in pages}
print(f"  au sitemap mais non liées : {len([l for l in locs if l not in atteintes])}")
print(f"  liées mais hors sitemap   : {len([a for a in atteintes if a not in locs])}")

# --- en-têtes -------------------------------------------------------------
print("\n=== EN-TÊTES ===")
st, _, hd = get("/")
for k in ("content-encoding", "cache-control", "strict-transport-security", "x-content-type-options", "content-security-policy"):
    print(f"  {k:<28} {hd.get(k, '— absent')}")
