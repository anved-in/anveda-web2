import json, os
os.chdir(r"F:\ANTIGRAVITY\anveda web 2.0\anveda_web2.0-main")
# TEMPORARY test data (restore with: git checkout -- src/data/reels.json src/data/catalog.json)
cat = json.load(open("src/data/catalog.json", encoding="utf-8"))
jelly = next(p for p in cat["products"] if p["id"] == "jelly-bangles-glass-bangles")
kada = next(p for p in cat["products"] if p["id"] == "kada")
for v in jelly["variants"]:               # no colour of this design comes in 2.6 any more
    v["sizes"] = [s for s in v["sizes"] if s != "2.6"]
    if v.get("sizeStock"):
        v["sizeStock"].pop("2.6", None)
for v in kada["variants"]:                # the whole design is sold out
    v["inStock"] = False
json.dump(cat, open("src/data/catalog.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
reels = json.load(open("src/data/reels.json", encoding="utf-8"))
first = reels["reels"][0]
base = {"video": None, "cover": first["cover"], "caption": ""}
reels["reels"].insert(0, dict(base, id="ask-a", instagram="https://www.instagram.com/reel/ASKA/", title="Ask A", productId=jelly["id"], colour=None, combo=None))
reels["reels"].insert(0, dict(base, id="ask-b", instagram="https://www.instagram.com/reel/ASKB/", title="Ask B", productId=jelly["id"], colour=None,
    combo={"price": 500, "items": [{"productId": jelly["id"], "qty": 1, "colours": []}, {"productId": kada["id"], "qty": 1, "colours": []}]}))
json.dump(reels, open("src/data/reels.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("prepared")
