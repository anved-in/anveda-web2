#!/usr/bin/env python3
"""Checks the freshly generated shop data BEFORE it is committed and published.

Why: the live shop is rebuilt from src/data/*.json. If the CMS ever answers with something broken (an empty catalog, half the products,
a corrupt file), publishing it would put that on the live shop within minutes. This script fails the sync instead, so the shop keeps
showing the last good data and the owner gets a clear message. ("Fail closed.")

Run from the repo root:  python scripts/validate-data.py
A deliberate big deletion (for example removing many designs on purpose) is allowed by running the sync manually with
"Allow the catalog to shrink" ticked, which sets ALLOW_SHRINK=true.
"""
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ALLOW_SHRINK = os.environ.get("ALLOW_SHRINK", "").lower() == "true"
problems = []


def bad(msg):
    problems.append(msg)


def load(rel):
    path = os.path.join(ROOT, rel)
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:  # missing, empty or not valid JSON
        bad(f"{rel}: cannot be read ({type(e).__name__}: {e})")
        return None


def previous(rel):
    """The same file as last committed, or None when there is no history to compare with."""
    try:
        out = subprocess.run(["git", "-C", ROOT, "show", f"HEAD:{rel}"], capture_output=True, check=True)
        return json.loads(out.stdout.decode("utf-8"))
    except Exception:
        return None


def count_variants(cat):
    return sum(len(p.get("variants") or []) for p in (cat or {}).get("products", []))


def shrink_check(what, new, old, floor):
    """Fail when `new` fell below `floor` x `old` (only meaningful once there was a reasonable amount before)."""
    if ALLOW_SHRINK or old is None or old < 4:
        return
    if new < old * floor:
        bad(f"{what} dropped from {old} to {new} (more than {int((1 - floor) * 100)}% gone). "
            "That looks like a CMS fault, so nothing was published. If it is intentional, run the sync by hand with 'Allow the catalog to shrink' ticked.")


# ---------------------------------------------------------------- catalog
cat = load("src/data/catalog.json")
if cat is not None:
    products = cat.get("products")
    if not isinstance(products, list) or not products:
        bad("catalog.json has no products")
        products = []
    ids = [p.get("id") for p in products]
    if len(ids) != len(set(ids)):
        bad("catalog.json has two products with the same id")
    for p in products:
        pid = p.get("id", "?")
        if not isinstance(p.get("id"), str) or not p.get("id"):
            bad("a product has no id")
        if not isinstance(p.get("name"), str) or not p.get("name"):
            bad(f"product {pid} has no name")
        if not isinstance(p.get("variants"), list) or not p["variants"]:
            bad(f"product {pid} has no colours")
            continue
        for v in p["variants"]:
            if not isinstance(v.get("colour"), str) or not v.get("colour"):
                bad(f"product {pid} has a colour with no name")
            if not isinstance(v.get("price"), (int, float)) or v.get("price") is True or v["price"] < 0:
                bad(f"product {pid} / {v.get('colour')} has no valid price")
    for key in ("groups", "collections"):
        if not isinstance(cat.get(key), list) or not cat.get(key):
            bad(f"catalog.json has no {key}")
    old = previous("src/data/catalog.json")
    shrink_check("The number of designs", len(products), len((old or {}).get("products", [])) if old else None, 0.6)
    shrink_check("The number of colourways", count_variants(cat), count_variants(old) if old else None, 0.6)

# ---------------------------------------------------------------- reels, reviews, help questions
reels = load("src/data/reels.json")
if reels is not None:
    lst = reels.get("reels")
    if not isinstance(lst, list):
        bad("reels.json has no reels list")
    else:
        for r in lst:
            if not r.get("id") or not r.get("title"):
                bad("a reel has no id or title")
        old = previous("src/data/reels.json")
        shrink_check("The number of reels", len(lst), len((old or {}).get("reels", [])) if old else None, 0.5)

for rel, key in (("src/data/reviews.json", "reviews"), ("src/data/faqs.json", "faqs")):
    d = load(rel)
    if d is not None and not isinstance(d.get(key), list):
        bad(f"{rel} has no '{key}' list")

# ---------------------------------------------------------------- verdict
if problems:
    print("DATA CHECK FAILED, nothing will be published:")
    for m in problems:
        print("  - " + m)
    print("::error::The data from the CMS did not pass its safety check, so the live shop was left as it is. See the log for the reason.")
    sys.exit(1)
n = len((cat or {}).get("products", []))
print(f"Data check passed: {n} designs, {count_variants(cat)} colourways, {len((reels or {}).get('reels', []))} reels.")
