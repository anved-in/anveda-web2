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
  "/teaser", "/track", "/account", "/chat", "/privacy", "/terms", "/review", "/colour-order",
  "/api/track", "/api/account", "/api/review", "/go/",
];
// ---------------------------------------------------------------- test copies
// Cloudflare Pages publishes every branch other than the live one on its own
// address (<branch>.anveda-web-pages.pages.dev, or <commit>.anveda-web-pages.pages.dev).
// Those "test copies" are for the owner and testers to try changes before they go live:
//   - the maintenance page is never shown there (testers see the real shop);
//   - search engines are told to ignore them (X-Robots-Tag);
//   - nothing can be written: no checkout, no order, no sign-up, no review, no
//     stock alert. Reads (coupon check, order tracking, review lookup) still work;
//   - every page carries a small "TEST COPY" tag so nobody mistakes it for the shop.
// The live addresses are listed below; anything else under pages.dev is a test copy.
const LIVE_HOSTS = new Set(["anveda.in", "www.anveda.in", "anveda-web-pages.pages.dev"]);
const isTestCopy = (host) => host.endsWith(".anveda-web-pages.pages.dev") && !LIVE_HOSTS.has(host);
const TEST_READ_OK = ["/api/coupon", "/api/track", "/api/review-lookup", "/api/account", "/api/shipping", "/api/stock"];
// A thin strip across the FULL width, in the normal flow at the very top of the page (above the header, taking no space
// from the header's own padding). It is black on purpose, so it can never be mistaken for the shop's red offers strip.
const TEST_TAG =
  '<div aria-hidden="true" style="width:100%;background:#111;color:#fff;font:700 10px/1 system-ui,sans-serif;' +
  'letter-spacing:.14em;text-align:center;padding:7px 10px;box-sizing:border-box">TEST COPY &middot; ORDERS OFF</div>';

async function testCopy(next, request, url) {
  const path = url.pathname;
  const write = request.method !== "GET" && request.method !== "HEAD";
  if (write && path.startsWith("/api/") && !TEST_READ_OK.some((p) => path.startsWith(p))) {
    return new Response(
      JSON.stringify({ ok: false, error: "This is a test copy of the shop. Orders and sign-ups are switched off here." }),
      { status: 403, headers: { "content-type": "application/json", "x-robots-tag": "noindex, nofollow, noarchive" } },
    );
  }
  const res = await next();
  const headers = new Headers(res.headers);
  headers.set("x-robots-tag", "noindex, nofollow, noarchive");
  const out = new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  if ((headers.get("content-type") || "").includes("text/html")) {
    return new HTMLRewriter().on("body", { element(el) { el.prepend(TEST_TAG, { html: true }); } }).transform(out);
  }
  return out;
}

const APEX_KEEP = ["/api/", "/img/", "/_next/", "/fonts/", "/video/", "/go/"];

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

// Standard browser protections added to EVERY response (pages, files, API, maintenance page, test copies).
//   X-Frame-Options              nobody can put the shop inside another site's frame (clickjacking)
//   Strict-Transport-Security    browsers insist on https for a year
//   Permissions-Policy           the shop never needs the camera, microphone or location
//   X-Permitted-Cross-Domain-Policies  old Flash/PDF cross-domain rules are refused
// (nosniff and the referrer policy are already set by Cloudflare.) A Content-Security-Policy is planned separately: it must be tried in
// report-only mode first, because Razorpay's payment window and Google sign-in load code from their own addresses (see SECURITY.md).
const SECURITY_HEADERS = {
  "x-frame-options": "DENY",
  "strict-transport-security": "max-age=31536000",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "x-permitted-cross-domain-policies": "none",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
};
function withSecurityHeaders(res) {
  const h = new Headers(res.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) if (!h.has(k)) h.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

export async function onRequest(context) {
  return withSecurityHeaders(await handle(context));
}

async function handle(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // One address for the shop. anveda.in used to answer with a full copy of every page next to www.anveda.in, which splits what
  // Google learns about the site in two. Pages move permanently to www; files and /api/ are left alone (an Instagram card
  // photo or a payment call must never be redirected).
  if (url.hostname === "anveda.in" && (request.method === "GET" || request.method === "HEAD") && !APEX_KEEP.some((p) => path.startsWith(p))) {
    url.hostname = "www.anveda.in";
    return new Response(null, { status: 301, headers: { location: url.toString(), "cache-control": "public, max-age=3600" } });
  }

  if (isTestCopy(url.hostname)) return testCopy(next, request, url);
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
