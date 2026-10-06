"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ListingCard from "./ListingCard";
import { listingPrice, listingTitle, type Listing } from "@/lib/catalog";

export interface ShopSection {
  slug: string;
  name: string;
  blurb: string;
  items: Listing[];
}

type Sort = "featured" | "price-asc" | "price-desc";
const SORT_LABEL: Record<Sort, string> = {
  featured: "Featured",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
};

/** Human-friendly price buckets, Amazon/Flipkart-style — each is an
 *  inclusive-low/exclusive-high band, "Over X" has no top. */
function priceBuckets(all: Listing[]): { label: string; min: number; max: number | null }[] {
  const max = Math.max(1000, ...all.map((l) => listingPrice(l)));
  const step = max <= 1000 ? 250 : max <= 2000 ? 500 : 1000;
  const bands: { label: string; min: number; max: number | null }[] = [];
  for (let lo = 0; lo < max; lo += step) {
    const hi = lo + step;
    bands.push({ label: hi >= max ? `Over ₹${lo}` : `₹${lo} – ₹${hi}`, min: lo, max: hi >= max ? null : hi });
  }
  return bands.slice(0, 4);
}

/**
 * Wraps the group page's sectioned listing in an Amazon/Flipkart-style
 * toolbar: dropdown pills for Sort and Price (the left rail is already the
 * site's category navigator — ShopShell — so a second sidebar would fight
 * it for space; pills are the pattern both reference sites actually use for
 * everything past the primary category nav), plus a plain search box and an
 * in-stock toggle pill. With nothing touched, this renders the exact
 * sectioned layout the server already produced.
 */
export default function ShopBrowser({ sections }: { sections: ShopSection[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("featured");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceBand, setPriceBand] = useState<number | null>(null); // index into buckets, null = any
  const [openMenu, setOpenMenu] = useState<"sort" | "price" | null>(null);
  // Once any control has been touched, every subsequent render — including
  // returning to the sectioned view via "Clear filters" — mounts fresh
  // .reveal cards the page's scroll observer never gets to see (it only
  // re-scans on navigation). After the first touch, cards render instantly
  // visible instead of relying on that observer; see ListingCard's `instant`.
  const [touched, setTouched] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const all = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  const buckets = useMemo(() => priceBuckets(all), [all]);
  const browsing = q.trim() === "" && sort === "featured" && !inStockOnly && priceBand === null;

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
    if (priceBand !== null) {
      const b = buckets[priceBand];
      items = items.filter((l) => {
        const p = listingPrice(l);
        return p >= b.min && (b.max === null || p < b.max);
      });
    }
    if (sort === "price-asc") items = [...items].sort((a, b) => listingPrice(a) - listingPrice(b));
    if (sort === "price-desc") items = [...items].sort((a, b) => listingPrice(b) - listingPrice(a));
    return items;
  }, [all, q, sort, inStockOnly, priceBand, buckets]);

  const activeFilterCount = (inStockOnly ? 1 : 0) + (priceBand !== null ? 1 : 0);

  return (
    <>
      <div ref={barRef} className="sticky top-[64px] z-10 border-b border-line bg-cream/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-2.5 px-4 py-3 sm:px-6">
          <div className="relative min-w-[160px] flex-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
              width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setTouched(true);
              }}
              placeholder="Search this range…"
              aria-label="Search designs"
              className="w-full rounded-full border border-line-strong bg-white py-2 pl-9 pr-4 text-[13px] outline-none transition-colors focus:border-ink"
            />
          </div>

          {/* ---------------------------------------------------------- sort pill */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenu((m) => (m === "sort" ? null : "sort"));
              }}
              aria-expanded={openMenu === "sort"}
              className={[
                "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12.5px] font-semibold transition-colors",
                sort !== "featured" ? "border-ink bg-ink text-cream" : "border-line-strong bg-white text-ink-soft hover:border-ink",
              ].join(" ")}
            >
              Sort: {SORT_LABEL[sort]}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" className={openMenu === "sort" ? "rotate-180" : ""}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {openMenu === "sort" && (
              <div className="absolute left-0 top-[calc(100%+6px)] z-20 w-[220px] border border-line bg-white py-1.5 shadow-lg">
                {(Object.keys(SORT_LABEL) as Sort[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSort(s);
                      setOpenMenu(null);
                      setTouched(true);
                    }}
                    className={[
                      "flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] transition-colors hover:bg-cream-2",
                      sort === s ? "font-semibold text-maroon" : "text-ink-soft",
                    ].join(" ")}
                  >
                    {SORT_LABEL[s]}
                    {sort === s && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                        <path d="M4 12.5l5 5L20 6.5" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* --------------------------------------------------------- price pill */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenu((m) => (m === "price" ? null : "price"));
              }}
              aria-expanded={openMenu === "price"}
              className={[
                "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12.5px] font-semibold transition-colors",
                priceBand !== null ? "border-ink bg-ink text-cream" : "border-line-strong bg-white text-ink-soft hover:border-ink",
              ].join(" ")}
            >
              Price{priceBand !== null ? `: ${buckets[priceBand].label}` : ""}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" className={openMenu === "price" ? "rotate-180" : ""}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {openMenu === "price" && (
              <div className="absolute left-0 top-[calc(100%+6px)] z-20 w-[200px] border border-line bg-white py-1.5 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setPriceBand(null);
                    setOpenMenu(null);
                    setTouched(true);
                  }}
                  className={["block w-full px-4 py-2.5 text-left text-[13px] transition-colors hover:bg-cream-2", priceBand === null ? "font-semibold text-maroon" : "text-ink-soft"].join(" ")}
                >
                  Any price
                </button>
                {buckets.map((b, i) => (
                  <button
                    key={b.label}
                    type="button"
                    onClick={() => {
                      setPriceBand(i);
                      setOpenMenu(null);
                      setTouched(true);
                    }}
                    className={["block w-full px-4 py-2.5 text-left text-[13px] transition-colors hover:bg-cream-2", priceBand === i ? "font-semibold text-maroon" : "text-ink-soft"].join(" ")}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* --------------------------------------------------- in-stock toggle */}
          <button
            type="button"
            onClick={() => {
              setInStockOnly((v) => !v);
              setTouched(true);
            }}
            aria-pressed={inStockOnly}
            className={[
              "rounded-full border px-3.5 py-2 text-[12.5px] font-semibold transition-colors",
              inStockOnly ? "border-ink bg-ink text-cream" : "border-line-strong bg-white text-ink-soft hover:border-ink",
            ].join(" ")}
          >
            In stock only
          </button>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setInStockOnly(false);
                setPriceBand(null);
              }}
              className="text-[12px] font-semibold text-maroon underline underline-offset-2"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {browsing ? (
        sections.map((s, i) => (
          <section
            key={s.slug}
            id={s.slug}
            className={[
              "scroll-mt-[128px] px-4 py-12 sm:px-6 md:py-16",
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
                  <ListingCard key={l.variant.colour + l.product.id} l={l} delay={(j % 4) * 70} priority={i === 0 && j < 4} withFamily={false} instant={touched} />
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
                Nothing matches these filters. Try clearing one.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
                {filtered.map((l) => (
                  <ListingCard key={l.variant.colour + l.product.id} l={l} withFamily instant />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
