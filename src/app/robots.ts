import type { MetadataRoute } from "next";

export const dynamic = "force-static";

// Everything public may be crawled (Google and the AI search tools alike). Pages that only make sense for one customer, or
// that are not pages at all, are kept out. (Each of them also says "noindex" in its own tags.)
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/account/", "/checkout/", "/order-confirmed/", "/review/", "/chat/", "/go/", "/track/"],
    },
    sitemap: "https://www.anveda.in/sitemap.xml",
  };
}
