"use client";

import { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import ProductBuy from "@/components/ProductBuy";
import Price from "@/components/Price";
import FavButton from "@/components/FavButton";
import { imgSrc, inr, variantPrice, packCount, colourLabel, framingStyle, ALL_SIZES, type Product, type Variant } from "@/lib/catalog";
import { asset, SITE } from "@/lib/site";
import { SHIPPING_FROM } from "@/lib/shipping";

/**
 * Product page body. A client component because the main photograph has to
 * follow the colour the shopper picks in the buy box — that link is the whole
 * point of having colour variants on one page.
 *
 * `?c=<colour>` preselects a shade, which is how collection grids can still
 * list individual colourways while every one of them lands here.
 */
/** Share button: the phone's own share sheet where there is one, else copy the link. */
function ShareButton({ name, colour }: { name: string; colour: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = new URL(window.location.href);
    url.searchParams.set("c", colour);
    const data = { title: name, text: `${name} — ANVEDA`, url: url.toString() };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* the shopper closed the share sheet */
    }
  }
  return (
    <button
      type="button"
      onClick={share}
      aria-label={`Share ${name}`}
      className="relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center border border-line-strong transition-colors hover:border-ink"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 15V3.5M7.5 8 12 3.5 16.5 8M5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-6.5" />
      </svg>
      {copied && (
        <span className="absolute right-0 top-[calc(100%+4px)] z-20 whitespace-nowrap bg-ink px-2 py-1 text-[10px] text-white">
          Link copied
        </span>
      )}
    </button>
  );
}

export default function ProductView({ p }: { p: Product }) {
  const wanted = useSearchParams().get("c") ?? "";
  // Keyed on the colour in the address: opening a different colour of the
  // design you are already on (from favourites, say) changes only the URL, and
  // without a fresh mount the page would keep showing the old shade.
  return <ProductViewInner key={wanted} p={p} wanted={wanted || undefined} />;
}

