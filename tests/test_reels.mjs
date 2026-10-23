import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import assert from 'node:assert/strict';

const site = 'F:/ANTIGRAVITY/anveda web 2.0/anveda_web2.0-main';
const cat = JSON.parse(fs.readFileSync(site + '/src/data/catalog.json', 'utf8'));
const pid = cat.products[0].id;
const tmp = path.join(process.env.TEMP, 'reels-cases.json');
fs.writeFileSync(tmp, JSON.stringify({ reels: [
  { id: 'a', video: null, instagram: 'https://www.instagram.com/reel/A/', cover: '/img/reels/a-cover.jpg', title: 'Has cover', caption: '', productId: pid, colour: null, combo: null },
  { id: 'b', video: null, instagram: 'https://www.instagram.com/reel/B/', cover: null, title: 'No cover, known design', caption: '', productId: pid, colour: null, combo: null },
  { id: 'c', video: null, instagram: 'https://www.instagram.com/reel/C/', cover: null, title: 'No cover, no design', caption: '', productId: null, colour: null, combo: null },
  { id: 'd', video: null, instagram: null, cover: '/img/reels/d.jpg', title: 'No link or video', caption: '', productId: pid, colour: null, combo: null },
] }));
const out = path.join(process.env.TEMP, 'reels-bundle.mjs');
execSync(`npx esbuild src/lib/reels.ts --bundle --format=esm --platform=node --outfile="${out}" --alias:@/data/reels.json="${tmp}" --alias:@=./src --log-level=error`, { cwd: site, stdio: 'inherit' });
const { reels } = await import('file:///' + out.split(String.fromCharCode(92)).join('/') + '?t=' + Date.now());
const list = reels();
assert.deepEqual(list.map((r) => r.id), ['a', 'b']);
assert.equal(list[0].cover, '/img/reels/a-cover.jpg');
assert.ok(list[1].cover.startsWith('/img/products/'), list[1].cover);
for (const r of list) assert.equal(typeof r.cover, 'string');
console.log('ok: a reel with no cover borrows its design\'s photo; with neither it is left out; every reel shown has a cover string (so the page cannot crash on startsWith)');
