"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ListingCard from "./ListingCard";
import { listingPrice, listingTitle, sizeState, ALL_SIZES, SIZE_GUIDE, type Listing } from "@/lib/catalog";

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

/** The four filter buttons share one look. Phone: plain text. Computer: equal-height squared buttons (like the size chips). */
const CHIP = "flex items-center gap-1 whitespace-nowrap text-[12px] font-semibold transition-colors md:h-10 md:gap-2 md:border md:px-4 md:text-[11.5px] md:uppercase md:tracking-[0.12em]";
const CHIP_OFF = "text-ink-soft md:border-line-strong md:bg-white md:text-ink md:hover:border-ink";
const CHIP_ON = "text-ink md:border-ink md:bg-ink md:text-cream";
const Caret = ({ open }: { open: boolean }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" className={open ? "rotate-180" : ""}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/**
 * A dropdown panel rendered into document.body instead of in place, so it
 * can never get clipped by a scrolling/overflow ancestor and can be clamped
 * to the viewport instead of running off the right edge of a narrow phone.
 * Positioned from the trigger's own bounding rect.
 */
function DropdownPortal({
  anchorRef,
  children,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}) {
  const PANEL_W = 220;
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const left = Math.min(r.left, window.innerWidth - PANEL_W - 8);
    setPos({ top: r.bottom + 6, left: Math.max(8, left) });
  }, [anchorRef]);
  if (!pos) return null;
  return createPortal(
    <div data-shop-dropdown style={{ position: "fixed", top: pos.top, left: pos.left, width: PANEL_W }} className="z-20 border border-line bg-white py-1.5 shadow-lg">
      {children}
    </div>,
    document.body,
  );
}

/**
 * Wraps the group page's sectioned listing in an Amazon/Flipkart-style
 * toolbar: dropdown pills for Size (several can be ticked), Sort and Price (the left rail is already the
 * site's category navigator — ShopShell — so a second sidebar would fight
 * it for space; pills are the pattern both reference sites actually use for
 * everything past the primary category nav), plus a plain search box and an
 * in-stock toggle pill. With nothing touched, this renders the exact
 * sectioned layout the server already produced.
 */
