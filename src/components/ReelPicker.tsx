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
  framingStyle,
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
import { useLiveStock } from "@/lib/liveStock";
import NotifyMe, { type AskChoice } from "@/components/NotifyMe";
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
  const live = useLiveStock(); // redraw when the real stock counts arrive
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

  // keyed by the entry's POSITION in the combo (not by design): the same design can be in it twice, each with its own colour
  const [colour, setColour] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    rows.forEach((r, i) => {
      const open = r.variants.filter((v) => v.inStock);
      // the reel's own colour (single design), or the only colour left, is chosen for them
      if (!combo && reel.colour && open.some((v) => v.colour === reel.colour)) init[i] = reel.colour;
      else if (open.length === 1) init[i] = open[0].colour;
    });
    return init;
  });
  // ONE size for the whole reel: every design in a combination is bought in the same size
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [err, setErr] = useState(false);
  const [zoom, setZoom] = useState<{ src: string; caption: string } | null>(null);
  // "Get it for me": the pop-up that lets the shopper ask us for a sold-out colour or a size we do not have right now
  const [ask, setAsk] = useState<AskChoice[] | null>(null);

  // the sizes every design in the reel is sold in
  const sizes = useMemo(
    () => ALL_SIZES.filter((s) => rows.every((r) => sizesOfProduct(r.p).includes(s) && (!isRareSize(r.p, s) || r.variants.some((x) => sizeState(x, s) === "ok")))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, live],
  );

  if (rows.length === 0) return null;

  const picked = (r: Row, i: number) => r.variants.find((v) => v.colour === colour[i]);
  const soldOutRows = rows.filter((r) => !r.variants.some((v) => v.inStock));
  const complete = soldOutRows.length === 0 && !!size && rows.every((_, i) => colour[i]);
  const missingColours = rows.filter((_, i) => !colour[i]).length;

  // one price for a combination; otherwise the chosen colour's price
  const first = picked(rows[0], 0) ?? rows[0].variants[0];
  const price = combo ? combo.price : variantPrice(rows[0].p, first) * qty;
  const single = rows[0];
  const leftNote = !combo && size && picked(single, 0) ? sizeLeft(picked(single, 0)!, size) : null;

  // what can be asked for: a design's sold-out colours, or the colours that lack a size
  const soldChoices = (r: Row): AskChoice[] => r.variants.filter((x) => !x.inStock).map((x) => ({ variantId: x.id, label: `${r.p.name}, ${colourLabel(r.p, x)}` }));
  const sizeChoices = (sz: string): AskChoice[] => {
    const out: AskChoice[] = [];
    rows.forEach((r, i) => {
      const v = picked(r, i);
      const lacking = v ? (sizeState(v, sz) !== "ok" ? [v] : []) : r.variants.filter((x) => sizeState(x, sz) !== "ok");
      lacking.forEach((x) => {
        if (!out.some((o) => o.variantId === x.id)) out.push({ variantId: x.id, size: sz, label: `${r.p.name}, ${colourLabel(r.p, x)}, size ${sz}` });
      });
    });
    return out;
  };

  const chooseColour = (i: number, r: Row, name: string) => {
    setColour((cur) => ({ ...cur, [i]: name }));
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
      addCombo(reel.id, reel.title, combo.price, rows.map((r, i) => ({ id: r.p.id, colour: colour[i], size, qty: r.qty })));
    } else {
      if (leftNote !== null && qty > leftNote) {
        setErr(true);
        return;
      }
      add(single.p.id, size, qty, colour[0]);
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
        <p className={`mt-1 text-[12.5px] ${t.muted}`}>{combo ? `${reel.title} · ${inr(combo.price)} · Size ${size}` : `${single.p.name} · ${colourLabel(single.p, picked(single, 0)!)} · Size ${size}`}</p>
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
        <p className={`text-[10.5px] font-bold uppercase tracking-[0.16em] ${t.faint}`}>{combo ? `Combo · ${new Set(rows.map((r) => r.p.id)).size} ${new Set(rows.map((r) => r.p.id)).size === 1 ? "design" : "designs"}` : "Buy this"}</p>
        <p className="text-[20px] font-bold">{inr(price)}</p>
      </div>
      {combo && <p className={`text-right text-[11.5px] ${t.muted}`}>one price for everything below</p>}

      {rows.map((r, i) => {
        const v = picked(r, i);
        // the same design in several entries: say which colour this is, and do not let one colour be taken twice
        const sameCount = rows.filter((o) => o.p.id === r.p.id).length;
        const nth = rows.slice(0, i + 1).filter((o) => o.p.id === r.p.id).length;
        const shown = v ?? r.variants.find((x) => x.inStock) ?? r.variants[0];
        const soldOut = !r.variants.some((x) => x.inStock);
        const label = `${r.p.name}${v ? ` · ${colourLabel(r.p, v)}` : ""}`;
        return (
          <div key={i} className={`mt-4 border-t ${t.line} pt-4`}>
            <div className="flex gap-3">
              {/* the photo, big enough to judge the design; tap for the full picture */}
              <button
                type="button"
                onClick={() => setZoom({ src: asset(imgSrc(shown.image)), caption: label })}
                className="relative h-[132px] w-[132px] shrink-0 cursor-zoom-in overflow-hidden rounded-md bg-black/10"
                aria-label={`View ${label} larger`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset(imgSrcSmall(shown.image))} alt="" className="h-full w-full object-cover" style={framingStyle(shown)} loading="lazy" />
                {soldOut && (
                  <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 whitespace-nowrap bg-ink/80 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                    Sold out
                  </span>
                )}
                <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white" aria-hidden="true">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="6" />
                    <path d="M20 20l-4.2-4.2M11 8.5v5M8.5 11h5" />
                  </svg>
                </span>
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold leading-snug">{r.p.name}</p>
                {combo && sameCount > 1 && <p className={`text-[12px] font-semibold ${t.muted}`}>Colour {nth} of {sameCount}</p>}
                {combo && <p className={`text-[12px] ${t.muted}`}>{r.qty > 1 ? `${r.qty} pieces` : "1 piece"}</p>}
                {soldOut ? (
                  <>
                    <p className={`mt-2 text-[12.5px] font-semibold ${t.err}`}>Sold out right now.</p>
                    {soldChoices(r).length > 0 && (
                      <button type="button" onClick={() => setAsk(soldChoices(r))} className={`mt-2 h-9 w-full cursor-pointer border text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${t.ghost}`}>
                        Get it for me
                      </button>
                    )}
                    <p className={`mt-1.5 text-[11.5px] ${t.muted}`}>Tell us and we&rsquo;ll get it for you.</p>
                  </>
                ) : (
                  <>
                    <label className={`mt-2 block text-[10.5px] font-bold uppercase tracking-[0.14em] ${t.faint}`} htmlFor={`col-${reel.id}-${i}`}>
                      Colour
                    </label>
                    <select
                      id={`col-${reel.id}-${i}`}
                      value={colour[i] ?? ""}
                      onChange={(e) => chooseColour(i, r, e.target.value)}
                      style={{ colorScheme: t.scheme }}
                      className={`mt-1 h-9 w-full cursor-pointer rounded-md border px-2 text-[13px] outline-none focus:border-current ${t.field}`}
                    >
                      <option value="" disabled>
                        Choose a colour
                      </option>
                      {r.variants.map((c) => {
                        const noSize = !!size && sizeState(c, size) !== "ok";
                        // another entry of the same design already has this colour
                        const taken = rows.some((o, k) => k !== i && o.p.id === r.p.id && colour[k] === c.colour);
                        return (
                          <option key={c.colour} value={c.colour} disabled={!c.inStock || noSize || taken}>
                            {colourLabel(r.p, c)}
                            {!c.inStock ? ", sold out" : noSize ? `, no size ${size}` : taken ? ", chosen above" : ""}
                          </option>
                        );
                      })}
                    </select>
                    {soldChoices(r).length > 0 && (
                      <button type="button" onClick={() => setAsk(soldChoices(r))} className={`mt-1.5 cursor-pointer text-left text-[11.5px] underline underline-offset-2 ${t.muted}`}>
                        Colour you want is sold out? We&rsquo;ll get it for you.
                      </button>
                    )}
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
            const ok = rows.every((r, i) => {
              const v = picked(r, i);
              return v ? sizeState(v, s) === "ok" : r.variants.some((x) => x.inStock && sizeState(x, s) === "ok");
            });
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                aria-label={ok ? undefined : `Size ${s} is not available right now. Tap and we will get it for you.`}
                onClick={() => {
                  // a size we do not have is not a dead end: tapping it opens "we'll get it for you"
                  if (!ok) {
                    const c = sizeChoices(s);
                    if (c.length) setAsk(c);
                    return;
                  }
                  setSize(s);
                  setErr(false);
                }}
                className={["min-w-[42px] border px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors", on ? t.chipOn : ok ? t.chipOff : t.chipGone, "cursor-pointer"].join(" ")}
              >
                {s}
              </button>
            );
          })}
        </div>
        {sizes.length > 0 && (
          <p className={`mt-2 text-[11.5px] ${t.muted}`} data-ask-size-hint>
            Size crossed out or missing? Tap it and we&rsquo;ll get it for you.
          </p>
        )}
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
            {combo ? `${soldOutRows.map((r) => r.p.name).join(", ")} ${soldOutRows.length === 1 ? "is" : "are"} sold out right now.` : "This design is sold out right now."}
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
          {soldOutRows.length ? "Currently unavailable" : `Add to bag · ${inr(price)}`}
        </button>
        {!combo && (
          <Link href={reel.href} className={`mt-3 block text-center text-[11px] uppercase tracking-[0.14em] underline underline-offset-4 ${t.muted}`}>
            Full details
          </Link>
        )}
      </div>

      {ask && ask.length > 0 && <NotifyMe mode="request" controlled={{ open: true, onClose: () => setAsk(null) }} variantId={ask[0].variantId} size={ask[0].size ?? null} label={ask[0].label} choices={ask} />}
      {zoom && <Lightbox src={zoom.src} caption={zoom.caption} onClose={() => setZoom(null)} />}
    </div>
  );
}
