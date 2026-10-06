"use client";

import Link from "@/components/Link";
import { useEffect } from "react";
import { useCart, lineProduct } from "@/lib/cart";
import { imgSrc, inr, unitPrice, packLabel, colourLabel } from "@/lib/catalog";
import { SITE, asset } from "@/lib/site";
import { SHIPPING_FROM } from "@/lib/shipping";

export default function CartDrawer() {
  const { open, setOpen, lines, setQty, remove, subtotal, count } = useCart();

  // Escape closes; body scroll locks while the drawer owns the screen.
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
        aria-label="Your bag"
        className={[
          "fixed right-0 top-0 z-[80] flex h-[100dvh] w-full max-w-[420px] flex-col bg-cream transition-transform duration-300",
          open ? "translate-x-0 shadow-2xl" : "translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="font-display text-[22px]">
            Your bag{count > 0 && <span className="text-ink-soft"> ({count})</span>}
          </h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close bag" className="p-1.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <p className="text-ink-soft">Your bag is empty.</p>
            <Link
              href="/shop/glass/"
              onClick={() => setOpen(false)}
              className="mt-6 border border-ink px-7 py-3.5 text-[11.5px] font-bold uppercase tracking-[0.2em] transition-colors hover:bg-ink hover:text-cream"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              {lines.map((l) => {
                const p = lineProduct(l);
                if (!p) return null;
                return (
                  <div key={`${l.id}__${l.size}__${l.colour}`} className="flex gap-4 border-b border-line py-5">
                    <Link
                      href={`/product/${p.id}`}
                      onClick={() => setOpen(false)}
                      className="h-[86px] w-[70px] shrink-0 overflow-hidden bg-cream-2"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset(imgSrc(
                          p.variants.find((v) => v.colour === l.colour)?.image ?? p.image,
                        ))}
                        alt={p.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-maroon">
                        {p.collectionName}
                      </div>
                      <Link
                        href={`/product/${p.id}`}
                        onClick={() => setOpen(false)}
                        className="mt-0.5 block truncate text-[14px] font-semibold"
                      >
                        {p.name}
                      </Link>
                      {/* Display only — l.colour stays the raw catalogue value,
                          because it is part of the cart line's identity key. */}
                      {(() => {
                        const v = p.variants.find((x) => x.colour === l.colour);
                        const pack = v && packLabel(p, v);
                        const shade = v ? colourLabel(p, v) : l.colour;
                        return (
                          <div className="mt-0.5 text-[12px] text-ink-soft">
                            {shade && `${shade} · `}Size {l.size}
                            {pack ? ` · ${pack}` : null}
                          </div>
                        );
                      })()}

                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="flex items-center border border-line">
                          <button
                            type="button"
                            onClick={() => setQty(l.id, l.size, l.colour, l.qty - 1)}
                            className="px-2.5 py-1 text-[15px] leading-none"
                            aria-label={`Decrease quantity of ${p.name}`}
                          >
                            −
                          </button>
                          <span className="min-w-[26px] text-center text-[13px]">{l.qty}</span>
                          <button
                            type="button"
                            onClick={() => setQty(l.id, l.size, l.colour, l.qty + 1)}
                            className="px-2.5 py-1 text-[15px] leading-none"
                            aria-label={`Increase quantity of ${p.name}`}
                          >
                            +
                          </button>
                        </div>
                        <span className="text-[14px] font-semibold">{inr(unitPrice(l.id, l.colour) * l.qty)}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => remove(l.id, l.size, l.colour)}
                        className="mt-2 text-[11px] uppercase tracking-[0.14em] text-ink-soft underline underline-offset-2 hover:text-ink"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-line px-6 py-5">
              <div className="flex justify-between text-[14px]">
                <span className="text-ink-soft">Subtotal</span>
                <span className="font-semibold">{inr(subtotal)}</span>
              </div>
              {/* The bag has no address yet, so shipping cannot be priced
                  here — it is quoted from the PIN code at checkout. */}
              <div className="mt-1.5 flex justify-between text-[14px]">
                <span className="text-ink-soft">Shipping</span>
                <span className="text-[13px] text-ink-soft">
                  from {inr(SHIPPING_FROM)} · at checkout
                </span>
              </div>
              <p className="mt-2 text-[12px] text-ink-faint">
                Sent by {SITE.courier}. Enter your PIN code at checkout and we
                price the parcel for your area.
              </p>

              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className="mt-5 block bg-espresso py-4 text-center text-[12px] font-bold uppercase tracking-[0.2em] text-cream transition-colors hover:bg-espresso-2"
              >
                Checkout
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-2.5 w-full py-2 text-[11.5px] uppercase tracking-[0.16em] text-ink-soft hover:text-ink"
              >
                Continue shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
