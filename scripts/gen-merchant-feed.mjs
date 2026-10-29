import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CATALOG_PATH = path.join(ROOT, "src", "data", "catalog.json");
const OUTPUT_PATH = path.join(ROOT, "public", "merchant-feed.xml");

function escapeXml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateFeed() {
  if (!fs.existsSync(CATALOG_PATH)) {
    console.error("Catalog file not found at", CATALOG_PATH);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const products = raw.products || [];

  let itemsXml = "";
  let totalItems = 0;

  for (const p of products) {
    const variants = p.variants || [];
    for (const [idx, v] of variants.entries()) {
      const priceVal = v.price || p.price || 180;
      const id = `${p.id}-${v.id || idx + 1}`;
      const title = `${p.name} - ${v.colour} ${p.pieces ? `(${p.pieces} pcs)` : "Set"} | ANVEDA Glass Bangles`;
      const desc = `${p.blurb || "Authentic handpicked glass bangles."} Handpicked in small batches, cushioned packaging, delivered across India.`;
      const link = `https://www.anveda.in/product/${p.id}/?c=${encodeURIComponent(v.colour)}`;
      const image = `https://www.anveda.in/img/products/${v.image}`;
      const availability = v.inStock ? "in_stock" : "out_of_stock";
      const sizeStr = (v.sizes && v.sizes.length > 0) ? v.sizes.join("/") : "Standard";

      itemsXml += `    <item>
      <g:id>${escapeXml(id)}</g:id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(desc)}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(image)}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${priceVal.toFixed(2)} INR</g:price>
      <g:brand>ANVEDA</g:brand>
      <g:google_product_category>Apparel &amp; Accessories &gt; Jewelry &gt; Bracelets</g:google_product_category>
      <g:product_type>Jewelry &gt; Bangles &gt; Glass Bangles</g:product_type>
      <g:size>${escapeXml(sizeStr)}</g:size>
    </item>\n`;
      totalItems++;
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>ANVEDA - Handpicked Glass Bangles India</title>
    <link>https://www.anveda.in</link>
    <description>Authentic handpicked glass bangles, ornate kadas, and layering sets delivered safely across India.</description>
${itemsXml}  </channel>
</rss>
`;

  fs.writeFileSync(OUTPUT_PATH, xml, "utf8");
  console.log(`[merchant-feed] Generated ${totalItems} products into ${OUTPUT_PATH}`);
}

generateFeed();
