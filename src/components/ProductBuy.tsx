"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "@/components/Link";
import QtyStepper from "@/components/QtyStepper";
import NotifyMe from "@/components/NotifyMe";
import { useCart } from "@/lib/cart";
import { inr, variantPrice, colourLabel, sizeLeft, sizeLeftNote, sizeState, ALL_SIZES, sizeInfo, sizesOfProduct, type Product, type Variant } from "@/lib/catalog";

/**
 * The buy box: size, quantity, add to bag. Colour is picked one level up
 * (the thumbnail strip under the photo in <ProductView>) and arrives here
 * as `variant`, already resolved — this component only reads it.
 */
export default function ProductBuy({
  p,
  variant,
  qty,
  setQty,
  actions,
}: {
  p: Product;
  /** Chosen up beside the price in <ProductView>; read here for the total. */
  qty: number;
  /** Desktop shows the −1+ stepper beside the button; phones keep it by the price. */
  setQty: React.Dispatch<React.SetStateAction<number>>;
  /** Heart + link, shown beside the add-to-bag button on desktop. */
  actions?: React.ReactNode;
  /** Controlled by ProductView so the photo, the thumbnails and the line
      that reaches the cart can never disagree about which shade is selected. */
  variant: Variant;
}) {
  // No size preselected on purpose: a defaulted size is the commonest cause of
  // a wrong-size delivery. The customer must choose deliberately.
  // (a size can arrive in the link, e.g. from the shop card's size picker: ?size=2.10)
  const sizeFromLink = useSearchParams().get("size");
  const [size, setSize] = useState<string | null>(() => (sizeFromLink && ALL_SIZES.includes(sizeFromLink) && sizesOfProduct(p).includes(sizeFromLink) ? sizeFromLink : null));
  const sizeRef = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState(false);
  const [added, setAdded] = useState(false);
  const { add, setOpen: setBagOpen } = useCart();
  const left = size ? sizeLeft(variant, size) : null;
  const [overErr, setOverErr] = useState<string | null>(null);

  // A size that cannot be bought stays selectable: choosing it offers "Notify me" instead of "Add to bag".
  const choice = size ? sizeState(variant, size) : null;
  const unavailableChoice = choice !== null && choice !== "ok";
  const showNotify = !variant.inStock || unavailableChoice;
  useEffect(() => {
    setOverErr(null);
  }, [variant, size]);

  const onAdd = () => {
    if (!size) {
      setErr(true);
      // The add button lives in a fixed bar, so the size row may be off screen.
      sizeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (left !== null && qty > left) {
      setOverErr(left <= 0 ? "That size has just sold out." : `Only ${left} left in size ${size}.`);
      return;
    }
    add(p.id, size, qty, variant.colour);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  return (
    <div>
      {/* No colour picker here any more — it now lives as a thumbnail strip
          directly under the main photo in <ProductView>, so picking a shade
          updates a big image right there instead of a small swatch down
          here needing a scroll to see the result. Keeping both would ask
          the same question twice, one scroll apart. */}

      {/* -------------------------------------------------------------- size */}
      <div ref={sizeRef} className="mt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
            Size {size && <span className="text-ink-soft">· {size}</span>}
          </span>
          <Link
            href="/sizing"
            className="text-[11px] text-ink underline underline-offset-2"
          >
            Size guide
          </Link>
        </div>

        {/* flex-1 + min-w-0 on every button, no wrap: all five sizes share
            the row equally instead of a fixed min-width forcing a 3+2 wrap
            on a phone. */}
        <div className="mt-2 flex gap-1.5 md:flex-wrap">
          {sizesOfProduct(p).map((s) => {
            const g = sizeInfo(s);
            const on = size === s;
            const st = sizeState(variant, s);
            const gone = st !== "ok";
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSize(s);
                  setErr(false);
                }}
                aria-pressed={on}
                aria-label={gone ? `Size ${s}, not available: tap to be notified` : `Size ${s}`}
                className={[
                  "min-w-0 flex-1 cursor-pointer border px-1 py-1.5 text-center transition-colors md:w-[60px] md:flex-none md:py-1.5",
                  gone
                    ? on
                      ? "border-ink bg-white text-ink-soft"
                      : "border-line bg-cream-2 text-ink-soft/60 hover:border-ink"
                    : on
                      ? "border-ink bg-ink text-cream"
                      : "border-line-strong bg-white hover:border-ink",
                ].join(" ")}
              >
                <span className={`block text-[11.5px] font-semibold${gone ? " line-through" : ""}`}>{s}</span>
                {gone ? (
                  <span className="block text-[7px] uppercase tracking-[0.05em]">Notify me</span>
                ) : g && (
                  <span
                    className={[
                      "block text-[7px] uppercase tracking-[0.05em]",
                      on ? "text-cream/70" : "text-ink-soft",
                    ].join(" ")}
                  >
                    {g.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {size && left !== null && left > 0 && (
          <p aria-live="polite" className="mt-2 text-[12.5px] font-semibold text-maroon">
            {sizeLeftNote(left)}
          </p>
        )}

        {overErr && (
          <p role="alert" className="mt-2.5 text-[13px] text-[#a33a2f]">
            {overErr}
          </p>
        )}

        {err && (
          <p role="alert" className="mt-2.5 text-[13px] text-[#a33a2f]">
            Please choose a size first.
          </p>
        )}
      </div>

      {!showNotify ? (
        <>
          {/* Phone: pinned just above the tab bar so it is always in reach while
              the shopper reads. Desktop: an ordinary full-width button. */}
          <div className="fixed inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom))] z-30 flex items-center gap-3 border-t border-line bg-white px-4 py-2 md:static md:z-auto md:mt-5 md:flex md:items-center md:gap-3 md:border-0 md:bg-transparent md:p-0">
            <div className="hidden shrink-0 md:block">
              <QtyStepper
                size="sm"
                qty={qty}
                onDecrease={() => setQty((q) => Math.max(1, q - 1))}
                onIncrease={() => setQty((q) => Math.min(99, q + 1))}
              />
            </div>
            <div className="shrink-0 leading-tight md:hidden">
              <span className="block text-[10px] uppercase tracking-[0.1em] text-ink-soft">Total</span>
              <span className="block text-[16px] font-bold">{inr(variantPrice(p, variant) * qty)}</span>
            </div>
            <button
              type="button"
              onClick={onAdd}
              className="ml-auto h-11 w-[58%] cursor-pointer bg-ink text-[12px] font-bold uppercase tracking-[0.14em] text-cream transition-colors hover:bg-espresso-2 md:ml-0 md:w-[250px] md:tracking-[0.16em]"
            >
              {added ? "Added to bag ✓" : (
                <>
                  Add to bag<span className="hidden md:inline"> — {inr(variantPrice(p, variant) * qty)}</span>
                </>
              )}
            </button>
            {actions && <div className="hidden shrink-0 md:block">{actions}</div>}
          </div>
          {/* The bag stays closed on purpose: someone building an order adds
              several designs in a row, and a drawer covering the page after each
              one forced them back out to carry on. The bag icon's count confirms
              the add; this link is the way in when they are done. */}
          <p aria-live="polite" className="mt-2 h-[18px] text-center text-[12.5px] text-ink-soft">
            {added && (
              <button
                type="button"
                onClick={() => setBagOpen(true)}
                className="underline underline-offset-2 hover:text-ink"
              >
                View bag
              </button>
            )}
          </p>

          {/* Phone only: the reassurance line stays on the phone page. */}
          <p className="mt-2 text-center text-[12px] text-ink-soft md:hidden">
            Secure checkout with UPI, card or netbanking.
          </p>

        </>
      ) : (
        <div className="mt-8 border border-line-strong bg-cream-2 px-5 py-6 text-center">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-ink">
            {unavailableChoice ? `Size ${size} — ${colourLabel(p, variant)}` : `Sold out — ${colourLabel(p, variant)}`}
          </p>
          <p className="mt-1.5 text-[12.5px] text-ink-soft">
            {unavailableChoice
              ? choice === "na"
                ? "We don\u2019t have this size in this colour right now. Leave your email and we\u2019ll tell you if it becomes available."
                : "This size is sold out. Leave your email and we\u2019ll tell you the moment it\u2019s back."
              : <>Tap below and we&rsquo;ll let you know the moment this shade is back.</>}
          </p>
          <div className="mt-4">
            <NotifyMe
              full
              variantId={variant.id}
              size={unavailableChoice ? size : null}
              label={unavailableChoice ? `${p.name} — ${colourLabel(p, variant)}, size ${size}` : `${p.name} — ${colourLabel(p, variant)}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
