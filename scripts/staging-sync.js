// On the TEST copy (any Cloudflare Pages branch other than main) pull the newest catalog, photos and reels
// straight from the CMS before building, so the test site always shows exactly what the CMS holds right now.
// The live site (main) is untouched: it only changes through the "Sync catalog from ANVEDA" GitHub Action.
// Never fails the build: if Python or the CMS is unavailable the test copy just keeps the catalog stored in git.
const { spawnSync } = require("child_process");

const branch = process.env.CF_PAGES_BRANCH;
if (!branch || branch === "main") process.exit(0);

console.log(`[staging-sync] test copy (${branch}): pulling the latest catalog from the CMS`);
for (const py of ["python3", "python"]) {
  const r = spawnSync(py, ["scripts/gen-catalog.py"], { stdio: "inherit" });
  if (!r.error && r.status === 0) {
    console.log("[staging-sync] done");
    process.exit(0);
  }
}
console.warn("[staging-sync] could not refresh the catalog; using the one stored in git");
