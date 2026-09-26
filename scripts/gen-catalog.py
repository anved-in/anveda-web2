# Regenerates src/data/catalog.json and src/data/reels.json from CMS 2.0
# (ANVEDA2 — the Worker the owner actually edits products in) and downloads
# any new colourway photo into public/img/products/.
#
# CMS 2.0's /catalog endpoint returns groups/collections/products/reels in
# EXACTLY the shape this file already needs (see ANVEDA2/src/catalog.ts) — no
# HTML scraping required, unlike v1. Product-photo BLOBS were never migrated
# into CMS 2.0 (it has no image-upload route yet), so a colourway's image not
# already on disk here falls back to the LIVE storefront's own copy of that
# same filename — the one place guaranteed to have every photo that has ever
# shipped, by the exact name the catalog references it by.
import json, os, sys, urllib.request

SRC = "https://anveda2.anveda-in.workers.dev/catalog"
PHOTO_FALLBACK = "https://www.anveda.in/img/products/"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMGDIR = os.path.join(ROOT, "public", "img", "products")
OUT = os.path.join(ROOT, "src", "data", "catalog.json")
REELS_OUT = os.path.join(ROOT, "src", "data", "reels.json")
REELDIR = os.path.join(ROOT, "public", "video", "reels")


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req, timeout=60).read()


print("fetching catalog from CMS 2.0…")
data = json.loads(fetch(SRC).decode("utf-8"))

groups = data.get("groups", [])
collections = data.get("collections", [])
products = data.get("products", [])
reels_in = data.get("reels", [])

json.dump(
    {"groups": groups, "collections": collections, "products": products},
    open(OUT, "w", encoding="utf-8"),
    ensure_ascii=False,
    indent=1,
)
nv = sum(len(p["variants"]) for p in products)
print(f"{len(products)} products, {nv} colourways -> {OUT}")

# ---------------------------------------------------------------- reels
# An uploaded file in public/video/reels/<id>.mp4 ALWAYS wins over the
# Instagram link (self-hosted video plays inline; an IG embed cannot be
# restyled). The generator never touches that directory itself.
os.makedirs(REELDIR, exist_ok=True)
existing_video = {
    os.path.splitext(f)[0]: f"/video/reels/{f}"
    for f in os.listdir(REELDIR)
    if f.lower().endswith((".mp4", ".webm", ".mov"))
}

reels_out = []
for r in reels_in:
    reels_out.append({
        "id": r["id"],
        "video": existing_video.get(r["id"]) or (f"/video/reels/{os.path.basename(r['video'])}" if r.get("video") else None),
        "instagram": r.get("instagram"),
        "cover": f"/img/products/{r['cover']}" if r.get("cover") else None,
        "title": r.get("title"),
        "caption": r.get("caption") or "",
        "productId": r.get("productId"),
        "colour": r.get("colour"),
    })

json.dump({"reels": reels_out}, open(REELS_OUT, "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
print(f"{len(reels_out)} reels "
      f"({sum(1 for r in reels_out if r['video'])} with uploaded video) -> {REELS_OUT}")

# ------------------------------------------------------------- photos
# Collect every filename the catalog/reels reference, then fetch whichever
# ones aren't already on disk. Existing photos are never re-downloaded.
wanted = set()
for p in products:
    for v in p["variants"]:
        if v.get("image"):
            wanted.add(v["image"])
for c in collections:
    if c.get("cover"):
        wanted.add(c["cover"])
for r in reels_in:
    if r.get("cover"):
        wanted.add(r["cover"])

os.makedirs(IMGDIR, exist_ok=True)
new = 0
for fn in sorted(wanted):
    dest = os.path.join(IMGDIR, fn)
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        continue
    try:
        blob = fetch(PHOTO_FALLBACK + fn)
        open(dest, "wb").write(blob)
        new += 1
        print(f"  + {fn} ({len(blob)//1024}kb)")
    except Exception as e:
        print(f"  ! {fn}: {e}", file=sys.stderr)

print(f"{new} new photo(s) fetched")
