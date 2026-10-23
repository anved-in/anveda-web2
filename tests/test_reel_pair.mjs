import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'F:/ANTIGRAVITY/anveda web 2.0/anveda_web2.0-main/out';
const SHOTS = process.argv[2];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); let f = path.join(OUT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(4596, '127.0.0.1', r));
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
let bad = 0; const check = (ok, m) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + m); if (!ok) bad++; };

// The page draws the picker twice (a desktop panel and a phone sheet) and hides one, so always work with the VISIBLE copy.
const HELPERS = `window.__sel = function (id) { return [].slice.call(document.querySelectorAll('select')).filter(function (e) { return e.id === id && e.offsetParent; })[0]; };
window.__opts = function (id) { var s = window.__sel(id); return s ? [].map.call(s.options, function (o) { return { v: o.value, d: o.disabled, t: o.textContent }; }) : null; };
window.__set = function (id, v) { var s = window.__sel(id); if (!s) return 'missing'; Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, v); s.dispatchEvent(new Event('change', { bubbles: true })); return 'ok'; };`;

async function session(width, height, mobile, tag) {
  const port = 9970 + Math.floor(Math.random() * 20);
  const prof = path.join(process.env.TEMP, 'smoke-pair-' + Date.now() + width);
  const proc = spawn(EDGE, [`--remote-debugging-port=${port}`, '--headless=new', '--disable-gpu', '--user-data-dir=' + prof, 'about:blank'], { stdio: 'ignore' });
  let t; for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (t.find((x) => x.type === 'page')) break; } catch {} await sleep(250); }
  const ws = new WebSocket(t.find((x) => x.type === 'page').webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result.result?.value;
  const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(SHOTS, `${tag}-${name}.png`), Buffer.from(r.result.data, 'base64')); };
  const clickVisible = (re) => ev(`(function(){var b=[].slice.call(document.querySelectorAll('button,a')).filter(function(x){return ${re}.test(x.textContent)&&x.offsetParent&&!x.disabled})[0]; if(b){b.click();return 'ok'} return 'none'})()`);
  try {
    await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await send('Page.navigate', { url: 'http://127.0.0.1:4596/reels/?v=pair-test' }); await sleep(4500);
    await ev(HELPERS);
    if (mobile) { await clickVisible('/choose/i'); await sleep(900); }
    check((await ev("!!window.__sel('col-pair-test-0') && !!window.__sel('col-pair-test-1') && !window.__sel('col-pair-test-2')")) === true, `${tag}: two colour boxes for the one design`);
    const body0 = await ev('document.body.innerText');
    check(/Colour 1 of 2/.test(body0) && /Colour 2 of 2/.test(body0), `${tag}: the entries say "Colour 1 of 2" and "Colour 2 of 2"`);
    check(/Combo\s*\S\s*1 design\b/i.test(body0), `${tag}: the header counts the design once ("Combo . 1 design")`);
    const o0 = (await ev("JSON.stringify(window.__opts('col-pair-test-0'))")); const opts = JSON.parse(o0).filter((o) => o.v);
    check(opts.length === 2, `${tag}: the first box offers only its two ticked colours (${opts.map((o) => o.v).join(' / ')})`);
    const shared = opts[1].v;     // a colour BOTH boxes allow
    await ev(`window.__set('col-pair-test-0', ${JSON.stringify(shared)})`); await sleep(300);
    const o1 = JSON.parse(await ev("JSON.stringify(window.__opts('col-pair-test-1'))"));
    const blocked = o1.find((o) => o.v === shared);
    check(!!blocked && blocked.d && /chosen above/.test(blocked.t), `${tag}: the colour taken in the first box is blocked in the second ("${blocked && blocked.t}")`);
    const other = o1.filter((o) => o.v && !o.d)[0].v;
    await ev(`window.__set('col-pair-test-1', ${JSON.stringify(other)})`); await sleep(300);
    await shot('1-picked');
    await ev("(function(){var b=[].slice.call(document.querySelectorAll('[role=group][aria-label=Size] button')).filter(function(x){return !x.disabled&&x.offsetParent})[0]; if(b) b.click()})()"); await sleep(300);
    await clickVisible('/add to bag/i'); await sleep(900);
    const cart = JSON.parse((await ev("localStorage.getItem('anveda.cart.v1')")) || '[]');
    const line = cart.find((l) => l.combo);
    check(!!line && line.combo.picks.length === 2, `${tag}: the bag has ONE combo line with two picks`);
    check(!!line && line.combo.picks[0].id === line.combo.picks[1].id && line.combo.picks[0].colour !== line.combo.picks[1].colour, `${tag}: both picks are the same design in two different colours (${line && line.combo.picks.map((p) => p.colour).join(' + ')})`);
    // the server's quote must accept exactly what the bag now holds
    const q = await ev(`(async function(){var l=${JSON.stringify(line || null)}; if(!l) return 'no line'; var r=await fetch('/api/shipping-quote',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({pin:'411001',state:'Maharashtra',lines:[],combos:[{reelId:l.combo.reelId,qty:1,picks:l.combo.picks.map(function(k){return{productId:k.id,colour:k.colour,size:k.size}})}]})}); return r.status})()`);
    check(q === 404, `${tag}: (the bag sends two picks of the same design to the server: ${q === 404 ? 'the local test server has no /api, as expected' : q})`);
    await ev("(function(){var b=document.querySelector('button[aria-label*=\"bag\" i]'); if(b) b.click()})()"); await sleep(800);
    const bag = await ev('document.body.innerText');
    check((bag.match(/Premium non Bendable/g) || []).length >= 2 || (bag.match(/Pearl Gold/g) || []).length >= 1, `${tag}: the bag lists both colours`);
    await shot('2-bag');
  } finally { ws.close(); proc.kill(); await sleep(1500); try { fs.rmSync(prof, { recursive: true, force: true }); } catch {} }
}
await session(1280, 900, false, 'desktop');
await session(390, 800, true, 'phone');
server.close();
console.log(bad ? `\n${bad} CHECK(S) FAILED` : '\nAll pair checks passed.');
process.exit(bad ? 1 : 0);
