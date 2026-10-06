"use client";

import { useState } from "react";
import Link from "@/components/Link";
import { useCart } from "@/lib/cart";
import QtyStepper from "@/components/QtyStepper";
import { inr, variantPrice, packLabel, colourLabel, ALL_SIZES, SIZE_GUIDE, type Product, type Variant } from "@/lib/catalog";

/**
 * The buy box: size, quantity, add to bag. Colour is picked one level up
 * (the thumbnail strip under the photo in <ProductView>) and arrives here
 * as `variant`, already resolved — this component only reads it.
 */
export default function ProductBuy({
  p,
  variant,
}: {
  p: Product;
  /** Controlled by ProductView so the photo, the thumbnails and the line
      that reaches the cart can never disagree about which shade is selected. */
  variant: Variant;
}) {
  // No size preselected on purpose: a defaulted size is the commonest cause of
  // a wrong-size delivery. The customer must choose deliberately.
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState(false);
  const [added, setAdded] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyState, setNotifyState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const { add, setOpen: setBagOpen } = useCart();

  // "pair" / "set of 4" / "dozen" — what one unit of this colourway contains.
  const pack = packLabel(p, variant);

  const onAdd = () => {
    if (!size) {
      setErr(true);
      return;
    }
    add(p.id, size, qty, variant.colour);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  const onNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail.includes("@")) return;
    setNotifyState("sending");
    try {
      const res = await fetch("/api/notify-stock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ variantId: variant.id, email: notifyEmail }),
      });
      const data = await res.json();
      setNotifyState(data.ok ? "done" : "error");
    } catch {
      setNotifyState("error");
    }
  };

  return (
    <div>
      {/* No colour picker here any more — it now lives as a thumbnail strip
          directly under the main photo in <ProductView>, so picking a shade
          updates a big image right there instead of a small swatch down
          here needing a scroll to see the result. Keeping both would ask
          the same question twice, one scroll apart. */}

      {/* -------------------------------------------------------------- size */}
      <div className="mt-7">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] font-bold uppercase tracking-[0.18em]">
            Size {size && <span className="text-ink-soft">· {size}</span>}
          </span>
          <Link
            href="/sizing"
            className="text-[12px] text-maroon underline underline-offset-2"
          >
            Size guide
          </Link>
        </div>

        {/* flex-1 + min-w-0 on every button, no wrap: all five sizes share
            the row equally instead of a fixed min-width forcing a 3+2 wrap
            on a phone. */}
        <div className="mt-3 flex gap-1.5">
          {ALL_SIZES.map((s) => {
            const g = SIZE_GUIDE.find((x) => x.size === s);
            const on = size === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSize(s);
                  setErr(false);
                }}
                aria-pressed={on}
                className={[
                  "min-w-0 flex-1 cursor-pointer border px-1 py-2.5 text-center transition-colors",
                  on
                    ? "border-ink bg-ink text-cream"
                    : "border-line-strong bg-white hover:border-ink",
                ].join(" ")}
              >
                <span className="block text-[13px] font-semibold">{s}</span>
                {g && (
                  <span
                    className={[
                      "mt-0.5 block text-[8px] uppercase tracking-[0.06em]",
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

        {err && (
          <p role="alert" className="mt-2.5 text-[13px] text-[#a33a2f]">
            Please choose a size first.
          </p>
        )}
      </div>

      {variant.inStock ? (
        <>
          {/* -------------------------------------------------------- quantity */}
          <div className="mt-7">
            <span className="text-[12px] font-bold uppercase tracking-[0.18em]">
              Quantity
              {/* What one unit actually contains. Designs come as pairs, sets of
                  four or dozens, so "1" is ambiguous without this. */}
              {pack && (
                <span className="ml-1.5 font-medium normal-case tracking-normal text-ink-soft">
                  ({pack})
                </span>
              )}
            </span>
            <div className="mt-3 w-fit">
              <QtyStepper
                qty={qty}
                onDecrease={() => setQty((q) => Math.max(1, q - 1))}
                onIncrease={() => setQty((q) => Math.min(99, q + 1))}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onAdd}
            className="mt-8 w-full cursor-pointer bg-ink py-[18px] text-[12px] font-bold uppercase tracking-[0.2em] text-cream transition-colors hover:bg-espresso-2"
          >
            {added ? "Added to bag ✓" : `Add to bag — ${inr(variantPrice(p, variant) * qty)}`}
          </button>
          {/* The bag stays closed on purpose: someone building an order adds
              several designs in a row, and a drawer covering the page after each
              one forced them back out to carry on. The bag icon's count confirms
              the add; this link is the way in when they are done. */}
          <p aria-live="polite" className="mt-3 h-[18px] text-center text-[12.5px] text-ink-soft">
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

          <p className="mt-3.5 text-center text-[12.5px] text-ink-soft">
            Secure checkout with UPI, card or netbanking.
          </p>
        </>
      ) : (
        <div className="mt-8 border border-line-strong bg-cream-2 px-5 py-6 text-center">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-ink">
            Sold out — {colourLabel(p, variant)}
          </p>
          <p className="mt-1.5 text-[12.5px] text-ink-soft">
            Leave your email and we&rsquo;ll let you know the moment this shade is back.
          </p>
          {notifyState === "done" ? (
            <p className="mt-4 text-[13px] font-semibold text-ink">You&rsquo;re on the list ✓</p>
          ) : (
            <form onSubmit={onNotify} className="mt-4 flex gap-2">
              <input
                type="email"
                required
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                placeholder="you@example.com"
                className="min-w-0 flex-1 border border-line-strong bg-white px-3.5 py-2.5 text-[13px] outline-none focus:border-ink"
              />
              <button
                type="submit"
                disabled={notifyState === "sending"}
                className="shrink-0 cursor-pointer bg-ink px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-cream transition-opacity hover:bg-espresso-2 disabled:opacity-60"
              >
                {notifyState === "sending" ? "…" : "Notify me"}
              </button>
            </form>
          )}
          {notifyState === "error" && (
            <p role="alert" className="mt-2 text-[12px] text-[#a33a2f]">
              Something went wrong — please try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
