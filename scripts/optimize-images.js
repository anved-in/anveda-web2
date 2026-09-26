// Runs automatically before every build (see package.json's "prebuild").
// Caps every product photo at 1000px on the longest edge and re-encodes to
// webp at quality 80 — a phone photo dropped in at full resolution (2000px+,
// 500-800KB) was shipping to a card that only ever displays at a few hundred
// pixels wide. Idempotent: an image already at or under the cap and already
// webp is left untouched, so re-running this on an unchanged folder does no
// repeated lossy re-encoding.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const DIR = path.join(__dirname, "..", "public", "img", "products");
const MAX_DIMENSION = 1000;
const QUALITY = 80;

async function main() {
  const files = fs.readdirSync(DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  let converted = 0;
  let skipped = 0;
  let bytesBefore = 0;
  let bytesAfter = 0;

  for (const file of files) {
    const fullPath = path.join(DIR, file);
    // Read into a buffer rather than handing sharp the path directly — sharp
    // keeps an open file handle on a path input, and Windows refuses to
    // delete a file that's still open (EBUSY), which matters right below
    // when the old .jpg/.png needs removing once its .webp replacement
    // exists.
    const inputBuffer = fs.readFileSync(fullPath);
    const before = inputBuffer.length;
    const img = sharp(inputBuffer);
    const meta = await img.metadata();

    const alreadyWebp = path.extname(file).toLowerCase() === ".webp";
    const alreadySmall = (meta.width ?? 0) <= MAX_DIMENSION && (meta.height ?? 0) <= MAX_DIMENSION;
    if (alreadyWebp && alreadySmall) {
      skipped++;
      bytesBefore += before;
      bytesAfter += before;
      continue;
    }

    const outPath = path.join(DIR, path.basename(file, path.extname(file)) + ".webp");
    const buffer = await img
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer();
    fs.writeFileSync(outPath, buffer);
    if (outPath !== fullPath) fs.unlinkSync(fullPath); // drop the old .jpg/.png once its .webp replacement exists

    converted++;
    bytesBefore += before;
    bytesAfter += buffer.length;
  }

  const mb = (n) => (n / 1024 / 1024).toFixed(1) + "MB";
  console.log(`optimize-images: ${converted} converted, ${skipped} already optimal (${mb(bytesBefore)} -> ${mb(bytesAfter)})`);

  if (converted > 0) {
    console.log("NOTE: filenames changed for any non-.webp source (e.g. photo.jpg -> photo.webp).");
    console.log("If src/data/catalog.json or reels.json reference the old extension, update them too.");
  }
}

main().catch((e) => {
  console.error("optimize-images failed:", e);
  process.exit(1);
});
