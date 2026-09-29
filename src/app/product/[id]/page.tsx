import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import { products, productById, related, rangeHref, groupBySlug, imgSrc } from "@/lib/catalog";
import { asset, SITE } from "@/lib/site";
import ProductView from "@/components/ProductView";
import ListingCard from "@/components/ListingCard";

const SITE_URL = "https://www.anveda.in";

/**
 * Product structured data (schema.org), so Google can show price and
 * stock status directly in search results instead of a plain blue link.
 * AggregateOffer, not a flat price, since colourways of the same design can
 * be priced differently. No aggregateRating — that field requires REAL
 * reviews behind it; adding one without them is against Google's structured
 * data policy and risks a manual penalty.
 */
function productJsonLd(p: (typeof products)[number]) {
  const prices = p.variants.map((v) => v.price ?? p.price).filter(Boolean);
  const inStock = p.variants.some((v) => v.inStock);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.blurb,
    image: p.variants.map((v) => `${SITE_URL}${asset(imgSrc(v.image))}`),
    brand: { "@type": "Brand", name: SITE.name },
    url: `${SITE_URL}/product/${p.id}/`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: p.variants.length,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/product/${p.id}/`,
    },
  };
}

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = productById(id);
  if (!p) return { title: "Not found" };
  return {
    title: p.name,
    description: `${p.name} — ${p.variants.length} colourways. ${p.blurb}`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = productById(id);
  if (!p) notFound();

  const more = related(p, 4);

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(p)) }}
      />

      <section className="px-5 py-8 sm:px-6 md:py-12">
        <div className="mx-auto max-w-[1320px]">
          <nav className="mb-6 text-[11.5px] uppercase tracking-[0.16em] text-ink-soft">
            <Link href={`/shop/${p.group ?? "glass"}/`} className="hover:text-ink">
              {(p.group && groupBySlug(p.group)?.name) || "Shop"}
            </Link>
            <span className="mx-2">/</span>
            <Link href={rangeHref(p.collection)} className="hover:text-ink">
              {p.collectionName}
            </Link>
          </nav>

          {/* useSearchParams needs a Suspense boundary to prerender statically. */}
          <Suspense
            fallback={<div className="min-h-[60svh] bg-cream-2" aria-hidden="true" />}
          >
            <ProductView p={p} />
          </Suspense>
        </div>
      </section>

      <section className="border-t border-line bg-cream-2 px-5 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-[1320px]">
          <h2 className="reveal mb-9 border-b border-line pb-5 font-display text-[clamp(24px,3vw,36px)]">
            You may also like
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4 md:gap-x-6">
            {more.map((l, i) => (
              <ListingCard key={l.product.id} l={l} delay={(i % 4) * 70} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
