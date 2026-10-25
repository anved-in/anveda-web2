// Keeps the website's built-in wording in step with the CMS's list of editable boxes (CMS > Website pages).
//
//   node scripts/check-site-content.mjs
//
// For every sc("key", "original wording") / scImage("key") in src/ it checks that the box exists in the CMS list
// (ANVEDA2/src/site-content-schema.json) and that the original wording is IDENTICAL (otherwise the CMS would show one text
// while the website shows another). It also checks that every box in the CMS list is used by the website somewhere.
// The CMS repository lives next to this one on the owner's computer; where it is not there (for example in GitHub's
// automatic checks) the check says so and passes.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = process.env.SITE_SCHEMA || "F:/ANTIGRAVITY/ANVEDA2/src/site-content-schema.json";
if (!fs.existsSync(schemaPath)) {
  console.log("check-site-content: the CMS list of boxes was not found here, nothing to compare (passes).");
  process.exit(0);
}
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const fields = new Map();
for (const p of schema.pages) for (const s of p.sections) for (const f of s.fields) fields.set(f.key, f);

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f);
    else if (/\.(tsx?|jsx?)$/.test(e.name)) files.push(f);
  }
})(path.join(root, "src"));

const problems = [];
const used = new Set();                    // exact keys
const patterns = [];                       // keys built with ${...}
const LITERAL = /\bsc\(\s*"([^"]+)"\s*,\s*("(?:[^"\\]|\\.)*")\s*,?\s*\)/g;   // sc("key", "original wording")
const ANY = /\b(?:sc|scImage)\(\s*"([^"]+)"/g;                                  // any use of a key (the wording may come from code)
const IMAGE = /\bscImage\(\s*"([^"]+)"\s*\)/g;
const TEMPLATE = /\b(?:sc|scImage)\(\s*`([^`]+)`/g;
for (const file of files) {
  if (file.endsWith(path.join("lib", "siteContent.ts"))) continue;
  const src = fs.readFileSync(file, "utf8");
  const rel = path.relative(root, file);
  for (const m of src.matchAll(LITERAL)) {
    const [, key, lit] = m;
    used.add(key);
    const f = fields.get(key);
    if (!f) { problems.push(`${rel}: "${key}" is not a box in the CMS list`); continue; }
    let text; try { text = JSON.parse(lit); } catch { problems.push(`${rel}: could not read the wording of "${key}"`); continue; }
    if (text !== f.default) problems.push(`${rel}: "${key}" says ${JSON.stringify(text)} but the CMS shows ${JSON.stringify(f.default)}`);
  }
  for (const m of src.matchAll(IMAGE)) {
    used.add(m[1]);
    const f = fields.get(m[1]);
    if (!f) problems.push(`${rel}: "${m[1]}" is not a box in the CMS list`);
    else if (f.type !== "image") problems.push(`${rel}: "${m[1]}" is used as a photo but is not a photo box in the CMS`);
  }
  for (const m of src.matchAll(ANY)) {
    used.add(m[1]);
    if (!fields.has(m[1])) problems.push(`${rel}: "${m[1]}" is not a box in the CMS list`);
  }
  for (const m of src.matchAll(TEMPLATE)) {
    const esc = (s) => s.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");
    patterns.push(new RegExp("^" + m[1].split(/\$\{[^}]*\}/).map(esc).join("\\d+") + "$"));
  }
}
for (const [key, f] of fields) {
  if (used.has(key) || patterns.some((re) => re.test(key))) continue;
  problems.push(`the CMS box "${key}" (${f.label}) is not used by the website`);
}
if (problems.length) {
  console.log("SITE CONTENT CHECK FAILED:");
  for (const p of problems) console.log("  - " + p);
  process.exit(1);
}
console.log(`check-site-content: ${fields.size} boxes, the website's wording matches the CMS everywhere.`);
