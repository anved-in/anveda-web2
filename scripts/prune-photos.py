# Delete product photos that no longer belong to any colourway or reel.
#
# gen-catalog.py only ever ADDS files (it skips anything already on disk, so a
# re-run is cheap). Without this, a shade renamed or removed in the ANVEDA
# admin would leave its photo behind for ever, and the repo would grow without
# limit. Run it straight after the generator.
import io, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMGDIR = os.path.join(ROOT, "public", "img", "products")
CATALOG = os.path.join(ROOT, "src", "data", "catalog.json")
REELS = os.path.join(ROOT, "src", "data", "reels.json")

catalog = json.load(io.open(CATALOG, encoding="utf-8"))

keep = set()
for p in catalog["products"]:
    for v in p["variants"]:
        if v.get("image"):
            keep.add(v["image"])
    if p.get("image"):
        keep.add(p["image"])
for c in catalog["collections"]:
    if c.get("cover"):
        keep.add(c["cover"])

if os.path.exists(REELS):
    for r in json.load(io.open(REELS, encoding="utf-8"))["reels"]:
        cover = (r.get("cover") or "").rsplit("/", 1)[-1]
        if cover:
            keep.add(cover)

if not os.path.isdir(IMGDIR):
    print("no image directory; nothing to prune")
    raise SystemExit(0)

removed = 0
for f in sorted(os.listdir(IMGDIR)):
    if f not in keep:
        os.remove(os.path.join(IMGDIR, f))
        print(f"  - {f}")
        removed += 1

print(f"pruned {removed} orphaned photo(s); {len(keep)} in use")
