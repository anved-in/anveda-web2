# Delete product photos that no longer belong to any colourway or reel.
#
# gen-catalog.py only ever ADDS files (it skips anything already on disk, so a
# re-run is cheap). Without this, a shade renamed or removed in the ANVEDA
# admin would leave its photo behind for ever, and the repo would grow without
# limit. Run it straight after the generator.
import io, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMGDIR = os.path.join(ROOT, "public", "img", "products")
REEL_IMGDIR = os.path.join(ROOT, "public", "img", "reels")
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

# Reel covers split across two directories now: an existing catalog photo
# (public/img/products/, tracked above like any other product photo) or a
# one-time mirror of an Instagram thumbnail (public/img/reels/, gen-catalog.py)
# — a reel's own cover path says which (/img/products/... vs /img/reels/...).
keep_reel = set()
if os.path.exists(REELS):
    for r in json.load(io.open(REELS, encoding="utf-8"))["reels"]:
        cover = r.get("cover") or ""
        fn = cover.rsplit("/", 1)[-1]
        if not fn:
            continue
        if cover.startswith("/img/reels/"):
            keep_reel.add(fn)
        else:
            keep.add(fn)

# Each kept file has a "@480" thumbnail sitting next to it (see
# optimize-images.js) that never appears in the catalog itself — keep those
# too, or every build would generate them just to have prune delete them.
keep_small = {os.path.splitext(f)[0] + "@480" + os.path.splitext(f)[1] for f in keep}
keep |= keep_small

removed = 0
if os.path.isdir(IMGDIR):
    for f in sorted(os.listdir(IMGDIR)):
        if f not in keep:
            os.remove(os.path.join(IMGDIR, f))
            print(f"  - {f}")
            removed += 1
else:
    print("no product image directory; nothing to prune there")

if os.path.isdir(REEL_IMGDIR):
    for f in sorted(os.listdir(REEL_IMGDIR)):
        if f not in keep_reel:
            os.remove(os.path.join(REEL_IMGDIR, f))
            print(f"  - reels/{f}")
            removed += 1

print(f"pruned {removed} orphaned photo(s); {len(keep) + len(keep_reel)} in use")
