"use client";

import Link from "@/components/Link";
import { useEffect, useState } from "react";
import { useFavs } from "@/lib/favourites";
import { useCart } from "@/lib/cart";
import {
  productById,
  framingStyle,
  imgSrc,
  inr,
  variantPrice,
  colourLabel,
  packLabel,
  ALL_SIZES,
  type Product,
  type Variant,
} from "@/lib/catalog";
import { asset } from "@/lib/site";

/**
 * Favourites, shown the way the bag is: a panel that slides in from the right
 * over a dimmed page, opened from the header or the tab bar.
 *
 * A favourite is saved WITHOUT a size (asking at the heart tap would add
 * friction to a one-tap action, and people often save before they know their
 * size). The size is chosen here instead, in place, so buying from favourites
 * does not cost a trip back to the product page. No size is preselected, as
 * everywhere else on the site, and "Move to bag" stays disabled until one is
 * picked.
 */
export default function FavDrawer() {
  const { open, setOpen, favs, count } = useFavs();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={[
          "fixed inset-0 z-[70] bg-espresso/45 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your favourites"
        aria-hidden={!open}
        inert={!open}
        className={[
          "fixed right-0 top-0 z-[80] flex h-[100dvh] w-full max-w-[420px] flex-col bg-cream transition-transform duration-300",
          open ? "translate-x-0 shadow-2xl" : "translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="font-display text-[22px]">
            Favourites{count > 0 && <span className="text-ink-soft"> ({count})</span>}
          </h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close favourites" className="p-1.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>

        {favs.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <p className="text-ink-soft">
              Nothing saved yet. Tap the heart on any bangle to keep it here.
            </p>
            <Link
              href="/shop/glass/"
              onClick={() => setOpen(false)}
              className="mt-6 border border-ink px-7 py-3.5 text-[11.5px] font-bold uppercase tracking-[0.2em] transition-colors hover:bg-ink hover:text-cream"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6">
            {favs.map((f) => {
              const p = productById(f.id);
              const v = p?.variants.find((x) => x.colour === f.colour);
              if (!p || !v) return null;
              return <FavRow key={`${f.id}__${f.colour}`} p={p} v={v} />;
            })}
          </div>
        )}

        {favs.length > 0 && (
          <div className="border-t border-line px-6 py-5">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full py-2 text-[11.5px] uppercase tracking-[0.16em] text-ink-soft hover:text-ink"
            >
              Continue shopping
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

function FavRow({ p, v }: { p: Product; v: Variant }) {
  const { remove, setOpen: setFavOpen } = useFavs();
  const { add } = useCart();
  // Chosen here, per row, and deliberately not stored with the favourite.
  const [size, setSize] = useState<string | null>(null);

  const href = `/product/${p.id}/?c=${encodeURIComponent(v.colour)}`;
  const pack = packLabel(p, v);

  const moveToBag = () => {
    if (!size || !v.inStock) return;
    add(p.id, size, 1, v.colour);
    remove(p.id, v.colour);
  };

  return (
    <div className="relative flex gap-4 border-b border-line py-5 pr-8">
      {/* Top-right of the item, not the photo: the row is the "item", and a
          corner on the photo alone would sit oddly beside taller text below it. */}
      <button
        type="button"
        onClick={() => remove(p.id, v.colour)}
        aria-label={`Remove ${p.name} — ${colourLabel(p, v)} from favourites`}
        className="absolute right-0 top-5 flex h-7 w-7 cursor-pointer items-center justify-center text-ink-faint transition-colors hover:text-ink"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <path d="M5 5l14 14M19 5L5 19" />
        </svg>
      </button>

      <Link
        href={href}
        onClick={() => setFavOpen(false)}
        className="h-[86px] w-[70px] shrink-0 overflow-hidden bg-cream-2"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset(imgSrc(v.image))}
          alt={`${p.name} — ${colourLabel(p, v)}`}
          className="h-full w-full object-cover"
          loading="lazy"
          style={framingStyle(v)}
        />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-[0.16em] text-maroon">
          {p.collectionName}
        </div>
        {/* The name IS the "view" action — a separate View link beside Remove
            just repeated it. */}
        <Link
          href={href}
          onClick={() => setFavOpen(false)}
          className="mt-0.5 block truncate text-[14px] font-semibold hover:text-maroon"
        >
          {p.name}
        </Link>
        <div className="mt-0.5 flex items-baseline justify-between gap-2 text-[12px] text-ink-soft">
          <span className="truncate">
            {colourLabel(p, v)}
            {pack ? ` · ${pack}` : null}
          </span>
          <span className="shrink-0 text-[14px] font-semibold text-ink">
            {inr(variantPrice(p, v))}
          </span>
        </div>

        {v.inStock ? (
          <>
            <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Choose a size">
              {ALL_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  aria-pressed={size === s}
                  className={[
                    "min-w-[40px] cursor-pointer border px-2 py-1.5 text-[12.5px] transition-colors",
                    size === s
                      ? "border-ink bg-ink text-cream"
                      : "border-line-strong bg-white hover:border-ink",
                  ].join(" ")}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={moveToBag}
              disabled={!size}
              className="mt-3 w-full bg-ink py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-cream transition-colors hover:bg-espresso-2 disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-ink-soft"
            >
              Move to bag
            </button>
          </>
        ) : (
          <p className="mt-3 border border-line px-3 py-2 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-ink-soft">
            Sold out
          </p>
        )}
      </div>
    </div>
  );
}
