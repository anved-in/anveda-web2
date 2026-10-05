"use client";

import { useMemo, useState } from "react";
import ListingCard from "./ListingCard";
import { listingPrice, listingTitle, type Listing } from "@/lib/catalog";

export interface ShopSection {
  slug: string;
  name: string;
  blurb: string;
  items: Listing[];
}

type Sort = "default" | "price-asc" | "price-desc";

/**
 * Wraps the group page's sectioned listing in a client-side search/sort/
 * in-stock filter. With no search text and the default sort, this renders
 * the exact sectioned layout the server already produced — filtering only
 * kicks in once the shopper actually touches a control, so the common case
 * (just browsing) never pays for a flattened re-layout.
 */
export default function ShopBrowser({ sections }: { sections: ShopSection[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("default");
  const [inStockOnly, setInStockOnly] = useState(false);

  const all = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  const browsing = q.trim() === "" && sort === "default" && !inStockOnly;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let items = all;
    if (needle) {
      items = items.filter((l) => {
        const title = listingTitle(l.product, l.variant, true).toLowerCase();
        return title.includes(needle) || l.variant.colour.toLowerCase().includes(needle);
      });
    }
    if (inStockOnly) items = items.filter((l) => l.variant.inStock);
    if (sort === "price-asc") items = [...items].sort((a, b) => listingPrice(a) - listingPrice(b));
    if (sort === "price-desc") items = [...items].sort((a, b) => listingPrice(b) - listingPrice(a));
    return items;
  }, [all, q, sort, inStockOnly]);

  return (
    <>
      <div className="border-b border-line bg-cream px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-3">
          <div className="relative min-w-[180px] flex-1">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search this range…"
              aria-label="Search designs"
              className="w-full rounded-full border border-line-strong bg-white px-4 py-2 text-[13px] outline-none transition-colors focus:border-ink"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label="Sort by"
            className="rounded-full border border-line-strong bg-white px-3.5 py-2 text-[12.5px] outline-none"
          >
            <option value="default">Sort: featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
          <label className="flex items-center gap-2 text-[12.5px] text-ink-soft">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="h-4 w-4 accent-ink"
            />
            In stock only
          </label>
        </div>
      </div>

      {browsing ? (
        sections.map((s, i) => (
          <section
            key={s.slug}
            id={s.slug}
            className={[
              "scroll-mt-[64px] px-4 py-12 sm:px-6 md:py-16",
              i % 2 === 1 ? "bg-cream-2" : "",
            ].join(" ")}
          >
            <div className="mx-auto max-w-[1320px]">
              <div className="mb-8 border-b border-line pb-5">
                <span className="eyebrow">
                  {s.items.length} {s.items.length === 1 ? "design" : "designs"}
                </span>
                <h2 className="mt-2.5 font-display text-[clamp(24px,3vw,38px)]">{s.name}</h2>
                <p className="mt-3 max-w-[60ch] text-[15px] text-ink-soft">{s.blurb}</p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
                {s.items.map((l, j) => (
                  <ListingCard key={l.variant.colour + l.product.id} l={l} delay={(j % 4) * 70} priority={i === 0 && j < 4} withFamily={false} />
                ))}
              </div>
            </div>
          </section>
        ))
      ) : (
        <section className="px-4 py-12 sm:px-6 md:py-16">
          <div className="mx-auto max-w-[1320px]">
            <p className="mb-7 text-[12.5px] text-ink-faint">
              {filtered.length} {filtered.length === 1 ? "result" : "results"}
            </p>
            {filtered.length === 0 ? (
              <p className="py-20 text-center text-[13.5px] text-ink-faint">
                Nothing matches &ldquo;{q}&rdquo;. Try a different search.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
                {filtered.map((l, j) => (
                  <ListingCard key={l.variant.colour + l.product.id} l={l} delay={(j % 4) * 70} withFamily />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
