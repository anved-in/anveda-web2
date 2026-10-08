"use client";

import { useEffect, useRef, useState } from "react";
import Link from "@/components/Link";
import { framingStyle, imgSrc, imgSrcSmall, listingPrice, listingTitle, type Listing } from "@/lib/catalog";
import { asset } from "@/lib/site";
import { useCart } from "@/lib/cart";
import Price from "./Price";
import FavButton from "./FavButton";

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

  return (
    <article className={instant ? "group relative" : "reveal group relative"} data-d={delay}>
      <FavButton id={p.id} colour={v.colour} name={title} />
      <Link href={href} className="block">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-cream-2">
          {/* Plain <img>: the site builds to a static export, where the Next
              image optimizer is unavailable. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset(imgSrc(v.image))}
            srcSet={`${asset(imgSrcSmall(v.image))} 480w, ${asset(imgSrc(v.image))} 1000w`}
            sizes="(max-width: 767px) 46vw, (max-width: 1023px) 30vw, 300px"
            alt={`${p.name}${showColour ? ` — ${v.colour}` : ""}`}
            className={`h-full w-full object-cover ${v.zoom && v.zoom !== 1 ? "" : "transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]"}`}
            // An inline transform beats the group-hover Tailwind utility
            // outright (higher specificity, can't compose with it), so a
            // zoomed photo loses the hover micro-effect — a fine trade for
            // not fighting CSS specificity over a decorative detail.
            style={framingStyle(v)}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
          />
          {!v.inStock && (
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/95 px-4 py-3 text-[10px] font-bold uppercase leading-tight tracking-[0.1em] text-ink">
              Sold
              <br />
              out
            </span>
          )}
        </div>
      </Link>

      <div className="px-1 pt-3">
        <Link href={href} className="block truncate text-[13.5px] leading-snug text-ink">
          {title}
        </Link>
        <div className="mt-1 flex items-center justify-between gap-2">
          <Link href={href} className="block">
            <Price price={price} size="sm" muted />
          </Link>
          {v.inStock && (
            <div ref={pickerRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setSizeOpen((o) => !o)}
                aria-label={`Add ${title} to bag`}
                aria-expanded={sizeOpen}
                className="flex h-7 w-7 items-center justify-center text-ink transition-opacity hover:opacity-60"
              >
                {added ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 12.5l5 5L20 6.5" />
                  </svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 7h12l1 13H5L6 7Z" />
                    <path d="M9 7a3 3 0 0 1 6 0" />
                  </svg>
                )}
              </button>

              {sizeOpen && (
                <div className="absolute bottom-[calc(100%+8px)] right-0 z-20 w-max border border-line bg-white p-2.5 shadow-lg">
                  <p className="px-0.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-faint">Size</p>
                  <div className="flex gap-1.5">
                    {v.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => pickSize(s)}
                        className="min-w-[30px] border border-line-strong px-2 py-1 text-[11.5px] font-semibold transition-colors hover:border-ink hover:bg-ink hover:text-cream"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
