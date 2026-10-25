"""The CMS > Website pages data path, end to end, against a pretend CMS (nothing real is touched):

    python tests/test_site_content_sync.py

It copies the three sync scripts into a throw-away folder, points them at a tiny local web server that answers like the
CMS, and checks what lands in src/data/site.json and public/img/products, that the prune step keeps the chosen photos,
and that the safety check refuses a page whose chosen photo could not be downloaded.
"""
import io, json, os, shutil, subprocess, sys, tempfile, threading
from http.server import BaseHTTPRequestHandler, HTTPServer

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
from PIL import Image

n = 0
def ok(msg):
    global n
    n += 1
    print(f"{n} ok: {msg}")

state = {"site": {}, "missing": set(), "send_site": True}

def png():
    b = io.BytesIO(); Image.new("RGB", (40, 30), (200, 60, 60)).save(b, "PNG"); return b.getvalue()
def webp():
    b = io.BytesIO(); Image.new("RGB", (40, 30), (60, 60, 200)).save(b, "WEBP"); return b.getvalue()

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        if self.path == "/catalog":
            body = {
                "groups": [{"slug": "glass", "name": "Glass Bangles"}],
                "collections": [{"slug": "c1", "group": "glass", "name": "One", "cover": "cover.webp"}],
                "products": [{"id": "p1", "collection": "c1", "collectionName": "One", "group": "glass", "name": "P One", "price": 300,
                              "variants": [{"id": 1, "colour": "Red", "price": 300, "image": "a.webp"}], "image": "a.webp"}],
                "reels": [], "reviews": [], "faqs": [], "colourWall": [], "newArrivals": [], "announcement": None,
            }
            if state["send_site"]:
                body["siteContent"] = state["site"]
            data = json.dumps(body).encode()
            self.send_response(200); self.send_header("content-type", "application/json"); self.end_headers(); self.wfile.write(data); return
        if self.path.startswith("/photo/"):
            name = self.path[len("/photo/"):]
            if name in state["missing"]:
                self.send_response(404); self.end_headers(); return
            data = webp() if name.endswith(".webp") else png()
            self.send_response(200); self.send_header("content-type", "image/webp" if name.endswith(".webp") else "image/png"); self.end_headers(); self.wfile.write(data); return
        self.send_response(404); self.end_headers()

srv = HTTPServer(("127.0.0.1", 0), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()
base = f"http://127.0.0.1:{srv.server_port}"

root = tempfile.mkdtemp(prefix="site-sync-")
try:
    os.makedirs(os.path.join(root, "scripts")); os.makedirs(os.path.join(root, "src", "data")); os.makedirs(os.path.join(root, "public", "img", "products"))
    for f in ("gen-catalog.py", "prune-photos.py", "validate-data.py"):
        shutil.copy(os.path.join(HERE, "scripts", f), os.path.join(root, "scripts", f))
    env = dict(os.environ, CMS_BASE=base, PHOTO_FALLBACK=base + "/nowhere/", PYTHONIOENCODING="utf-8")
    def run(script):
        return subprocess.run([sys.executable, os.path.join(root, "scripts", script)], cwd=root, env=env, capture_output=True, text=True, encoding="utf-8")
    site_path = os.path.join(root, "src", "data", "site.json")
    imgdir = os.path.join(root, "public", "img", "products")
    read_site = lambda: json.load(open(site_path, encoding="utf-8"))

    # 1) the owner changed a few boxes and chose a photo uploaded as a .jpg
    state["site"] = {"home.story.title": "Our Journey", "home.hero1.image": "u-site-home-hero1-image-abc.jpg", "about.how4.text": "{channel} answers every message.", "home.arrivals.title": "   "}
    r = run("gen-catalog.py"); assert r.returncode == 0, r.stdout + r.stderr
    assert read_site() == {"values": {"home.story.title": "Our Journey", "home.hero1.image": "u-site-home-hero1-image-abc.webp", "about.how4.text": "{channel} answers every message."}}, read_site()
    ok("the changed boxes land in site.json (blank boxes dropped), and the photo is named .webp like every site photo")
    assert os.path.exists(os.path.join(imgdir, "u-site-home-hero1-image-abc.webp")) and os.path.getsize(os.path.join(imgdir, "u-site-home-hero1-image-abc.webp")) > 0
    assert open(os.path.join(imgdir, "u-site-home-hero1-image-abc.webp"), "rb").read()[8:12] == b"WEBP"
    ok("the chosen photo was downloaded from the CMS (it asked for the uploaded .jpg name) and converted to a real WebP")

    # 2) tidy-up keeps the chosen photo, removes strays
    open(os.path.join(imgdir, "stray.webp"), "wb").write(webp())
    r = run("prune-photos.py"); assert r.returncode == 0, r.stdout + r.stderr
    assert os.path.exists(os.path.join(imgdir, "u-site-home-hero1-image-abc.webp")) and not os.path.exists(os.path.join(imgdir, "stray.webp"))
    ok("the prune step keeps the photo chosen in the CMS and still removes photos nobody uses")

    # 3) the safety check passes with the photo present
    r = run("validate-data.py"); assert r.returncode == 0, r.stdout + r.stderr
    ok("the safety check passes")

    # 4) a chosen photo that cannot be fetched stops publishing
    state["site"] = {"home.story.image": "u-site-missing-xyz.jpg"}; state["missing"] = {"u-site-missing-xyz.jpg"}
    r = run("gen-catalog.py"); assert r.returncode == 0
    r = run("validate-data.py"); assert r.returncode == 1 and "home.story.image" in r.stdout, r.stdout
    ok("a chosen photo that could not be downloaded makes the safety check refuse to publish (the live site keeps its last good pages)")

    # 5) an older CMS that sends no siteContent must not blank the pages
    state["site"] = {"home.story.title": "Kept"}; state["missing"] = set()
    run("gen-catalog.py")
    before = read_site()
    state["send_site"] = False
    r = run("gen-catalog.py"); assert r.returncode == 0
    assert read_site() == before and before["values"]["home.story.title"] == "Kept"
    ok("a CMS answer without the block leaves the site.json alone")

    # 6) the owner reset everything: an empty block empties the file
    state["send_site"] = True; state["site"] = {}
    run("gen-catalog.py")
    assert read_site() == {"values": {}}
    r = run("validate-data.py"); assert r.returncode == 0, r.stdout
    ok("an empty block (everything reset to the original wording) empties site.json, and that passes the check")
    print("ALL SITE-CONTENT SYNC CHECKS PASSED")
finally:
    srv.shutdown()
    shutil.rmtree(root, ignore_errors=True)
