"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import QtyStepper from "@/components/QtyStepper";
import ProductBuy from "@/components/ProductBuy";
import Price from "@/components/Price";
import FavButton from "@/components/FavButton";
import Stars from "@/components/Stars";
import { soldOutLast, imgSrc, inr, variantPrice, packCount, packLabel, colourLabel, framingStyle, ALL_SIZES, type Product, type Variant } from "@/lib/catalog";
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
      aria-label={`Copy link to ${name}`}
      className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center text-ink transition-opacity hover:opacity-70"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
      </svg>
      {copied && (
        <span className="absolute right-0 top-[calc(100%+4px)] z-20 whitespace-nowrap bg-ink px-2 py-1 text-[10px] text-white">
          Link copied
        </span>
      )}
    </button>
  );
}

export default function ProductView({ p, rating }: { p: Product; rating?: { avg: number; count: number } | null }) {
  const wanted = useSearchParams().get("c") ?? "";
  // Keyed on the colour in the address: opening a different colour of the
  // design you are already on (from favourites, say) changes only the URL, and
  // without a fresh mount the page would keep showing the old shade.
  return <ProductViewInner key={wanted} p={p} wanted={wanted || undefined} rating={rating} />;
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

const POPUP_IDLE_MS = 15000;

/**
 * The "i" popup on the photo: a small card with the design's details. It
 * closes from the X, from a tap outside, from Escape, and by itself after
 * 15 seconds without the shopper touching it.
 */
function InfoPopup({ p, variant, onClose }: { p: Product; variant: Variant; onClose: () => void }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arm = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(onClose, POPUP_IDLE_MS);
  };
  useEffect(() => {
    arm();
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener("keydown", key);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-label={`About ${p.name}`}
        onTouchStart={(e) => { e.stopPropagation(); arm(); }}
        onTouchEnd={(e) => e.stopPropagation()}
        onPointerDown={arm}
        onScroll={arm}
        className="absolute right-2.5 top-12 z-50 max-h-[calc(100%-60px)] w-[min(88%,320px)] overflow-y-auto bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,0.22)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-1 top-1 flex h-8 w-8 cursor-pointer items-center justify-center text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <div className="pr-6">
          <Info p={p} variant={variant} />
        </div>
      </div>
    </>
  );
}

function ProductViewInner({ p, wanted, rating }: { p: Product; wanted?: string; rating?: { avg: number; count: number } | null }) {
  // In-stock colours first; the strip, the swipe and the default all follow it.
  const ordered = soldOutLast(p.variants, (v) => v.inStock);
  const initial =
    ordered.find(
      (v) => v.colour.toLowerCase() === (wanted ?? "").toLowerCase(),
    ) ?? ordered[0];

  const [variant, setVariant] = useState<Variant>(initial);
  const [qty, setQty] = useState(1);
  const [info, setInfo] = useState(false);
  // First visit on a phone: the photo slides a few pixels sideways once, so the
  // swipe is discoverable. Never repeats (remembered in this browser).
  const [nudge, setNudge] = useState(false);
  useEffect(() => {
    if (p.variants.length < 2) return;
    try {
      if (localStorage.getItem("anveda.swipe.nudged")) return;
      localStorage.setItem("anveda.swipe.nudged", "1");
    } catch {
      return;
    }
    const t = setTimeout(() => setNudge(true), 1200);
    return () => clearTimeout(t);
  }, [p.variants.length]);
  // Swiping the photo moves to the next / previous colour.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const strip = useRef<HTMLDivElement>(null);
  const onTouchEnd = (e: React.TouchEvent) => {
    const t = touch.current;
    touch.current = null;
    if (!t) return;
    const dx = e.changedTouches[0].clientX - t.x;
    const dy = e.changedTouches[0].clientY - t.y;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const i = ordered.findIndex((v) => v.colour === variant.colour);
    const next = ordered[i + (dx < 0 ? 1 : -1)];
    if (next) setVariant(next);
  };
  // Keep the chosen colour's thumbnail in view when a swipe changes it.
  useEffect(() => {
    const box = strip.current;
    const on = box?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (box && on) box.scrollTo({ left: on.offsetLeft - 12, behavior: "smooth" });
  }, [variant]);

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
          <div className={`h-full w-full ${nudge ? "swipe-nudge" : ""}`} onAnimationEnd={() => setNudge(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={variant.image}
              src={asset(imgSrc(variant.image))}
              alt={`${p.name} — ${colourLabel(p, variant)}`}
              className={`h-full w-full object-cover ${variant.inStock ? "" : "grayscale"}`}
              style={framingStyle(variant)}
              fetchPriority="high"
              decoding="async"
            />
          </div>
          {!variant.inStock && (
            <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 whitespace-nowrap bg-ink py-2 text-center font-bold uppercase text-white text-[11px] tracking-[0.18em]">
              Sold out
            </span>
          )}
          {/* Phone: the details sit behind an "i" on the photo (the heart
              lives beside the name). On desktop they are already on the page. */}
          <button
            type="button"
            onClick={() => setInfo((v) => !v)}
            aria-label="About this design"
            aria-expanded={info}
            className={[
              "absolute right-2.5 top-2.5 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-ink shadow-[0_1px_6px_rgba(0,0,0,0.25)] backdrop-blur-[2px] transition-all active:scale-95 md:hidden",
              info ? "bg-white" : "bg-white/80",
            ].join(" ")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="6.6" r="1.7" />
              <rect x="10.6" y="10" width="2.8" height="9" rx="1.4" />
            </svg>
          </button>
          {info && <InfoPopup p={p} variant={variant} onClose={() => setInfo(false)} />}
        </div>

        {/* Thumbnail strip: the colour picker now lives here, directly under
            the photo it controls, instead of in the buy box further down —
            picking a shade updates a big image right there, no scroll
            needed to see the result. The buy box's own swatch picker is
            gone (see the note in <ProductBuy>) so this is the only one;
            having both asked the same question twice, one scroll apart. */}
        {p.variants.length > 1 && (
          <div ref={strip} className="no-bar relative mt-3 flex gap-2.5 overflow-x-auto">
            {ordered.map((v) => {
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
                      className={`h-full w-full object-cover ${v.inStock ? "" : "grayscale"}`}
                      loading="lazy"
                      style={framingStyle(v)}
                    />
                    {!v.inStock && (
                      <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 whitespace-nowrap bg-ink py-1 text-center font-bold uppercase text-white text-[7px] tracking-[0.08em]">
                        Sold out
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
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-[clamp(20px,2.4vw,30px)] leading-tight">{p.name}</h1>
            {rating && (
              <a href="#reviews" className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] text-ink-soft">
                <Stars n={rating.avg} size={12} />
                <span>
                  {rating.avg.toFixed(1)} · {rating.count} review{rating.count > 1 ? "s" : ""}
                </span>
              </a>
            )}
          </div>
          <div className="-mr-2 flex shrink-0 items-center">
            <ShareButton name={p.name} colour={variant.colour} />
            <FavButton
              id={p.id}
              colour={variant.colour}
              name={`${p.name} — ${colourLabel(p, variant)}`}
              variant="inline"
            />
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 md:mt-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <Price price={variantPrice(p, variant)} size="lg" />
              <span className="badge-sale">20% off</span>
            </div>
            {packLabel(p, variant) && (
              <p className="mt-1 text-[11px] text-ink-soft">per {packLabel(p, variant)}</p>
            )}
          </div>
          {variant.inStock && (
            <QtyStepper
              size="sm"
              qty={qty}
              onDecrease={() => setQty((q) => Math.max(1, q - 1))}
              onIncrease={() => setQty((q) => Math.min(99, q + 1))}
            />
          )}
        </div>
        {variant.inStock && (variant.stockQty ?? 0) > 0 && (variant.stockQty ?? 0) <= 3 && (
          <p className="mt-1.5 text-[12px] font-semibold text-[#c0152f]">
            Only {variant.stockQty} left
          </p>
        )}

        <ProductBuy p={p} variant={variant} qty={qty} />

        <div className="mt-8 hidden md:block">
          <Info p={p} variant={variant} />
        </div>
      </div>
    </div>
  );
}
