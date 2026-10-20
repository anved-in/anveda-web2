"use client";

import { useEffect, useRef, useState } from "react";
import Link from "@/components/Link";
import { sizesOfProduct, inr, framingStyle, imgSrc, imgSrcSmall, listingPrice, listingTitle, sizeState, type Listing } from "@/lib/catalog";
import { asset } from "@/lib/site";
import { useCart } from "@/lib/cart";
import Price from "./Price";
import FavButton from "./FavButton";
import NotifyMe from "./NotifyMe";
import { ratingFor } from "@/lib/reviews";

/**
 * Grid tile for one colourway: a plain square photo, then the name small,
 * the price below it, and a bag icon that quick-adds without leaving the
 * grid. A size still has to be chosen — a defaulted size is the commonest
 * cause of a wrong-size delivery (see ProductBuy) — so the bag icon opens a
 * small inline size picker instead of skipping that choice.
 *
 * Deliberately nothing else under the photo. Pack size ("dozen", "set of 2")
 * is never shown anywhere on the storefront: it made the grid read as a
 * wholesale list rather than a shop.
 */
export default function ListingCard({
  l,
  delay = 0,
  priority = false,
  withFamily = true,
  instant = false,
}: {
  l: Listing;
  delay?: number;
  priority?: boolean;
  /** false on a collection page, where the heading already names the family. */
  withFamily?: boolean;
  /** True when this card is mounted after a client-side action (e.g. a
   *  search/filter toggle) rather than the initial page load. The site's
   *  scroll-reveal observer (Reveal.tsx) only re-scans on navigation, so a
   *  .reveal card added later would never be observed and stay invisible —
   *  this skips the fade-in entirely and renders it already visible. */
  instant?: boolean;
}) {
  const { product: p, variant: v, href } = l;
  const showColour = p.variants.length > 1;
  const price = listingPrice(l);
  const title = listingTitle(p, v, withFamily);

  const { add } = useCart();
  const [sizeOpen, setSizeOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sizeOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setSizeOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [sizeOpen]);

  const pickSize = (size: string) => {
    add(p.id, size, 1, v.colour);
    setSizeOpen(false);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const rating = ratingFor(p.id);

  return (
    <article
      className={`${instant ? "group relative" : "reveal group relative"} flex h-full flex-col rounded-[20px] bg-white p-2 shadow-[0_2px_14px_rgba(0,0,0,0.07)]`}
      data-d={delay}
    >
      <FavButton id={p.id} colour={v.colour} name={title} />
      <Link href={href} className="block">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-cream-2">
          {/* Plain <img>: the site builds to a static export, where the Next
              image optimizer is unavailable. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset(imgSrc(v.image))}
            srcSet={`${asset(imgSrcSmall(v.image))} 480w, ${asset(imgSrc(v.image))} 1000w`}
            sizes="(max-width: 767px) 46vw, (max-width: 1023px) 30vw, 300px"
            alt={`${p.name}${showColour ? ` — ${v.colour}` : ""}`}
            className={`h-full w-full object-cover ${v.inStock ? "" : "grayscale"} ${v.zoom && v.zoom !== 1 ? "" : "transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]"}`}
            // An inline transform beats the group-hover Tailwind utility
            // outright (higher specificity, can't compose with it), so a
            // zoomed photo loses the hover micro-effect — a fine trade for
            // not fighting CSS specificity over a decorative detail.
            style={framingStyle(v)}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
          />
          {!v.inStock && (
            <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 whitespace-nowrap bg-ink py-2 text-center font-bold uppercase text-white text-[11px] tracking-[0.18em]">
              Sold out
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3">
        <Link href={href} className="line-clamp-2 text-[15px] leading-snug text-ink">
          {title}
        </Link>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <Link href={href} className="block">
            <Price price={price} size="lg" />
          </Link>
          {/* Stars appear only for designs that really have customer reviews. */}
          {rating && (
            <span className="flex shrink-0 items-center gap-1 text-[12.5px] text-ink-soft" aria-label={`Rated ${rating.avg.toFixed(1)} out of 5 from ${rating.count} review${rating.count > 1 ? "s" : ""}`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#c9a24b" aria-hidden="true">
                <path d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.7l1.3-6.6L2.5 9.5l6.6-.8L12 2.5Z" />
              </svg>
              {rating.avg.toFixed(1)} <span className="text-ink-faint">({rating.count})</span>
            </span>
          )}
        </div>

        <div className="mt-auto pt-3">
          {v.inStock ? (
            // One big rounded button. Tapping it asks for the size, in a small panel just above it.
            <div ref={pickerRef} className="relative">
              <button
                type="button"
                onClick={() => setSizeOpen((o) => !o)}
                aria-label={`Add ${title} to bag, ${inr(price)}`}
                aria-expanded={sizeOpen}
                className="relative flex h-12 w-full cursor-pointer items-center justify-center rounded-2xl bg-ink whitespace-nowrap pl-2 pr-9 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90"
              >
                {added ? (
                  "Added ✓"
                ) : (
                  <>
                    Add to bag
                    <svg className="absolute right-4" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M6 7h12l1 13H5L6 7Z" />
                      <path d="M9 7a3 3 0 0 1 6 0" />
                    </svg>
                  </>
                )}
              </button>

              {sizeOpen && (
                <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-20 rounded-2xl border border-line bg-white p-3 shadow-lg">
                  <p className="px-0.5 pb-2 text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-faint">Choose a size</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sizesOfProduct(p).map((s) => {
                      const st = sizeState(v, s);
                      const gone = st !== "ok";
                      if (gone) {
                        // not available: open the product on that size, where "Notify me" is offered
                        return (
                          <Link
                            key={s}
                            href={`${href}${href.includes("?") ? "&" : "?"}size=${encodeURIComponent(s)}`}
                            aria-label={`Size ${s}, not available: tap to be notified`}
                            className="min-w-[38px] rounded-lg border border-line bg-cream-2 px-2 py-2 text-center text-[12.5px] font-semibold text-ink-soft/60 line-through transition-colors hover:border-ink"
                          >
                            {s}
                          </Link>
                        );
                      }
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => pickSize(s)}
                          aria-label={`Size ${s}`}
                          className="min-w-[38px] rounded-lg border border-line-strong px-2 py-2 text-[12.5px] font-semibold transition-colors hover:border-ink hover:bg-ink hover:text-cream"
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // sold out: there is nothing to add, so the same-sized rounded button says "Notify me" instead
            <NotifyMe
              variantId={v.id}
              label={title}
              className="relative flex h-12 w-full cursor-pointer items-center justify-center rounded-2xl border border-ink bg-white whitespace-nowrap pl-2 pr-9 text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-white"
              icon={
                <svg className="absolute right-4" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              }
            />
          )}
        </div>
      </div>
    </article>
  );
}
