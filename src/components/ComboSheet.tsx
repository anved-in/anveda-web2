"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { asset } from "@/lib/site";
import {
  imgSrcSmall,
  inr,
  productById,
  sizeState,
  sizesOfProduct,
  colourLabel,
  type Product,
  type Variant,
} from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import type { ResolvedReel } from "@/lib/reels";

/**
 * A reel sold as a combination: the owner picked the designs (and how many pieces of each)
 * and ONE price for the lot in the CMS. The shopper chooses the colour and size of every
 * design, then adds the whole combination to the bag at that one price.
 */
interface Row {
  p: Product;
  qty: number;
  variants: Variant[];
}

export default function ComboSheet({ reel, onClose }: { reel: ResolvedReel; onClose: () => void }) {
  const { addCombo, setOpen: setBagOpen } = useCart();
  const combo = reel.combo!;

  const rows: Row[] = useMemo(
    () =>
      combo.items.flatMap((it) => {
        const p = productById(it.productId);
        if (!p) return [];
        // the colours ticked for the reel; none ticked = every colour of the design
        const wanted = it.colours.length ? p.variants.filter((v) => it.colours.includes(v.colour)) : p.variants;
        return [{ p, qty: it.qty, variants: wanted.length ? wanted : p.variants }];
      }),
    [combo],
  );

  const [colour, setColour] = useState<Record<string, string>>(() => {
    // a design with only one colour on offer is chosen for them
    const init: Record<string, string> = {};
    rows.forEach((r) => {
      const open = r.variants.filter((v) => v.inStock);
      if (open.length === 1) init[r.p.id] = open[0].colour;
    });
    return init;
  });
  const [size, setSize] = useState<Record<string, string>>({});
  const [added, setAdded] = useState(false);
  const [err, setErr] = useState(false);

  // Escape closes the sheet, never the reel feed behind it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const picked = (r: Row) => r.variants.find((v) => v.colour === colour[r.p.id]);
  // a design with every colour sold out makes the whole combination unavailable right now
  const soldOutRows = rows.filter((r) => !r.variants.some((v) => v.inStock));
  const complete = soldOutRows.length === 0 && rows.length > 0 && rows.every((r) => colour[r.p.id] && size[r.p.id]);
  const missing = rows.filter((r) => !colour[r.p.id] || !size[r.p.id]).length;

  const add = () => {
    if (!complete) {
      setErr(true);
      return;
    }
    addCombo(
      reel.id,
      reel.title,
      combo.price,
      rows.map((r) => ({ id: r.p.id, colour: colour[r.p.id], size: size[r.p.id], qty: r.qty })),
    );
    setAdded(true);
  };

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center bg-black/55 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="combo-title"
        className="flex max-h-[92dvh] w-full max-w-[520px] flex-col bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-faint">Combo · {rows.length} designs</p>
            <h2 id="combo-title" className="truncate font-display text-[20px] leading-tight">
              {reel.title}
            </h2>
            <p className="mt-1 text-[15px] font-bold">{inr(combo.price)} <span className="text-[12px] font-normal text-ink-soft">for everything below</span></p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-1 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center text-ink-soft hover:text-ink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {added ? (
            <div className="py-10 text-center">
              <p className="text-[15px] font-semibold">Combo added to your bag ✓</p>
              <p className="mt-1.5 text-[13px] text-ink-soft">{reel.title} · {inr(combo.price)}</p>
              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setBagOpen(true);
                  }}
                  className="h-11 cursor-pointer bg-ink text-[12px] font-bold uppercase tracking-[0.14em] text-cream hover:bg-espresso-2"
                >
                  View bag
                </button>
                <button type="button" onClick={onClose} className="h-11 cursor-pointer border border-ink text-[12px] font-bold uppercase tracking-[0.14em] hover:bg-ink hover:text-cream">
                  Keep watching
                </button>
              </div>
            </div>
          ) : (
            rows.map((r, n) => {
              const v = picked(r);
              const sizes = sizesOfProduct(r.p);
              return (
                <div key={r.p.id} className={n ? "mt-5 border-t border-line pt-5" : ""}>
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset(imgSrcSmall((v ?? r.variants[0]).image))}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold">{r.p.name}</p>
                      <p className="text-[12px] text-ink-soft">
                        {r.qty > 1 ? `${r.qty} pieces` : "1 piece"}
                        {v ? ` · ${colourLabel(r.p, v)}` : ""}
                      </p>
                    </div>
                  </div>

                  {!r.variants.some((v) => v.inStock) && (
                    <p className="mt-3 text-[12.5px] font-semibold text-[#a33a2f]">This design is sold out right now.</p>
                  )}
                  <p className="mt-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-faint">Colour</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5" role="group" aria-label={`Colour of ${r.p.name}`}>
                    {r.variants.map((c) => {
                      const on = colour[r.p.id] === c.colour;
                      const out = !c.inStock;
                      return (
                        <button
                          key={c.colour}
                          type="button"
                          disabled={out}
                          aria-pressed={on}
                          onClick={() => {
                            setColour((cur) => ({ ...cur, [r.p.id]: c.colour }));
                            // a size that this colour cannot offer is dropped
                            setSize((cur) => (cur[r.p.id] && sizeState(c, cur[r.p.id]) !== "ok" ? { ...cur, [r.p.id]: "" } : cur));
                            setErr(false);
                          }}
                          className={[
                            "flex items-center gap-1.5 border px-2 py-1 text-[12px] transition-colors",
                            on ? "border-ink bg-ink text-cream" : "border-line-strong hover:border-ink",
                            out ? "cursor-not-allowed opacity-45 line-through" : "cursor-pointer",
                          ].join(" ")}
                        >
                          <span className="h-4 w-4 shrink-0 rounded-full border border-black/10" style={{ background: c.hex ?? "#cfc6ba" }} aria-hidden="true" />
                          {colourLabel(r.p, c)}
                          {out && <span className="sr-only"> (sold out)</span>}
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-faint">Size</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5" role="group" aria-label={`Size of ${r.p.name}`}>
                    {sizes.map((s) => {
                      const on = size[r.p.id] === s;
                      const ok = v ? sizeState(v, s) === "ok" : true;
                      return (
                        <button
                          key={s}
                          type="button"
                          disabled={!ok}
                          aria-pressed={on}
                          onClick={() => {
                            setSize((cur) => ({ ...cur, [r.p.id]: s }));
                            setErr(false);
                          }}
                          className={[
                            "min-w-[44px] border px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors",
                            on ? "border-ink bg-ink text-cream" : "border-line-strong hover:border-ink",
                            !ok ? "cursor-not-allowed bg-cream-2 text-ink-soft/60 line-through" : "cursor-pointer",
                          ].join(" ")}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!added && (
          <div className="border-t border-line px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
            {soldOutRows.length > 0 && (
              <p role="status" className="mb-2 text-[12.5px] text-[#a33a2f]">
                This combination is unavailable right now: {soldOutRows.map((r) => r.p.name).join(", ")} {soldOutRows.length === 1 ? "is" : "are"} sold out.
              </p>
            )}
            {err && !complete && soldOutRows.length === 0 && (
              <p role="alert" className="mb-2 text-[12.5px] text-[#a33a2f]">
                Choose a colour and size for {missing === 1 ? "the remaining design" : `all ${missing} remaining designs`}.
              </p>
            )}
            <button
              type="button"
              onClick={add}
              className={[
                "h-12 w-full text-[12px] font-bold uppercase tracking-[0.14em] transition-colors",
                complete ? "cursor-pointer bg-ink text-cream hover:bg-espresso-2" : "cursor-pointer bg-ink/55 text-cream",
              ].join(" ")}
            >
              {soldOutRows.length ? "Currently unavailable" : `Add combo to bag — ${inr(combo.price)}`}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
