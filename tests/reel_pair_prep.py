import json, os
os.chdir(r"F:\ANTIGRAVITY\anveda web 2.0\anveda_web2.0-main")
cat = json.load(open("src/data/catalog.json", encoding="utf-8"))
# a design with at least three colours that are all in stock
def ok(p): return len([v for v in p["variants"] if v.get("inStock", True)]) >= 3
prod = next(p for p in cat["products"] if ok(p))
cols = [v["colour"] for v in prod["variants"] if v.get("inStock", True)][:3]
reels = json.load(open("src/data/reels.json", encoding="utf-8"))
first = reels["reels"][0]
reels["reels"].insert(0, {
    "id": "pair-test", "video": None, "instagram": "https://www.instagram.com/reel/PAIRTEST/", "cover": first["cover"],
    "title": "Pair test", "caption": "", "productId": prod["id"], "colour": None,
    "combo": {"price": 500, "items": [
        {"productId": prod["id"], "qty": 1, "colours": [cols[0], cols[1]]},
        {"productId": prod["id"], "qty": 1, "colours": [cols[1], cols[2]]},
    ]},
})
json.dump(reels, open("src/data/reels.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(json.dumps({"product": prod["id"], "name": prod["name"], "colours": cols}))
