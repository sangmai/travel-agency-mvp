#!/usr/bin/env python3
"""
SEO audit, by crawling the deployed site.

Follows every internal link from the root, then checks on each page: title and
description within display limits, a single h1, no skipped heading level,
canonical consistent with the URL, share image, and agreement between the
questions marked up as FAQPage and the rendered <details> — a FAQ declared but
absent from the render breaks Google's rules.

Also counts tables: that is the format a generative engine reuses most readily.

    python3 scripts/check-seo.py

Requests go through the IP address while forcing the Host header: the local
resolver on some machines caches the absence of a recently created domain.
"""
import http.client
import json
import re
import socket
import ssl
from collections import defaultdict

HOST, IP = "voyagevietnam-surmesure.com", "172.67.194.172"
ctx = ssl.create_default_context()

def get(path, gzip=False):
    """Bypasses the local resolver, which caches the domain's absence."""
    c = http.client.HTTPSConnection(IP, 443, context=ctx, timeout=25)
    c.sock = None
    c._create_connection = lambda *a, **k: socket.create_connection((IP, 443), 25)
    c.host = HOST
    h = {"Host": HOST, "User-Agent": "Mozilla/5.0 (audit)"}
    if gzip:
        # Without this header the origin does not compress and `content-encoding`
        # looks absent, when it never is for a real browser.
        h["Accept-Encoding"] = "gzip"
    c.request("GET", path, headers=h)
    r = c.getresponse()
    raw = r.read()
    if r.getheader("content-encoding") == "gzip":
        import gzip
        raw = gzip.decompress(raw)
    body = raw.decode("utf-8", "replace")
    # Header names are case-insensitive, but getheaders() returns the server's
    # casing: without normalising, a lower-case lookup misses half the
    # responses.
    st, hdrs = r.status, {k.lower(): v for k, v in r.getheaders()}
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

# --- metadata -------------------------------------------------------------
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

# --- structured data ------------------------------------------------------
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

# --- headers --------------------------------------------------------------
#
# This check used to report "absent" for headers that were in fact served: it
# did not send Accept-Encoding, and read cached responses. A check that produces
# false negatives is worth less than no check at all.
print("\n=== EN-TÊTES ===")
_, _, hd = get("/", gzip=True)

ATTENDUS = {
    "content-encoding": "compression",
    "cache-control": "politique de cache",
    "strict-transport-security": "HSTS",
    "x-content-type-options": "nosniff",
    "referrer-policy": "politique de référent",
    "permissions-policy": "politique de permissions",
}

manquants = 0
for cle, quoi in ATTENDUS.items():
    valeur = hd.get(cle)
    if valeur is None:
        manquants += 1
    print(f"  {quoi:<26} {valeur or '— absent'}")

print(f"\n  → {manquants} en-tête(s) manquant(s)")
