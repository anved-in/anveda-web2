"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "@/components/Link";
import { asset } from "@/lib/site";
import {
  ALL_SIZES,
  isRareSize,
  colourLabel,
  imgSrc,
  imgSrcSmall,
  inr,
  productById,
  sizeLeft,
  sizeLeftNote,
  sizeState,
  sizesOfProduct,
  variantPrice,
  type Product,
  type Variant,
} from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import type { ResolvedReel } from "@/lib/reels";

/**
 * Everything needed to buy from a reel, in one place:
 *  - a COMBINATION (set in the CMS): every design in it, a colour for each, ONE size for the lot, ONE price;
 *  - otherwise the reel's single design: colour, size, quantity.
 * Each design is a big photo plus a small colour drop-down (so a long list of colours takes one line, not ten),
 * and tapping the photo opens it larger. Used inside the right-hand panel of the full-screen reel on desktop
 * (dark) and in the pop-up sheet on phones (light).
 */
interface Row {
  p: Product;
  qty: number;
  variants: Variant[];
}

const THEME = {
  light: {
    text: "text-ink",
    muted: "text-ink-soft",
    faint: "text-ink-faint",
    line: "border-line",
    field: "border-line-strong bg-white text-ink",
    chipOff: "border-line-strong text-ink hover:border-ink",
    chipOn: "border-ink bg-ink text-cream",
    chipGone: "border-line bg-cream-2 text-ink-soft/60 line-through",
    btn: "bg-ink text-cream hover:bg-espresso-2",
    btnDim: "bg-ink/55 text-cream",
    ghost: "border-ink text-ink hover:bg-ink hover:text-cream",
    err: "text-[#a33a2f]",
    scheme: "light",
  },
  dark: {
    text: "text-white",
    muted: "text-white/75",
    faint: "text-white/55",
    line: "border-white/15",
    field: "border-white/35 bg-black text-white",
    chipOff: "border-white/35 text-white hover:border-white",
    chipOn: "border-white bg-white text-black",
    chipGone: "border-white/10 text-white/35 line-through",
    btn: "bg-white text-black hover:bg-white/90",
    btnDim: "bg-white/45 text-black",
    ghost: "border-white/40 text-white hover:bg-white hover:text-black",
    err: "text-[#ff9b8f]",
    scheme: "dark",
  },
} as const;

/** The photo at full size, in a pop-up. Escape / tap anywhere closes it (never the reel behind it). */
function Lightbox({ src, caption, onClose }: { src: string; caption: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[400] flex flex-col items-center justify-center bg-black/85 p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label={caption}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={caption} className="max-h-[82dvh] max-w-full rounded-md object-contain" />
      <p className="mt-3 text-center text-[13px] text-white/85">{caption}</p>
      <button type="button" aria-label="Close" className="absolute right-3 top-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25" onClick={onClose}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>,
    document.body,
  );
}

