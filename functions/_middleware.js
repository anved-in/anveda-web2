// Maintenance mode for the whole shop.
//
// The owner flips a switch in the CMS (Settings > Website maintenance mode).
// While it is ON, every visitor sees the 3D "we are updating the shop" page
// (public/teaser.html) with a 503 status, except:
//   - people holding the private preview link (?preview=KEY). The link sets a
//     2-hour cookie, so that one device then sees the real shop. Switching
//     maintenance ON in the CMS makes a new key, which cancels every old pass;
//     ?preview=off ends the pass on the device that opens it;
//   - the few pages that must keep working: Track order, the chat redirect, the
//     privacy/terms pages and the files those pages need.
// /api/* is closed too (checkout, coupons, bag capture), so nobody can pay
// while prices are being changed. The CMS is the source of truth (service
// binding `CMS`, GET /maintenance); the answer is cached for ~10 seconds, so a
// switch takes effect within about that long. If the CMS cannot be reached the
// last known state is kept, and with no state yet the shop stays OPEN rather
// than going dark by accident.

const ALLOW = [
  "/_next/", "/fonts/", "/img/", "/video/",
  "/icon", "/apple-touch-icon", "/favicon", "/manifest", "/robots.txt",
  "/teaser", "/track", "/chat", "/privacy", "/terms",
  "/api/track",
];
const COOKIE = "av_preview";
const COOKIE_SECONDS = 2 * 60 * 60;

let last = { at: 0, on: false };
const keyCache = new Map(); // key -> { at, ok }

async function askCms(env, key) {
  const res = await env.CMS.fetch("https://internal/maintenance" + (key ? "?key=" + encodeURIComponent(key) : ""));
  return res.json();
}

async function isOn(env) {
  const now = Date.now();
  if (now - last.at < 10000) return last.on;
  try {
    const j = await askCms(env);
    last = { at: now, on: !!j.on };
  } catch {
    last = { at: now - 5000, on: last.on }; // keep the last known state, retry in ~5s
  }
  return last.on;
}

async function keyOk(env, key) {
  if (!key || key.length > 100) return false;
  const now = Date.now();
  const hit = keyCache.get(key);
  if (hit && now - hit.at < 30000) return hit.ok;
  let ok = false;
  try { ok = !!(await askCms(env, key)).valid; } catch { ok = false; }
  if (keyCache.size > 50) keyCache.clear();
  keyCache.set(key, { at: now, ok });
  return ok;
}

function cookieValue(request, name) {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return "";
}

async function maintenanceResponse(env, url, isApi) {
  const common = { "retry-after": "3600", "cache-control": "no-store" };
  if (isApi) {
    return new Response(JSON.stringify({ ok: false, error: "The shop is being updated. Please try again shortly." }), {
      status: 503,
      headers: { ...common, "content-type": "application/json" },
    });
  }
  let r = await env.ASSETS.fetch(new Request(new URL("/teaser", url)));
  if (r.status >= 300 && r.status < 400 && r.headers.get("location")) {
    r = await env.ASSETS.fetch(new Request(new URL(r.headers.get("location"), url)));
  }
  const headers = new Headers(r.headers);
  for (const [k, v] of Object.entries(common)) headers.set(k, v);
  headers.set("content-type", "text/html; charset=utf-8");
  headers.delete("content-length");
  headers.delete("etag");
  return new Response(r.body, { status: 503, headers });
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  if (!env.CMS) return next(); // not wired up (e.g. local preview): never block
  if (ALLOW.some((p) => path.startsWith(p))) return next();
  const preview = url.searchParams.get("preview");

  // ?preview=off: end the owner's pass on this device (works any time), so the
  // owner can see exactly what customers see.
  if (preview === "off") {
    url.searchParams.delete("preview");
    return new Response(null, {
      status: 302,
      headers: {
        location: url.pathname + (url.search || ""),
        "set-cookie": `${COOKIE}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax`,
        "cache-control": "no-store",
      },
    });
  }

  if (!(await isOn(env))) return next();

  // Maintenance is ON. The owner's private link: validate, remember, and clean the URL.
  if (preview && (await keyOk(env, preview))) {
    url.searchParams.delete("preview");
    return new Response(null, {
      status: 302,
      headers: {
        location: url.pathname + (url.search || ""),
        "set-cookie": `${COOKIE}=${encodeURIComponent(preview)}; Path=/; Max-Age=${COOKIE_SECONDS}; Secure; HttpOnly; SameSite=Lax`,
        "cache-control": "no-store",
      },
    });
  }
  if (await keyOk(env, cookieValue(request, COOKIE))) return next();

  return maintenanceResponse(env, url, path.startsWith("/api/"));
}
