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

CMS_BASE = "https://anveda2.anveda-in.workers.dev"
SRC = CMS_BASE + "/catalog"
PHOTO_FALLBACK = "https://www.anveda.in/img/products/"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMGDIR = os.path.join(ROOT, "public", "img", "products")
REEL_IMGDIR = os.path.join(ROOT, "public", "img", "reels")
OUT = os.path.join(ROOT, "src", "data", "catalog.json")
REELS_OUT = os.path.join(ROOT, "src", "data", "reels.json")
REVIEWS_OUT = os.path.join(ROOT, "src", "data", "reviews.json")
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
reviews_in = data.get("reviews", [])

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
    raw_cover = r.get("cover")
    if raw_cover and raw_cover.startswith("ig:"):
        # Fetched straight from Instagram (ANVEDA2 POST /dash/api/reel/:id/fetch-cover)
        # rather than being an existing catalog photo — downloaded below, into
        # public/img/reels/ instead of public/img/products/.
        cover = f"/img/reels/{raw_cover[3:]}"
    elif raw_cover:
        cover = f"/img/products/{raw_cover}"
    else:
        cover = None
    reels_out.append({
        "id": r["id"],
        "video": existing_video.get(r["id"]) or (f"/video/reels/{os.path.basename(r['video'])}" if r.get("video") else None),
        "instagram": r.get("instagram"),
        "cover": cover,
        "title": r.get("title"),
        "caption": r.get("caption") or "",
        "productId": r.get("productId"),
        "colour": r.get("colour"),
    })

json.dump({"reels": reels_out}, open(REELS_OUT, "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
print(f"{len(reels_out)} reels "
      f"({sum(1 for r in reels_out if r['video'])} with uploaded video) -> {REELS_OUT}")

# --------------------------------------------------------------- reviews
json.dump({"reviews": reviews_in}, open(REVIEWS_OUT, "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
print(f"{len(reviews_in)} reviews -> {REVIEWS_OUT}")

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
    cov = r.get("cover")
    if cov and not cov.startswith("ig:"):
        wanted.add(cov)

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

# Reel covers fetched from Instagram — a one-time mirror (Instagram's own
# thumbnail link is signed and expires, so ANVEDA2 already downloaded it
# once into its own R2 bucket; this is just pulling that copy in here, same
# idea as the catalog photos above, just a different source and folder).
os.makedirs(REEL_IMGDIR, exist_ok=True)
new_ig = 0
for r in reels_in:
    cov = r.get("cover")
    if not cov or not cov.startswith("ig:"):
        continue
    fn = cov[3:]
    dest = os.path.join(REEL_IMGDIR, fn)
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        continue
    try:
        blob = fetch(f"{CMS_BASE}/reel-cover/{r['id']}")
        open(dest, "wb").write(blob)
        new_ig += 1
        print(f"  + {fn} ({len(blob)//1024}kb, from Instagram)")
    except Exception as e:
        print(f"  ! {fn}: {e}", file=sys.stderr)

print(f"{new_ig} new Instagram reel cover(s) fetched")
