# One-line summary of the current catalog, used as the body of the automatic
# sync commit so the history says what the shop actually holds at that point.
import io, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOG = os.path.join(ROOT, "src", "data", "catalog.json")
REELS = os.path.join(ROOT, "src", "data", "reels.json")

c = json.load(io.open(CATALOG, encoding="utf-8"))
products = c["products"]
colourways = sum(len(p["variants"]) for p in products)
instock = sum(1 for p in products for v in p["variants"] if v.get("inStock"))

prices = [v["price"] for p in products for v in p["variants"] if v.get("price")]
lo, hi = (min(prices), max(prices)) if prices else (0, 0)

lines = [
    f"{len(products)} designs, {colourways} colourways "
    f"({instock} in stock), Rs.{lo}-{hi}."
]

if os.path.exists(REELS):
    reels = json.load(io.open(REELS, encoding="utf-8"))["reels"]
    uploaded = sum(1 for r in reels if r.get("video"))
    linked = sum(1 for r in reels if not r.get("video") and r.get("instagram"))
    if reels:
        lines.append(
            f"{len(reels)} reels ({uploaded} uploaded, {linked} linked to Instagram)."
        )

print("\n".join(lines))