export default function ReelPicker({ reel, dark = false, onAdded }: { reel: ResolvedReel; dark?: boolean; onAdded?: () => void }) {
  const t = dark ? THEME.dark : THEME.light;
  const { add, addCombo, setOpen: setBagOpen } = useCart();
  const combo = reel.combo ?? null;

  const rows: Row[] = useMemo(() => {
    if (combo) {
      return combo.items.flatMap((it) => {
        const p = productById(it.productId);
        if (!p) return [];
        // the colours ticked for the reel; none ticked = every colour of the design
        const wanted = it.colours.length ? p.variants.filter((v) => it.colours.includes(v.colour)) : p.variants;
        return [{ p, qty: it.qty, variants: wanted.length ? wanted : p.variants }];
      });
    }
    return reel.product ? [{ p: reel.product, qty: 1, variants: reel.product.variants }] : [];
  }, [combo, reel.product]);

  const [colour, setColour] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    rows.forEach((r) => {
      const open = r.variants.filter((v) => v.inStock);
      // the reel's own colour (single design), or the only colour left, is chosen for them
      if (!combo && reel.colour && open.some((v) => v.colour === reel.colour)) init[r.p.id] = reel.colour;
      else if (open.length === 1) init[r.p.id] = open[0].colour;
    });
    return init;
  });
  // ONE size for the whole reel: every design in a combination is bought in the same size
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [err, setErr] = useState(false);
  const [zoom, setZoom] = useState<{ src: string; caption: string } | null>(null);

  // the sizes every design in the reel is sold in
  const sizes = useMemo(
    () => ALL_SIZES.filter((s) => rows.every((r) => sizesOfProduct(r.p).includes(s) && (!isRareSize(r.p, s) || r.variants.some((x) => sizeState(x, s) === "ok")))),
    [rows],
  );

  if (rows.length === 0) return null;

  const picked = (r: Row) => r.variants.find((v) => v.colour === colour[r.p.id]);
  const soldOutRows = rows.filter((r) => !r.variants.some((v) => v.inStock));
  const complete = soldOutRows.length === 0 && !!size && rows.every((r) => colour[r.p.id]);
  const missingColours = rows.filter((r) => !colour[r.p.id]).length;

  // one price for a combination; otherwise the chosen colour's price
  const first = picked(rows[0]) ?? rows[0].variants[0];
  const price = combo ? combo.price : variantPrice(rows[0].p, first) * qty;
  const single = rows[0];
  const leftNote = !combo && size && picked(single) ? sizeLeft(picked(single)!, size) : null;

  const chooseColour = (r: Row, name: string) => {
    setColour((cur) => ({ ...cur, [r.p.id]: name }));
    const c = r.variants.find((v) => v.colour === name);
    // the shared size is dropped if this colour cannot be had in it
    if (c && size && sizeState(c, size) !== "ok") setSize("");
    setErr(false);
  };

  const addToBag = () => {
    if (!complete) {
      setErr(true);
      return;
    }
    if (combo) {
      addCombo(reel.id, reel.title, combo.price, rows.map((r) => ({ id: r.p.id, colour: colour[r.p.id], size, qty: r.qty })));
    } else {
      if (leftNote !== null && qty > leftNote) {
        setErr(true);
        return;
      }
      add(single.p.id, size, qty, colour[single.p.id]);
    }
    setAdded(true);
    onAdded?.();
  };

  const again = () => {
    setAdded(false);
    setSize("");
    setErr(false);
  };

  if (added) {
    return (
      <div className={`${t.text} rounded-md border ${t.line} p-4 text-center`}>
        <p className="text-[14px] font-semibold">{combo ? "Combo added to your bag ✓" : "Added to your bag ✓"}</p>
        <p className={`mt-1 text-[12.5px] ${t.muted}`}>{combo ? `${reel.title} · ${inr(combo.price)} · Size ${size}` : `${single.p.name} · ${colourLabel(single.p, picked(single)!)} · Size ${size}`}</p>
        <div className="mt-4 flex flex-col gap-2">
          <button type="button" onClick={() => setBagOpen(true)} className={`h-10 cursor-pointer text-[11.5px] font-bold uppercase tracking-[0.14em] ${t.btn}`}>
            View bag
          </button>
          <button type="button" onClick={again} className={`h-10 cursor-pointer border text-[11.5px] font-bold uppercase tracking-[0.14em] ${t.ghost}`}>
            Choose again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={t.text}>
      <div className="flex items-baseline justify-between gap-3">
        <p className={`text-[10.5px] font-bold uppercase tracking-[0.16em] ${t.faint}`}>{combo ? `Combo · ${rows.length} designs` : "Buy this"}</p>
        <p className="text-[20px] font-bold">{inr(price)}</p>
      </div>
      {combo && <p className={`text-right text-[11.5px] ${t.muted}`}>one price for everything below</p>}

      {rows.map((r) => {
        const v = picked(r);
        const shown = v ?? r.variants.find((x) => x.inStock) ?? r.variants[0];
        const soldOut = !r.variants.some((x) => x.inStock);
        const label = `${r.p.name}${v ? ` · ${colourLabel(r.p, v)}` : ""}`;
        return (
          <div key={r.p.id} className={`mt-4 border-t ${t.line} pt-4`}>
            <div className="flex gap-3">
              {/* the photo, big enough to judge the design; tap for the full picture */}
              <button
                type="button"
                onClick={() => setZoom({ src: asset(imgSrc(shown.image)), caption: label })}
                className="relative h-[132px] w-[132px] shrink-0 cursor-zoom-in overflow-hidden rounded-md bg-black/10"
                aria-label={`View ${label} larger`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset(imgSrcSmall(shown.image))} alt="" className={`h-full w-full object-cover ${soldOut ? "grayscale" : ""}`} loading="lazy" />
                <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white" aria-hidden="true">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="6" />
                    <path d="M20 20l-4.2-4.2M11 8.5v5M8.5 11h5" />
                  </svg>
                </span>
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold leading-snug">{r.p.name}</p>
                {combo && <p className={`text-[12px] ${t.muted}`}>{r.qty > 1 ? `${r.qty} pieces` : "1 piece"}</p>}
                {soldOut ? (
                  <p className={`mt-2 text-[12.5px] font-semibold ${t.err}`}>Sold out right now.</p>
                ) : (
                  <>
                    <label className={`mt-2 block text-[10.5px] font-bold uppercase tracking-[0.14em] ${t.faint}`} htmlFor={`col-${reel.id}-${r.p.id}`}>
                      Colour
                    </label>
                    <select
                      id={`col-${reel.id}-${r.p.id}`}
                      value={colour[r.p.id] ?? ""}
                      onChange={(e) => chooseColour(r, e.target.value)}
                      style={{ colorScheme: t.scheme }}
                      className={`mt-1 h-9 w-full cursor-pointer rounded-md border px-2 text-[13px] outline-none focus:border-current ${t.field}`}
                    >
                      <option value="" disabled>
                        Choose a colour
                      </option>
                      {r.variants.map((c) => {
                        const noSize = !!size && sizeState(c, size) !== "ok";
                        return (
                          <option key={c.colour} value={c.colour} disabled={!c.inStock || noSize}>
                            {colourLabel(r.p, c)}
                            {!c.inStock ? " — sold out" : noSize ? ` — no size ${size}` : ""}
                          </option>
                        );
                      })}
                    </select>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* ONE size for the whole reel */}
      <div className={`mt-4 border-t ${t.line} pt-4`}>
        <p className={`text-[10.5px] font-bold uppercase tracking-[0.14em] ${t.faint}`}>{combo ? "Size (for every design)" : "Size"}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5" role="group" aria-label="Size">
          {sizes.map((s) => {
            const on = size === s;
            // a size is offered only if every chosen colour can be had in it
            const ok = rows.every((r) => {
              const v = picked(r);
              return v ? sizeState(v, s) === "ok" : r.variants.some((x) => x.inStock && sizeState(x, s) === "ok");
            });
            return (
              <button
                key={s}
                type="button"
                disabled={!ok}
                aria-pressed={on}
                onClick={() => {
                  setSize(s);
                  setErr(false);
                }}
                className={["min-w-[42px] border px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors", on ? t.chipOn : ok ? t.chipOff : t.chipGone, ok ? "cursor-pointer" : "cursor-not-allowed"].join(" ")}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {!combo && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className={`text-[10.5px] font-bold uppercase tracking-[0.14em] ${t.faint}`}>Quantity</span>
          <span className={`inline-flex items-center border ${t.line}`}>
            <button type="button" aria-label="One less" onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-8 w-8 cursor-pointer text-[16px]">
              −
            </button>
            <span className="w-8 text-center text-[13px] font-semibold" aria-live="polite">
              {qty}
            </span>
            <button type="button" aria-label="One more" onClick={() => setQty((q) => Math.min(99, q + 1))} className="h-8 w-8 cursor-pointer text-[16px]">
              +
            </button>
          </span>
        </div>
      )}
      {!combo && leftNote !== null && <p className={`mt-1.5 text-right text-[11.5px] ${t.muted}`}>{sizeLeftNote(leftNote)}</p>}

      {/* stays in view while the designs above scroll */}
      <div className={`sticky bottom-0 mt-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 ${dark ? "bg-black" : "bg-white"}`}>
        {soldOutRows.length > 0 && (
          <p role="status" className={`mb-2 text-[12.5px] ${t.err}`}>
            {combo ? `This combination is unavailable right now: ${soldOutRows.map((r) => r.p.name).join(", ")} ${soldOutRows.length === 1 ? "is" : "are"} sold out.` : "This design is sold out right now."}
          </p>
        )}
        {err && !complete && soldOutRows.length === 0 && (
          <p role="alert" className={`mb-2 text-[12.5px] ${t.err}`}>
            {leftNote !== null && qty > leftNote && size && missingColours === 0
              ? `Only ${leftNote} left in that size.`
              : missingColours > 0
                ? `Choose a colour for ${missingColours === 1 ? "the remaining design" : `all ${missingColours} remaining designs`}${size ? "" : ", and a size"}.`
                : "Choose a size."}
          </p>
        )}
        <button type="button" onClick={addToBag} className={`h-11 w-full cursor-pointer text-[11.5px] font-bold uppercase tracking-[0.14em] transition-colors ${complete ? t.btn : t.btnDim}`}>
          {soldOutRows.length ? "Currently unavailable" : `Add to bag — ${inr(price)}`}
        </button>
        {!combo && (
          <Link href={reel.href} className={`mt-3 block text-center text-[11px] uppercase tracking-[0.14em] underline underline-offset-4 ${t.muted}`}>
            Full details
          </Link>
        )}
      </div>

      {zoom && <Lightbox src={zoom.src} caption={zoom.caption} onClose={() => setZoom(null)} />}
    </div>
  );
}
