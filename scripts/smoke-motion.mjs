// Motion check for the WEBSITE. Run after `npm run build`:   node scripts/smoke-motion.mjs
//
// It serves ./out and, in headless Edge, proves the micro-animations behave by their rules (see "Motion" in globals.css):
//   - a press really sinks the button (scale .97) at once, on a real touch; and does NOT move when the person asked for reduced motion
//   - the bag badge swells and the quantity number slides when the bag changes (and not on first paint)
//   - the drawers use the strong curve; the header gets its soft edge only after the page has moved
//   - the order-confirmed tick draws itself
//   - the finalised PHONE product page is left exactly as it was (no new press, no new transitions), while the PC one animates
//   - nothing made the page wider than the screen
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), 'out');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent((req.url || '/').split('?')[0]);
  let f = path.join(OUT, p);
  if (!f.startsWith(OUT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(4598, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:4598';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
let failures = 0;
const check = (ok, what) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + what); if (!ok) failures++; };

// simulated touches only work on a browser's FIRST page load, so each scenario loads its page exactly once
async function session({ width, height, mobile, url, seedCart, reduce }, fn) {
  const port = 9700 + Math.floor(Math.random() * 40);
  const prof = path.join(process.env.TEMP || '.', 'smoke-motion-' + Date.now() + width);
  const proc = spawn(EDGE, [`--remote-debugging-port=${port}`, '--headless=new', '--disable-gpu', '--user-data-dir=' + prof, 'about:blank'], { stdio: 'ignore' });
  let t; for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (t.find((x) => x.type === 'page')) break; } catch {} await sleep(250); }
  const ws = new WebSocket(t.find((x) => x.type === 'page').webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result.result.value;
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  if (reduce) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  if (seedCart) await send('Page.addScriptToEvaluateOnNewDocument', { source: "try{localStorage.setItem('anveda.cart.v1', " + JSON.stringify(JSON.stringify(seedCart)) + ")}catch(e){}" });
  await send('Page.navigate', { url }); await sleep(3500);
  // a pointer press: it sets the browser's :active state, which is what the press animation hangs on (headless touch taps do not)
  const touch = async (type, x, y) => send('Input.dispatchMouseEvent', { type: type === 'touchStart' ? 'mousePressed' : 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  try { await fn({ ev, touch, sleep }); } finally { ws.close(); proc.kill(); await sleep(1500); try { fs.rmSync(prof, { recursive: true, force: true }); } catch {} }
}
const centre = (sel) => `JSON.stringify((function(){var e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;var r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})())`;
// a button that is really on screen and really on top (a hidden one would take the touch for nothing)
const visibleButton = "JSON.stringify((function(){var bs=[].slice.call(document.querySelectorAll('button'));for(var i=0;i<bs.length;i++){var r=bs[i].getBoundingClientRect();if(r.width<20||r.height<20||r.top<0||r.bottom>innerHeight)continue;var x=r.left+r.width/2,y=r.top+r.height/2;var h=document.elementFromPoint(x,y);if(h&&(h===bs[i]||bs[i].contains(h)))return {x:x,y:y}}return null})())";
const noOverflow = "document.documentElement.scrollWidth <= document.documentElement.clientWidth";

// one real design to open (the first product folder that was built)
const productId = fs.readdirSync(path.join(OUT, 'product')).filter((n) => fs.statSync(path.join(OUT, 'product', n)).isDirectory())[0];
const cat = JSON.parse(fs.readFileSync('src/data/catalog.json', 'utf8'));
const prod = cat.products.find((p) => p.id === productId) || cat.products[0];
const seedAny = [{ id: prod.id, colour: prod.variants[0].colour, size: '2.4', qty: 1 }];

// ---------------------------------------------------------------- phone: a press sinks a button at once
await session({ width: 390, height: 800, mobile: true, url: BASE + '/shop/glass/' }, async ({ ev, touch, sleep }) => {
  check((await ev("getComputedStyle(document.querySelector('button')).transitionProperty")).includes('scale'), 'phone: buttons animate their press (scale is in the transition)');
  const b = JSON.parse(await ev(visibleButton));
  await touch('touchStart', b.x, b.y); await sleep(60);
  const pressed = await ev("(function(){var e=document.querySelector('button:active');return e?getComputedStyle(e).scale:'none-pressed'})()");
  await touch('touchEnd', b.x, b.y); await sleep(300);
  check(parseFloat(pressed) >= 0.965 && parseFloat(pressed) <= 0.98, `phone: a press sinks the button towards 0.97 within 60 ms (got ${pressed})`);
  check((await ev("getComputedStyle(document.querySelector('.site-head')).transitionProperty")).includes('box-shadow'), 'phone: the header has its soft-edge transition');
  check((await ev(noOverflow)) === true, 'phone: the shop page is not wider than the screen');
});

// ---------------------------------------------------------------- phone with "reduce motion" on: no movement
await session({ width: 390, height: 800, mobile: true, url: BASE + '/shop/glass/', reduce: true }, async ({ ev, touch, sleep }) => {
  const b = JSON.parse(await ev(visibleButton));
  await touch('touchStart', b.x, b.y); await sleep(60);
  const pressed = await ev("(function(){var e=document.querySelector('button:active');return e?getComputedStyle(e).scale:'none-pressed'})()");
  await touch('touchEnd', b.x, b.y);
  check(pressed === 'none', `reduced motion: a button was pressed and nothing moved (got ${pressed})`);
});

// ---------------------------------------------------------------- phone PRODUCT page: left exactly as it was
await session({ width: 390, height: 800, mobile: true, url: BASE + '/product/' + prod.id + '/' }, async ({ ev, touch, sleep }) => {
  check((await ev("document.documentElement.classList.contains('pdp')")) === true, 'phone product page: marked as the finalised page');
  check(!(await ev("getComputedStyle(document.querySelector('button')).transitionProperty")).includes('scale'), 'phone product page: its buttons got NO new press animation');
  const b = JSON.parse(await ev(visibleButton));
  await touch('touchStart', b.x, b.y); await sleep(60);
  const pressed = await ev("(function(){var e=document.querySelector('button:active');return e?getComputedStyle(e).scale:'none-pressed'})()");
  await touch('touchEnd', b.x, b.y);
  check(pressed === 'none', `phone product page: a press does not scale anything (got ${pressed})`);
  await ev('window.scrollTo(0, 500)'); await sleep(400);
  check((await ev("getComputedStyle(document.querySelector('.site-head')).boxShadow")) === 'none', 'phone product page: no new header shadow when scrolling');
  check((await ev(noOverflow)) === true, 'phone product page: not wider than the screen');
});

// ---------------------------------------------------------------- PC
await session({ width: 1280, height: 800, mobile: false, url: BASE + '/shop/glass/' }, async ({ ev, sleep }) => {
  check((await ev("document.documentElement.hasAttribute('data-scrolled')")) === false, 'PC: no header edge at the top of the page');
  await ev('window.scrollTo(0, 600)'); await sleep(500);
  check((await ev("document.documentElement.hasAttribute('data-scrolled')")) === true, 'PC: the header gets its soft edge once the page has moved');
  check((await ev("getComputedStyle(document.querySelector('.site-head')).boxShadow")) !== 'none', 'PC: ...and the shadow is really drawn');
  await ev('window.scrollTo(0, 0)'); await sleep(400);
  check((await ev("document.documentElement.hasAttribute('data-scrolled')")) === false, 'PC: ...and goes again at the top');
  check((await ev(noOverflow)) === true, 'PC: the shop page is not wider than the screen');
});

// bag: seeded, then the quantity goes up (scripted click on the real button)
await session({ width: 1280, height: 800, mobile: false, url: BASE + '/shop/glass/', seedCart: seedAny }, async ({ ev, sleep }) => {
  const badge = "document.querySelector('button[aria-label^=\"Open bag\"] span')";
  const first = await ev(`(function(){var b=${badge};return b?b.className:'none'})()`);
  check(!String(first).includes('av-bump'), `bag: the badge does not bump on first paint (${first})`);
  await ev("document.querySelector('button[aria-label^=\"Open bag\"]').click()"); await sleep(500);
  const curve = await ev("getComputedStyle(document.querySelector('aside[aria-label=\"Your bag\"]')).transitionTimingFunction");
  check(curve.includes('0.32, 0.72, 0, 1'), `bag: the drawer slides on the strong curve (${curve})`);
  const had = await ev("document.querySelectorAll('aside[aria-label=\"Your bag\"] button[aria-label^=\"Increase quantity\"]').length");
  if (had) {
    await ev("document.querySelector('aside[aria-label=\"Your bag\"] button[aria-label^=\"Increase quantity\"]').click()"); await sleep(120);
    check((await ev(`(function(){var b=${badge};return !!b&&b.classList.contains('av-bump')})()`)) === true, 'bag: the badge swells when the quantity changes');
    check((await ev("!!document.querySelector('aside[aria-label=\"Your bag\"] .av-tick')")) === true, 'bag: the quantity number slides in');
  } else {
    check(false, 'bag: could not find a quantity button (the seeded bag did not load)');
  }
  check((await ev(noOverflow)) === true, 'bag: the page is not wider than the screen');
});

// product page on PC DOES animate
await session({ width: 1280, height: 800, mobile: false, url: BASE + '/product/' + prod.id + '/' }, async ({ ev }) => {
  check((await ev("getComputedStyle(document.querySelector('button')).transitionProperty")).includes('scale'), 'PC product page: buttons animate their press');
});

// order confirmed: the tick draws itself
await session({ width: 390, height: 800, mobile: true, url: BASE + '/order-confirmed/?ref=AVTEST&p=pay_test' }, async ({ ev, sleep }) => {
  await sleep(900);
  check((await ev("getComputedStyle(document.querySelector('.av-draw')).animationName")) === 'av-draw', 'order confirmed: the tick has its drawing animation');
  check((await ev("getComputedStyle(document.querySelector('.av-draw')).strokeDashoffset")) === '0px', 'order confirmed: ...and ends fully drawn');
});

server.close();
console.log(failures ? `\n${failures} FAILED` : '\nAll motion checks passed.');
process.exit(failures ? 1 : 0);
