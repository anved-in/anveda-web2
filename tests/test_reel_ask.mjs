// "We'll get it for you" in the reels: a sold-out design, a sold-out colour and a size we do not have all lead to a friendly request.
// Run:  python tests/reel_ask_prep.py ; npm run build ; node tests/test_reel_ask.mjs ; git checkout -- src/data/reels.json src/data/catalog.json
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'F:/ANTIGRAVITY/anveda web 2.0/anveda_web2.0-main/out';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); let f = path.join(OUT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(4597, '127.0.0.1', r));
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
let bad = 0; const check = (ok, m) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + m); if (!ok) bad++; };

async function session(width, height, mobile, tag) {
  const port = 9990 + Math.floor(Math.random() * 9);
  const prof = path.join(process.env.TEMP, 'smoke-ask-' + Date.now() + width);
  const proc = spawn(EDGE, [`--remote-debugging-port=${port}`, '--headless=new', '--disable-gpu', '--user-data-dir=' + prof, 'about:blank'], { stdio: 'ignore' });
  let t; for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (t.find((x) => x.type === 'page')) break; } catch {} await sleep(250); }
  const ws = new WebSocket(t.find((x) => x.type === 'page').webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result.result?.value;
  const clickVisible = (re) => ev(`(function(){var b=[].slice.call(document.querySelectorAll('button,a')).filter(function(x){return ${re}.test(x.textContent)&&x.offsetParent&&!x.disabled})[0]; if(b){b.click();return true} return false})()`);
  const dialog = () => ev("(function(){var d=document.querySelector('[aria-labelledby=notify-title]');return d?d.innerText:null})()");
  const open = async (reel) => {
    await send('Page.navigate', { url: `http://127.0.0.1:4597/reels/?v=${reel}` }); await sleep(4500);
    // record what would be sent to the shop, and answer "ok" (the local test server has no /api)
    await ev("window.__sent=[]; var rf=window.fetch; window.fetch=function(u,o){ if(String(u).indexOf('/api/notify-stock')!==-1){ window.__sent.push(JSON.parse(o.body)); return Promise.resolve(new Response(JSON.stringify({ok:true}),{headers:{'content-type':'application/json'}})) } return rf.apply(this,arguments) }");
    if (mobile) { await clickVisible('/choose/i'); await sleep(900); }
  };
  try {
    await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });

    // ---- one design: a sold-out colour and a size we do not have
    await open('ask-a');
    const bodyA = await ev('document.body.innerText');
    check(/Colour you want is sold out\? We.ll get it for you\./i.test(bodyA), `${tag}: a design with a sold-out colour says "we'll get it for you" under the colour box`);
    check(/Size crossed out or missing\? Tap it and we.ll get it for you\./i.test(bodyA), `${tag}: the size row explains that a crossed-out size can be asked for`);
    await clickVisible('/Colour you want is sold out/'); await sleep(500);
    let d = await dialog();
    check(!!d && /We.ll get it for you/i.test(d) && /Yes, get it for me/i.test(d) && /You.re asking for/i.test(d), `${tag}: tapping it opens the "We'll get it for you" request`);
    check(/nothing to pay now/i.test(d || ''), `${tag}: the request says there is nothing to pay now`);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(400);
    check((await dialog()) === null && (await ev('location.pathname')).startsWith('/reels'), `${tag}: Escape closes only the request, the reel stays open`);
    // a size we do not have
    const tapSize = await ev("(function(){var b=[].slice.call(document.querySelectorAll('[role=group][aria-label=Size] button')).filter(function(x){return x.textContent.trim()==='2.6'&&x.offsetParent})[0]; if(!b) return 'no chip'; b.click(); return 'ok'})()"); await sleep(500);
    d = await dialog();
    check(tapSize === 'ok' && !!d && /size 2\.6/.test(d), `${tag}: tapping the crossed-out size 2.6 asks for exactly that size (${tapSize})`);
    await ev("(function(){var e=document.querySelector('[aria-labelledby=notify-title] input[type=email]'); var s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; s.call(e,'asha@example.com'); e.dispatchEvent(new Event('input',{bubbles:true}))})()"); await sleep(150);
    await clickVisible('/Yes, get it for me/'); await sleep(600);
    const sent = JSON.parse(await ev('JSON.stringify(window.__sent)'));
    check(sent.length === 1 && sent[0].size === '2.6' && typeof sent[0].variantId === 'number' && sent[0].email === 'asha@example.com', `${tag}: the request goes to the shop's waiting list with the variant and size (${JSON.stringify(sent[0] || null)})`);
    d = await dialog();
    check(/Thank you for telling us/i.test(d || ''), `${tag}: it thanks them and says we will message them`);
    await clickVisible('/^Done$/'); await sleep(300);

    // ---- a combination with a design that is sold out
    await open('ask-b');
    const bodyB = await ev('document.body.innerText');
    check(/Sold out right now\./i.test(bodyB) && /Get it for me/i.test(bodyB), `${tag}: the sold-out design in a combo shows "Get it for me"`);
    check(/Currently unavailable/i.test(bodyB), `${tag}: the combo cannot be added to the bag while a design is sold out`);
    await clickVisible('/^Get it for me$/'); await sleep(500);
    d = await dialog();
    check(!!d && /Kada|kada/i.test(d), `${tag}: the request names the sold-out design (${(d || '').replace(/\s+/g, ' ').slice(0, 90)})`);
    check((await ev("(function(){var el=document.querySelector('[aria-labelledby=notify-title]'); var d=el.getBoundingClientRect(); var z=getComputedStyle(el.parentElement).zIndex; return z==='500' && d.width>0 && d.width<=innerWidth})()")) === true, `${tag}: the request sits above the reel sheet and fits the screen`);
  } finally { ws.close(); proc.kill(); await sleep(1500); try { fs.rmSync(prof, { recursive: true, force: true }); } catch {} }
}
await session(1280, 900, false, 'desktop');
await session(390, 800, true, 'phone');
server.close();
console.log(bad ? `\n${bad} CHECK(S) FAILED` : '\nAll reel-request checks passed.');
process.exit(bad ? 1 : 0);
