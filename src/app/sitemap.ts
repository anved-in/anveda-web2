import type { MetadataRoute } from "next";
import { products, groups } from "@/lib/catalog";

// Static export + Next's sitemap convention: this runs at BUILD time and
// writes a real sitemap.xml into ./out, same as every other page here. No
// server, no runtime cost — it just needs rebuilding when the catalog syncs,
// which the automatic CMS 2.0 -> GitHub -> Cloudflare pipeline already does.
const BASE = "https://www.anveda.in";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    "",
    "about",
    "contact",
    "shipping",
    "sizing",
    "reels",
    "terms",
    "privacy",
    "track",
    "guides/glass-vs-kundan-vs-antique",
  ].map((p) => ({
    url: `${BASE}/${p}${p ? "/" : ""}`,
    lastModified: new Date(),
  }));

  const groupPages = groups.map((g) => ({
    url: `${BASE}/shop/${g.slug}/`,
    lastModified: new Date(),
  }));

  const productPages = products.map((p) => ({
    url: `${BASE}/product/${p.id}/`,
    lastModified: new Date(),
  }));

  return [...staticPages, ...groupPages, ...productPages];
}
