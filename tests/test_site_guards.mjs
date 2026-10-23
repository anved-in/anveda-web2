// The website's security headers and its brake on checkout spam (functions/_middleware.js and functions/api/[[path]].js).
import assert from 'node:assert/strict';
const base = 'file:///F:/ANTIGRAVITY/anveda%20web%202.0/anveda_web2.0-main/functions/';
const mw = await import(base + '_middleware.js?t=' + Date.now());
const api = await import(base + 'api/%5B%5Bpath%5D%5D.js?t=' + Date.now());
let n = 0; const ok = (m) => console.log(`${++n} ok: ${m}`);

const run = (url, next, env = {}) => mw.onRequest({ request: new Request(url), env, next });
const need = { 'x-frame-options': 'DENY', 'strict-transport-security': 'max-age=31536000', 'permissions-policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()', 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin', 'x-permitted-cross-domain-policies': 'none' };
const has = (res) => Object.entries(need).every(([k, v]) => res.headers.get(k) === v);

let res = await run('https://www.anveda.in/', async () => new Response('<html>hi</html>', { headers: { 'content-type': 'text/html' } }));
assert.ok(has(res)); assert.equal(await res.text(), '<html>hi</html>'); assert.equal(res.headers.get('content-type'), 'text/html');
ok('a normal page gets every security header, and its body and type are untouched');
res = await run('https://www.anveda.in/_next/static/x.js', async () => new Response('x', { headers: { 'cache-control': 'public, max-age=31536000, immutable' } }));
assert.ok(has(res)); assert.equal(res.headers.get('cache-control'), 'public, max-age=31536000, immutable');
ok('static files get them too, and keep their caching rules');
res = await run('https://www.anveda.in/missing', async () => new Response('nf', { status: 404 }));
assert.ok(has(res)); assert.equal(res.status, 404);
ok('error pages keep their status and get the headers');
res = await run('https://www.anveda.in/old', async () => new Response(null, { status: 302, headers: { location: '/new' } }));
assert.ok(has(res)); assert.equal(res.status, 302); assert.equal(res.headers.get('location'), '/new');
ok('redirects keep their destination and get the headers');
res = await run('https://www.anveda.in/', async () => new Response('x', { headers: { 'x-frame-options': 'SAMEORIGIN' } }));
assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
ok('a header a page sets itself is never overwritten');
globalThis.HTMLRewriter = class { on() { return this; } transform(r) { return r; } };   // Cloudflare's page rewriter exists only on Cloudflare
res = await run('https://staging.anveda-web-pages.pages.dev/', async () => new Response('<html><body>hi</body></html>', { headers: { 'content-type': 'text/html' } }), {});
assert.ok(has(res));
ok('the test copy (with its "TEST COPY" strip) has them as well');

// ---------------------------------------------------------------- the visitor's address reaches the shop server
const seen = [];
const env = { CMS: { fetch: async (url, init) => { seen.push([url, init.headers]); return new Response(JSON.stringify({ ok: true, valid: false, discount: 0 })); } } };
await api.onRequestPost({ request: new Request('https://www.anveda.in/api/coupon', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.9' }, body: JSON.stringify({ code: 'X', subtotal: 100 }) }), env });
await api.onRequestPost({ request: new Request('https://www.anveda.in/api/track', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.9' }, body: JSON.stringify({ ref: 'A', phone: '9876543210' }) }), env });
await api.onRequestPost({ request: new Request('https://www.anveda.in/api/subscribe', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.9' }, body: JSON.stringify({ email: 'a@b.co' }) }), env });
assert.equal(seen.length, 3); assert.ok(seen.every(([, h]) => h['x-client-ip'] === '203.0.113.9'));
ok('coupon, tracking and sign-up calls carry the real visitor address to the shop server (so its rate limits count customers, not our function)');
console.log('ALL SITE GUARD CHECKS PASSED');
