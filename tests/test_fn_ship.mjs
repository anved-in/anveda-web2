import assert from 'node:assert/strict';
const mod = await import('file:///F:/ANTIGRAVITY/anveda%20web%202.0/anveda_web2.0-main/functions/api/%5B%5Bpath%5D%5D.js?t=' + Date.now());
let n = 0; const ok = (m) => console.log(`${++n} ok: ${m}`);
const calls = [];
let quoteReply;
const env = {
  RAZORPAY_KEY_ID: 'k', RAZORPAY_KEY_SECRET: 's', ORDERS_API_SECRET: 'o', ACCOUNT_API_SECRET: ' acct\n',
  CMS: { async fetch(url, init) {
    const body = init.body ? JSON.parse(init.body) : {}; calls.push([url, init.headers, body]);
    if (url.endsWith('/coupon/validate')) return new Response(JSON.stringify({ valid: false, discount: 0 }));
    if (url.endsWith('/shipping/quote')) return new Response(JSON.stringify(quoteReply));
    if (url.endsWith('/shipping/config')) return new Response(JSON.stringify({ ok: true, offer: { on: true, minDozens: 6, price: 180 } }));
    if (url.endsWith('/api/orders')) return new Response(JSON.stringify({ ok: true }));
    return new Response('{}', { status: 404 });
  } },
};
globalThis.fetch = async (u) => new Response(JSON.stringify({ id: 'order_1' }), { status: 200 });
const q = (amount, extra = {}) => ({ ok: true, quote: { known: true, amount, ...extra }, porter: { on: true, available: false, quote: null } });
const post = (path, body) => mod.onRequestPost({ request: new Request('https://x' + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }), env });
const base = (over = {}) => ({ ref: 'AVX', customer: { name: 'P', phone: '9876543210', pin: '560038', state: 'Karnataka', address: 'a', city: 'b' }, lines: [{ id: 'p1', colour: 'Maroon', size: '2.4', qty: 1 }], combos: [], subtotal: 320, shipping: 95, delivery: { method: 'standard' }, ...over });

quoteReply = q(95);
let r = await post('/api/checkout', base()); let j = await r.json();
assert.equal(r.status, 200); assert.equal(j.total, 415);
const intake = calls.filter((c) => c[0].endsWith('/api/orders')).pop();
assert.equal(intake[2].shipping, 95); assert.equal(intake[2].delivery.method, 'standard');
const sq = calls.filter((c) => c[0].endsWith('/shipping/quote')).pop();
assert.equal(sq[1]['x-api-secret'], 'acct');
ok('a correct delivery figure goes through; the secret is trimmed; intake is told the method');
r = await post('/api/checkout', base({ shipping: 150 })); j = await r.json();
assert.equal(r.status, 409); assert.equal(j.shipping, 95); assert.ok(/Delivery is now/.test(j.error));
ok('a wrong figure (the old flat 150) stops before Razorpay, with the right figure');
r = await post('/api/checkout', base({ shipping: 0 })); assert.equal(r.status, 409);
ok('editing delivery down to 0 in the browser does not work');
quoteReply = { ok: true, quote: { known: false, amount: 95 }, porter: { on: true, available: false, quote: null } };
r = await post('/api/checkout', base()); assert.equal(r.status, 400);
ok('no PIN/state: refused with a plain message');
quoteReply = { ok: true, quote: { known: true, amount: 95 }, porter: { on: true, available: true, quote: null } };
r = await post('/api/checkout', base({ delivery: { method: 'porter' }, shipping: 140 })); j = await r.json();
assert.equal(r.status, 409); assert.ok(/Porter/.test(j.error));
ok('Porter without a confirmed price is refused');
quoteReply = { ok: true, quote: { known: true, amount: 95 }, porter: { on: true, available: true, quote: { amount: 140, expiresAt: '2026-10-23 10:00:00' } } };
r = await post('/api/checkout', base({ delivery: { method: 'porter' }, shipping: 140 })); j = await r.json();
assert.equal(r.status, 200); assert.equal(j.total, 460);
ok('Porter with the confirmed price: total = items + 140');
quoteReply = q(95);
r = await post('/api/checkout', { ...base(), delivery: undefined, shipping: 150 }); j = await r.json();
assert.equal(r.status, 200); assert.equal(j.total, 470);
ok('an old page with no delivery field keeps the old behaviour');
r = await post('/api/shipping-quote', { pin: '560038', state: 'Karnataka', lines: [] }); j = await r.json();
assert.equal(r.status, 200); assert.equal(j.quote.amount, 95);
r = await post('/api/shipping-config', {}); j = await r.json(); assert.equal(j.offer.minDozens, 6);
ok('the quote and offer routes proxy to the shop');
console.log('ALL FUNCTION CHECKS PASSED');