export default function ShopBrowser({
  sections,
  header,
}: {
  sections: ShopSection[];
  /** Extra content rendered inside this toolbar's own sticky wrapper, above
   *  the toolbar row — e.g. the group-switcher tabs and collection jump
   *  chips on mobile. Two independently-sticky elements both targeting the
   *  same `top` would overlap once both are stuck instead of stacking (the
   *  second would need `top` offset by the first's height, which isn't knowable
   *  here); putting them inside ONE sticky container sidesteps that
   *  entirely — they just stack in normal flow and move as one unit. */
  header?: React.ReactNode;
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("featured");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceBand, setPriceBand] = useState<number | null>(null); // index into buckets, null = any
  // Sizes ticked in the Size menu (any number). A colourway is kept when it can be bought in AT LEAST ONE ticked size.
  const [sizes, setSizes] = useState<string[]>([]);
  const [openMenu, setOpenMenu] = useState<"sort" | "price" | "size" | null>(null);
  // Once any control has been touched, every subsequent render — including
  // returning to the sectioned view via "Clear filters" — mounts fresh
  // .reveal cards the page's scroll observer never gets to see (it only
  // re-scans on navigation). After the first touch, cards render instantly
  // visible instead of relying on that observer; see ListingCard's `instant`.
  const [touched, setTouched] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const sortBtnRef = useRef<HTMLButtonElement>(null);
  const priceBtnRef = useRef<HTMLButtonElement>(null);
  const sizeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      // a click inside an open menu panel (it lives in <body>, outside the bar) is not "outside": the Size menu stays open while several sizes are ticked
      if (t.closest?.("[data-shop-dropdown]")) return;
      if (barRef.current && !barRef.current.contains(t)) setOpenMenu(null);
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
  const activeCount = (q.trim() ? 1 : 0) + (sizes.length ? 1 : 0) + (sort !== "featured" ? 1 : 0) + (priceBand !== null ? 1 : 0) + (inStockOnly ? 1 : 0);
  const browsing = q.trim() === "" && sort === "featured" && !inStockOnly && priceBand === null && sizes.length === 0;

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
    // a size counts only if the colourway is made in it AND has pieces left in it
    if (sizes.length) items = items.filter((l) => sizes.some((z) => sizeState(l.variant, z) === "ok"));
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
  }, [all, q, sort, inStockOnly, priceBand, sizes, buckets]);

  return (
    <>
      {/* top must match the real header height exactly (56px on phones,
          64px from md: up — see Header.tsx's own h-[56px] md:h-[64px]), or
          there's a gap between the fixed header and this sticky bar where
          page content shows through while scrolling. A flat top-[64px] here
          previously left an 8px gap on every phone.
          z-30, not z-10: a product card's favourite heart and its quick-add
          size popup are both z-10/z-20 (ListingCard/FavButton), and at a tie
          the later-painted DOM element wins regardless of visual intent —
          so as a card scrolled under this bar, its heart (later in the DOM)
          rendered on top of the bar instead of being covered by it. This bar
          needs to unambiguously outrank anything that scrolls underneath it. */}
      <div ref={barRef} className="sticky top-[56px] z-30 border-b border-line bg-cream/95 backdrop-blur-sm md:top-[64px]">
        {header}
        {/* Everything here must fit one row with no horizontal scroll, even on
            a narrow phone — search collapses to an icon that expands in place
            (replacing the other controls while open) instead of claiming
            width permanently, and every pill drops its selected-value suffix
            on the label so the row stays short regardless of what's chosen. */}
        {/*
          The toolbar. Phone (< md): the compact one-row version with plain text controls separated by thin rules, as before.
          Computer (md and up): ONE row aligned to the same left and right edges as the product grid below it:
            search field on the left (a real bordered input, 300px, not a stretching line), the four filters on the right as
            equal-height squared buttons that match the site's size chips. A filter that is switched on turns solid ink so you
            can see at a glance what is narrowing the list, and "Clear all" appears beside them. If the window is narrow the
            filters drop to their own line rather than squeezing.
        */}
        <div className="mx-auto flex max-w-[1320px] items-center px-3 py-3 sm:px-6 md:flex-wrap md:justify-between md:gap-x-5 md:gap-y-3 md:py-4">
          {/* ------------------------------------------------------------ search */}
          <div className="flex min-w-0 flex-1 items-center gap-1.5 md:h-10 md:w-[300px] md:flex-none md:gap-2.5 md:border md:border-line-strong md:bg-white md:px-3.5 md:transition-colors md:focus-within:border-ink">
            <svg className="shrink-0 text-ink-faint" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
              placeholder="Search designs or colours"
              aria-label="Search designs"
              className="min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-[13.5px] text-ink outline-none placeholder:text-ink-faint [&::-webkit-search-cancel-button]:hidden"
            />
            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setTouched(true);
                }}
                aria-label="Clear search"
                className="shrink-0 text-ink-faint transition-colors hover:text-ink"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            )}
          </div>

          <span className="mx-2.5 h-4 w-px shrink-0 bg-line-strong sm:mx-3.5 md:hidden" aria-hidden="true" />

          {/* ------------------------------------------------------------ filters */}
          <div className="flex shrink-0 items-center md:flex-wrap md:gap-2">
            {/* ---- size (pick several) */}
            <div className="relative shrink-0">
              <button
                ref={sizeBtnRef}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenu((m) => (m === "size" ? null : "size"));
                }}
                aria-expanded={openMenu === "size"}
                aria-haspopup="true"
                className={[CHIP, sizes.length ? CHIP_ON : CHIP_OFF].join(" ")}
              >
                Size
                {sizes.length > 0 && (
                  <span className="flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-ink px-1 text-[9px] font-bold leading-none text-cream md:bg-cream md:text-ink" aria-label={`${sizes.length} sizes chosen`}>
                    {sizes.length}
                  </span>
                )}
                <Caret open={openMenu === "size"} />
              </button>
              {openMenu === "size" && (
                <DropdownPortal anchorRef={sizeBtnRef}>
                  <p className="px-4 pb-1.5 pt-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-faint">Choose one or more</p>
                  {ALL_SIZES.map((z) => {
                    const on = sizes.includes(z);
                    const g = SIZE_GUIDE.find((x) => x.size === z);
                    return (
                      <button
                        key={z}
                        type="button"
                        role="menuitemcheckbox"
                        aria-checked={on}
                        onClick={() => {
                          setSizes((cur) => (cur.includes(z) ? cur.filter((x) => x !== z) : [...cur, z]));
                          setTouched(true);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] transition-colors hover:bg-cream-2"
                      >
                        <span
                          className={["flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[3px] border transition-colors", on ? "border-ink bg-ink" : "border-line-strong"].join(" ")}
                          aria-hidden="true"
                        >
                          {on && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 12.5l5 5L20 6.5" />
                            </svg>
                          )}
                        </span>
                        <span className={on ? "font-semibold text-ink" : "text-ink"}>{z}</span>
                        {g && <span className="ml-auto text-[11px] text-ink-faint">{g.label}</span>}
                      </button>
                    );
                  })}
                  {sizes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSizes([]);
                        setTouched(true);
                      }}
                      className="mt-1 block w-full border-t border-line px-4 py-2.5 text-left text-[12.5px] font-semibold text-ink underline underline-offset-2"
                    >
                      Clear sizes
                    </button>
                  )}
                </DropdownPortal>
              )}
            </div>

            <span className="mx-2.5 h-4 w-px shrink-0 bg-line-strong sm:mx-3.5 md:hidden" aria-hidden="true" />

            {/* ---- sort */}
            <div className="relative shrink-0">
              <button
                ref={sortBtnRef}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenu((m) => (m === "sort" ? null : "sort"));
                }}
                aria-expanded={openMenu === "sort"}
                className={[CHIP, sort !== "featured" ? CHIP_ON : CHIP_OFF].join(" ")}
              >
                Sort
                <Caret open={openMenu === "sort"} />
              </button>
              {openMenu === "sort" && (
                <DropdownPortal anchorRef={sortBtnRef}>
                  {(Object.keys(SORT_LABEL) as Sort[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        setSort(k);
                        setOpenMenu(null);
                        setTouched(true);
                      }}
                      className={[
                        "flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] transition-colors hover:bg-cream-2",
                        sort === k ? "font-semibold text-ink" : "text-ink-soft",
                      ].join(" ")}
                    >
                      {SORT_LABEL[k]}
                      {sort === k && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                          <path d="M4 12.5l5 5L20 6.5" />
                        </svg>
                      )}
                    </button>
                  ))}
                </DropdownPortal>
              )}
            </div>

            <span className="mx-2.5 h-4 w-px shrink-0 bg-line-strong sm:mx-3.5 md:hidden" aria-hidden="true" />

            {/* ---- price */}
            <div className="relative shrink-0">
              <button
                ref={priceBtnRef}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenu((m) => (m === "price" ? null : "price"));
                }}
                aria-expanded={openMenu === "price"}
                className={[CHIP, priceBand !== null ? CHIP_ON : CHIP_OFF].join(" ")}
              >
                Price
                <Caret open={openMenu === "price"} />
              </button>
              {openMenu === "price" && (
                <DropdownPortal anchorRef={priceBtnRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setPriceBand(null);
                      setOpenMenu(null);
                      setTouched(true);
                    }}
                    className={["block w-full px-4 py-2.5 text-left text-[13px] transition-colors hover:bg-cream-2", priceBand === null ? "font-semibold text-ink" : "text-ink-soft"].join(" ")}
                  >
                    Any price
                  </button>
                  {buckets.map((bk, i) => (
                    <button
                      key={bk.label}
                      type="button"
                      onClick={() => {
                        setPriceBand(i);
                        setOpenMenu(null);
                        setTouched(true);
                      }}
                      className={["block w-full px-4 py-2.5 text-left text-[13px] transition-colors hover:bg-cream-2", priceBand === i ? "font-semibold text-ink" : "text-ink-soft"].join(" ")}
                    >
                      {bk.label}
                    </button>
                  ))}
                </DropdownPortal>
              )}
            </div>

            <span className="mx-2.5 h-4 w-px shrink-0 bg-line-strong sm:mx-3.5 md:hidden" aria-hidden="true" />

            {/* ---- in-stock toggle */}
            <button
              type="button"
              onClick={() => {
                setInStockOnly((v) => !v);
                setTouched(true);
              }}
              aria-pressed={inStockOnly}
              className={[CHIP, inStockOnly ? CHIP_ON : CHIP_OFF].join(" ")}
            >
              <span
                className={["flex h-[13px] w-[13px] shrink-0 items-center justify-center rounded-[3px] border transition-colors", inStockOnly ? "border-ink bg-ink md:border-cream md:bg-cream" : "border-line-strong"].join(" ")}
                aria-hidden="true"
              >
                {inStockOnly && (
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" className="stroke-white md:stroke-ink" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12.5l5 5L20 6.5" />
                  </svg>
                )}
              </span>
              In stock
            </button>

            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setSizes([]);
                  setSort("featured");
                  setPriceBand(null);
                  setInStockOnly(false);
                  setOpenMenu(null);
                  setTouched(true);
                }}
                className="ml-1 hidden h-10 items-center px-2 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-ink underline underline-offset-4 transition-colors hover:text-maroon md:inline-flex"
              >
                Clear all
              </button>
            )}
          </div>
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
                {/* Design count and blurb dropped on mobile — the range
                    name alone is enough once it's reached by scrolling or
                    the jump-chips above, and cutting the extra two lines
                    per section keeps the feed moving. Desktop keeps both. */}
                <span className="eyebrow hidden lg:inline-block">
                  {s.items.length} {s.items.length === 1 ? "design" : "designs"}
                </span>
                <h2 className="font-display text-[clamp(24px,3vw,38px)] lg:mt-2.5">{s.name}</h2>
                <p className="mt-3 hidden max-w-[60ch] text-[13px] text-ink-soft lg:block">{s.blurb}</p>
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
                  <ListingCard
                    key={l.variant.colour + l.product.id}
                    l={sizes.length === 1 ? { ...l, href: `${l.href}${l.href.includes("?") ? "&" : "?"}size=${encodeURIComponent(sizes[0])}` } : l}
                    withFamily
                    instant
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
