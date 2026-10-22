// Release check: every server call the website makes must be wired through the Pages function, and must exist on the shop's server.
// (A missing line in functions/api/[[path]].js shows to a customer as "not found", and no screenshot test catches it.)
//   node scripts/check-routes.mjs
import fs from 'node:fs';
import path from 'node:path';

import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fn = fs.readFileSync(path.join(root, 'functions', 'api', '[[path]].js'), 'utf8');
const routed = new Set([...fn.matchAll(/^\s*"(\/api\/[^"]+)":/gm)].map((m) => m[1]));

// 1. every fetch("/api/...") and accountPost("...") in the site's code
const used = new Set();
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(ts|tsx)$/.test(e.name)) scan(p); } };
const scan = (p) => {
  const t = fs.readFileSync(p, 'utf8');
  for (const m of t.matchAll(/["'`](\/api\/[a-z][a-z0-9\-/]*)["'`]/g)) used.add(m[1]);
  for (const m of t.matchAll(/accountPost(?:<[\s\S]*?>)?\(\s*"([a-z/]+)"/g)) used.add('/api/account/' + m[1]);
};
walk(path.join(root, 'src'));

let bad = 0;
for (const u of [...used].sort()) { if (!routed.has(u)) { console.log('FAIL  the site calls ' + u + ' but functions/api/[[path]].js does not route it'); bad++; } }

// 2. every account route the function forwards must exist on the shop's server (ANVEDA2/src/account.ts)
const cmsFile = path.resolve(root, '..', '..', 'ANVEDA2', 'src', 'account.ts');
if (fs.existsSync(cmsFile)) {
  const cms = fs.readFileSync(cmsFile, 'utf8');
  const have = new Set([...cms.matchAll(/account\.post\('(\/[^']+)'/g)].map((m) => m[1]));
  for (const r of routed) if (r.startsWith('/api/account/') && !have.has(r.slice('/api/account'.length))) { console.log('FAIL  ' + r + ' is routed but the shop server has no ' + r.slice('/api/account'.length)); bad++; }
} else console.log('note: ANVEDA2 not found next to this project, skipped the server side check');

console.log(bad ? `\n${bad} PROBLEM(S): do not deploy.` : `All ${used.size} calls the site makes are routed.`);
process.exit(bad ? 1 : 0);
