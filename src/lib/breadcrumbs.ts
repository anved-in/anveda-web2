const SITE_URL = "https://www.anveda.in";

/** BreadcrumbList structured data — Google shows this trail under a search
 * result instead of a raw URL. `url` may be relative ("/shop/glass/"). */
export const breadcrumbJsonLd = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.name,
    item: it.url.startsWith("http") ? it.url : `${SITE_URL}${it.url}`,
  })),
});
