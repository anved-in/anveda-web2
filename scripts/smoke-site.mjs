// Release check for the WEBSITE. RUN THIS BEFORE EVERY WEBSITE PUBLISH:
//     npm run build ; node scripts/smoke-site.mjs
//
// It serves the freshly built site (./out) and, in headless Edge, does what a shopper does with a real finger:
//   PHONE (390 px, real touch taps)
//     - the menu button opens the menu; the bag button in the bottom bar opens the bag; a bottom-bar link changes page
//   PHONE AND PC
//     - the main controls are really reachable: nothing is sitting on top of them (elementFromPoint hits the control)
// Why it exists: a scripted .click() ignores overlays and pointer-events, so it can pass while a real finger cannot
// use the control (this happened in the CMS when a new CSS class reused the header's own name). Real touches and
// hit-tests catch that class of mistake.
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), 'out');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  let f = path.join(OUT, p);
  if (!f.startsWith(OUT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(4599, '127.0.0.1', r));

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
let failures = 0;
const check = (ok, what) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + what); if (!ok) failures++; };

// NOTE: simulated touches only work on a browser's FIRST page load, so each scenario loads its page exactly once.
// `seedCart` puts items in the bag BEFORE the page starts (no second navigation).
async function session(width, height, mobile, url, fn, seedCart) {
  const port = 9900 + Math.floor(Math.random() * 40);
  const prof = path.join(process.env.TEMP || '.', 'smoke-site-' + Date.now() + width);
  const proc = spawn(EDGE, [`--remote-debugging-port=${port}`, '--headless=new', '--disable-gpu', '--user-data-dir=' + prof, 'about:blank'], { stdio: 'ignore' });
  let t; for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (t.find((x) => x.type === 'page')) break; } catch {} await sleep(250); }
  const ws = new WebSocket(t.find((x) => x.type === 'page').webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result.result.value;
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  if (seedCart) await send('Page.addScriptToEvaluateOnNewDocument', { source: "try{localStorage.setItem('anveda.cart.v1', " + JSON.stringify(JSON.stringify(seedCart)) + ")}catch(e){}" });
  await send('Page.navigate', { url }); await sleep(3500);
  const tap =async (x, y) => { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await sleep(60); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(700); };
  try { await fn({ ev, tap }); } finally { ws.close(); proc.kill(); await sleep(1500); try { fs.rmSync(prof, { recursive: true, force: true }); } catch {} }
}
const centre = (sel) => `JSON.stringify((function(){var e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;var r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})())`;
const reachable = (sel) => `(function(){var es=[].slice.call(document.querySelectorAll(${JSON.stringify(sel)})).filter(function(e){var r=e.getBoundingClientRect();return r.width>0&&r.height>0});var e=es[0];if(!e)return 'missing';var r=e.getBoundingClientRect();var h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return (h===e||e.contains(h))?'ok':'covered by '+(h?h.tagName+'.'+String(h.className).slice(0,40):'nothing')})()`;
const BASE = 'http://127.0.0.1:4599';

// phone: real touches
await session(390, 800, true, BASE + '/shop/glass/', async ({ ev, tap }) => {
  const menuShown = () => ev("(function(){var m=document.getElementById('mobile-menu');return !!m&&m.getAttribute('aria-hidden')!=='true'})()");
  check(!(await menuShown()), 'phone: menu starts closed');
  check((await ev(reachable('button[aria-label="Open menu"]'))) === 'ok', 'phone: menu button reachable (' + (await ev(reachable('button[aria-label="Open menu"]'))) + ')');
  const m = JSON.parse(await ev(centre('button[aria-label="Open menu"]')) || 'null');
  if (m) await tap(m.x, m.y);
  check(await menuShown(), 'phone: tapping the menu button OPENS the menu');
  const c = JSON.parse(await ev(centre('button[aria-label="Close menu"]')) || 'null');
  if (c) await tap(c.x, c.y);
  check(!(await menuShown()), 'phone: tapping Close shuts the menu');
  // the bag is at the top right of the header; the bottom bar has Shop / Reels / Help / Saved only (no Home, no Bag)
  const bagSel = 'header button[aria-label^="Open bag"]';
  check((await ev(reachable(bagSel))) === 'ok', 'phone: bag button (top right) reachable (' + (await ev(reachable(bagSel))) + ')');
  check(await ev("document.querySelectorAll('nav[aria-label=\"Quick navigation\"] a, nav[aria-label=\"Quick navigation\"] button').length === 4"), 'phone: bottom bar has exactly 4 items');
  check(await ev("!document.querySelector('nav[aria-label=\"Quick navigation\"] button[aria-label^=\"Open bag\"]') && !/\\bhome\\b/i.test(document.querySelector('nav[aria-label=\"Quick navigation\"]').innerText)"), 'phone: bottom bar has no Home and no Bag');
  const b = JSON.parse(await ev(centre(bagSel)) || 'null');
  if (b) await tap(b.x, b.y);
  check(await ev("/your bag/i.test(document.body.innerText)"), 'phone: tapping the bag button opens the bag');
});
await session(390, 800, true, BASE + '/shop/glass/', async ({ ev, tap }) => {
  const link = 'nav[aria-label="Quick navigation"] a[href*="reels"]';
  check((await ev(reachable(link))) === 'ok', 'phone: bottom-bar link reachable (' + (await ev(reachable(link))) + ')');
  const l = JSON.parse(await ev(centre(link)) || 'null');
  if (l) await tap(l.x, l.y);
  await sleep(800);
  check(await ev("location.pathname.indexOf('reels') > -1"), 'phone: tapping a bottom-bar link changes page (' + (await ev('location.pathname')) + ')');
});

