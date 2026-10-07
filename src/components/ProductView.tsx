"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductBuy from "@/components/ProductBuy";
import Price from "@/components/Price";
import FavButton from "@/components/FavButton";
import { imgSrc, inr, variantPrice, packCount, colourLabel, ALL_SIZES, type Product, type Variant } from "@/lib/catalog";
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
export default function ProductView({ p }: { p: Product }) {
  const wanted = useSearchParams().get("c") ?? "";
  // Keyed on the colour in the address: opening a different colour of the
  // design you are already on (from favourites, say) changes only the URL, and
  // without a fresh mount the page would keep showing the old shade.
  return <ProductViewInner key={wanted} p={p} wanted={wanted || undefined} />;
}

function ProductViewInner({ p, wanted }: { p: Product; wanted?: string }) {
  const initial =
    p.variants.find(
      (v) => v.colour.toLowerCase() === (wanted ?? "").toLowerCase(),
    ) ?? p.variants[0];

  const [variant, setVariant] = useState<Variant>(initial);

  return (
    <div className="flex flex-wrap gap-y-8">
      <div className="w-full md:w-[55%] md:pr-10 lg:w-[58%]">
        <div className="relative aspect-square overflow-hidden bg-cream-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={variant.image}
            src={asset(imgSrc(variant.image))}
            alt={`${p.name} — ${colourLabel(p, variant)}`}
            className="h-full w-full object-cover"
            style={{
              ...(variant.focal ? { objectPosition: variant.focal } : undefined),
              ...(variant.zoom && variant.zoom !== 1 ? { transform: `scale(${variant.zoom})` } : undefined),
            }}
            fetchPriority="high"
            decoding="async"
          />
          <FavButton
            id={p.id}
            colour={variant.colour}
            name={`${p.name} — ${colourLabel(p, variant)}`}
          />
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
                  className={[
                    "relative h-[72px] w-[72px] shrink-0 cursor-pointer overflow-hidden border-2 transition-colors",
                    on ? "border-ink" : "border-transparent hover:border-line-strong",
                  ].join(" ")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset(imgSrc(v.image))}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    style={{
                      ...(v.focal ? { objectPosition: v.focal } : undefined),
                      ...(v.zoom && v.zoom !== 1 ? { transform: `scale(${v.zoom})` } : undefined),
                    }}
                  />
                  {!v.inStock && (
                    <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-[8px] font-bold uppercase tracking-[0.06em] text-ink">
                      Sold
                    </span>
                  )}
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
          <FavButton
            id={p.id}
            colour={variant.colour}
            name={`${p.name} — ${colourLabel(p, variant)}`}
            variant="inline"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <Price price={variantPrice(p, variant)} size="lg" />
          <span className="badge-sale">20% off</span>
        </div>

        <p className="mt-5 text-[13px] leading-relaxed text-ink-faint">{p.story}</p>

        <ProductBuy p={p} variant={variant} />

        <dl className="mt-9 border-t border-line">
          {[
            ["Colour", colourLabel(p, variant)],
            ...(packCount(p, variant)
              ? [["In each set", packCount(p, variant) as string] as [string, string]]
              : []),
            ["Sizes", ALL_SIZES.join(" · ")],
            ["Delivery", `All India by ${SITE.courier} · from ${inr(SHIPPING_FROM)}`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-line py-3.5">
              <dt className="text-[12.5px] uppercase tracking-[0.12em] text-ink-soft">
                {k}
              </dt>
              <dd className="text-right text-[13.5px] font-medium">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 bg-cream-2 p-5">
          <p className="text-[13.5px] leading-relaxed text-ink-soft">
            <strong className="font-semibold text-ink">
              Not sure about your size?
            </strong>{" "}
            Message us on WhatsApp and we will help you measure in under a minute.
          </p>
          <a
            href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
              `Hi ANVEDA! I need help with sizing for ${p.name} (${colourLabel(p, variant)}).`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block border border-ink px-6 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.16em] transition-colors hover:bg-ink hover:text-cream"
          >
            Ask on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