function Info({ p, variant }: { p: Product; variant: Variant }) {
  return (
    <>
      <p className="text-[13px] leading-relaxed text-ink-faint">{p.story}</p>
      <dl className="mt-4 border-t border-line">
        {[
          ["Colour", colourLabel(p, variant)],
          ...(packCount(p, variant)
            ? [["In each set", packCount(p, variant) as string] as [string, string]]
            : []),
          ["Sizes", ALL_SIZES.join(" · ")],
          ["Delivery", `All India by ${SITE.courier} · from ${inr(SHIPPING_FROM)}`],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-line py-2.5">
            <dt className="text-[11.5px] uppercase tracking-[0.12em] text-ink-soft">{k}</dt>
            <dd className="text-right text-[13px] font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">
        <strong className="font-semibold text-ink">Not sure about your size?</strong>{" "}
        <a
          href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
            `Hi ANVEDA! I need help with sizing for ${p.name} (${colourLabel(p, variant)}).`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          Ask on WhatsApp
        </a>
      </p>
    </>
  );
}

function ProductViewInner({ p, wanted }: { p: Product; wanted?: string }) {
  const initial =
    p.variants.find(
      (v) => v.colour.toLowerCase() === (wanted ?? "").toLowerCase(),
    ) ?? p.variants[0];

  const [variant, setVariant] = useState<Variant>(initial);
  // Phone: the photo and the design's details are two panels of one box; a
  // sideways swipe (or the chip in the corner) flips between them.
  const [panel, setPanel] = useState<0 | 1>(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchEnd = (e: React.TouchEvent) => {
    const t = touch.current;
    touch.current = null;
    if (!t) return;
    const dx = e.changedTouches[0].clientX - t.x;
    const dy = e.changedTouches[0].clientY - t.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) setPanel(dx < 0 ? 1 : 0);
  };

  return (
    <div className="flex flex-wrap gap-y-4 md:gap-y-8">
      <div className="w-full md:w-[55%] md:pr-10 lg:w-[58%]">
        <div
          className="relative aspect-square overflow-hidden bg-cream-2"
          onTouchStart={(e) => {
            touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="flex h-full w-full transition-transform duration-300 ease-out md:!transform-none"
            style={{ transform: `translateX(${panel * -100}%)` }}
          >
            <div className="relative h-full w-full shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={variant.image}
                src={asset(imgSrc(variant.image))}
                alt={`${p.name} — ${colourLabel(p, variant)}`}
                className="h-full w-full object-cover"
                style={framingStyle(variant)}
                fetchPriority="high"
                decoding="async"
              />
              <FavButton
                id={p.id}
                colour={variant.colour}
                name={`${p.name} — ${colourLabel(p, variant)}`}
              />
            </div>
            <div className="h-full w-full shrink-0 overflow-y-auto bg-white p-4 md:hidden">
              <Info p={p} variant={variant} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPanel(panel === 0 ? 1 : 0)}
            className="absolute bottom-2.5 right-2.5 z-10 cursor-pointer bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink md:hidden"
          >
            {panel === 0 ? "Details ›" : "‹ Photo"}
          </button>
        </div>

        {/* Thumbnail strip: the colour picker now lives here, directly under
            the photo it controls, instead of in the buy box further down —
            picking a shade updates a big image right there, no scroll
            needed to see the result. The buy box's own swatch picker is
            gone (see the note in <ProductBuy>) so this is the only one;
            having both asked the same question twice, one scroll apart. */}
        {p.variants.length > 1 && (
          <div className="no-bar mt-3 flex gap-2.5 overflow-x-auto">
            {p.variants.map((v) => {
              const on = v.colour === variant.colour;
              return (
                <button
                  key={v.colour}
                  type="button"
                  onClick={() => setVariant(v)}
                  aria-pressed={on}
                  aria-label={colourLabel(p, v)}
                  title={colourLabel(p, v)}
                  className="flex w-[72px] shrink-0 cursor-pointer flex-col items-stretch gap-1 text-left"
                >
                  <span
                    className={[
                      "relative block h-[72px] w-[72px] overflow-hidden border-2 transition-colors",
                      on ? "border-ink" : "border-transparent",
                    ].join(" ")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset(imgSrc(v.image))}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                      style={framingStyle(v)}
                    />
                    {!v.inStock && (
                      <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-[8px] font-bold uppercase tracking-[0.06em] text-ink">
                        Sold
                      </span>
                    )}
                  </span>
                  {/* The shade's name, tiny, under its photo (8px, as asked): at most two
                      short lines, so a long name never makes the strip uneven. */}
                  <span
                    className={[
                      "line-clamp-2 break-words text-center text-[8px] leading-[1.2]",
                      on ? "font-semibold text-ink" : "text-ink-soft",
                    ].join(" ")}
                  >
                    {colourLabel(p, v)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="w-full md:w-[45%] lg:w-[42%]">
        {/* Collection eyebrow removed — it repeated the product name itself
            in the common case (a design that IS its collection, e.g.
            "Intricate Glass Bangle"), reading as the same line twice before
            anything else loaded. The collection stays reachable from the
            shop page's own nav. */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-[clamp(28px,3.6vw,44px)]">{p.name}</h1>
          <div className="flex gap-2">
            <ShareButton name={p.name} colour={variant.colour} />
            <FavButton
              id={p.id}
              colour={variant.colour}
              name={`${p.name} — ${colourLabel(p, variant)}`}
              variant="inline"
            />
          </div>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2 md:mt-4">
          <Price price={variantPrice(p, variant)} size="lg" />
          <span className="badge-sale">20% off</span>
        </div>

        <ProductBuy p={p} variant={variant} />

        <div className="mt-8 hidden md:block">
          <Info p={p} variant={variant} />
        </div>
      </div>
    </div>
  );
}