// phone + PC: the main controls are not covered
for (const [w, h, mob] of [[390, 800, true], [1280, 800, false]]) {
  await session(w, h, mob, BASE + '/shop/glass/', async ({ ev }) => {
    const list = ['article a[href*="/product/"]', 'article img'];
    if (w < 768) list.push('nav[aria-label="Quick navigation"] a');
    else list.push('header a[href*="shop"], header a[href="/"]');
    for (const sel of list) { const r = await ev(reachable(sel)); check(r === 'ok', `${w}px: ${sel.slice(0, 48)} reachable (${r})`); }
  });
}
// phone checkout: a bag with items, the folded summary opens with a real tap, the one big button is reachable, no bottom bar
await session(390, 800, true, BASE + '/checkout/', async ({ ev, tap }) => {
  check(await ev("location.pathname.indexOf('checkout') > -1"), 'checkout: page opened');
  check(await ev("!document.querySelector('nav[aria-label=\"Quick navigation\"]')"), 'checkout: no bottom bar on the phone');
  const sum = 'button[aria-controls="phone-summary"]';
  check((await ev(reachable(sum))) === 'ok', 'checkout: order-summary row reachable (' + (await ev(reachable(sum))) + ')');
  const s = JSON.parse(await ev(centre(sum)) || 'null');
  if (s) await tap(s.x, s.y);
  check(await ev("!!document.getElementById('phone-summary')"), 'checkout: tapping the summary row opens it');
  const cta = 'form button[type="submit"]';
  const r = await ev("(async function(){var b=[].slice.call(document.querySelectorAll('" + cta + "')).filter(function(e){return e.offsetParent})[0];if(!b)return 'missing';b.scrollIntoView({block:'center',behavior:'instant'});await new Promise(function(r){setTimeout(r,900)});var q=b.getBoundingClientRect();var h=document.elementFromPoint(q.left+q.width/2,q.top+q.height/2);return (h===b||b.contains(h))?'ok':'covered by '+(h?h.tagName+'.'+String(h.className).slice(0,60):'nothing')})()");
  check(r === 'ok', 'checkout: the Continue-to-payment button is reachable (' + r + ')');
  check(await ev("/continue to payment/i.test(document.body.innerText)"), 'checkout: button says Continue to payment');
  // PINNED: the button is fixed to the bottom of the screen, so it is reachable wherever the page is scrolled
  const pinned = await ev("(async function(){var b=[].slice.call(document.querySelectorAll('form button[type=submit]')).filter(function(e){return e.offsetParent})[0];var out=[];var spots=[0,400,100000];for(var i=0;i<spots.length;i++){window.scrollTo({top:spots[i],behavior:'instant'});await new Promise(function(r){setTimeout(r,500)});var q=b.getBoundingClientRect();var h=document.elementFromPoint(q.left+q.width/2,q.top+q.height/2);out.push((h===b||b.contains(h))&&q.bottom<=innerHeight+1?'ok':'NOT')}var bar=b.closest('div.fixed');return out.join(',')+'|'+(bar?getComputedStyle(bar).position:'not-fixed')})()");
  check(pinned === 'ok,ok,ok|fixed', 'checkout: the Continue button is pinned to the bottom at every scroll position (' + pinned + ')');
}, [{ id: 'intricate-glass-bangle', size: '2.4', qty: 2, colour: 'Aqua' }]);

server.close();
console.log(failures ? `\n${failures} CHECK(S) FAILED - do not publish.` : '\nAll smoke checks passed.');
process.exit(failures ? 1 : 0);
