"use client";

import { useMemo, useState } from "react";
import Link from "@/components/Link";
import { asset } from "@/lib/site";
import {
  colourLabel,
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
 *  - a COMBINATION (set in the CMS): every design in it, a colour and size for each, ONE price for the lot;
 *  - otherwise the reel's single design: colour, size, quantity.
 * Used inside the right-hand panel of the full-screen reel on desktop (dark) and in the pop-up sheet on phones (light).
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
    chipOff: "border-line-strong text-ink hover:border-ink",
    chipOn: "border-ink bg-ink text-cream",
    chipGone: "border-line bg-cream-2 text-ink-soft/60 line-through",
    btn: "bg-ink text-cream hover:bg-espresso-2",
    btnDim: "bg-ink/55 text-cream",
    ghost: "border-ink text-ink hover:bg-ink hover:text-cream",
    err: "text-[#a33a2f]",
  },
  dark: {
    text: "text-white",
    muted: "text-white/75",
    faint: "text-white/55",
    line: "border-white/15",
    chipOff: "border-white/35 text-white hover:border-white",
    chipOn: "border-white bg-white text-black",
    chipGone: "border-white/10 text-white/35 line-through",
    btn: "bg-white text-black hover:bg-white/90",
    btnDim: "bg-white/45 text-black",
    ghost: "border-white/40 text-white hover:bg-white hover:text-black",
    err: "text-[#ff9b8f]",
  },
} as const;

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
  const [size, setSize] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [err, setErr] = useState(false);

  if (rows.length === 0) return null;

  const picked = (r: Row) => r.variants.find((v) => v.colour === colour[r.p.id]);
  const soldOutRows = rows.filter((r) => !r.variants.some((v) => v.inStock));
  const complete = soldOutRows.length === 0 && rows.every((r) => colour[r.p.id] && size[r.p.id]);
  const missing = rows.filter((r) => !colour[r.p.id] || !size[r.p.id]).length;

  // one price for a combination; otherwise the chosen colour's price
  const first = picked(rows[0]) ?? rows[0].variants[0];
  const price = combo ? combo.price : variantPrice(rows[0].p, first) * qty;
  const single = rows[0];
  const leftNote = !combo && size[single.p.id] && picked(single) ? sizeLeft(picked(single)!, size[single.p.id]) : null;

  const addToBag = () => {
    if (!complete) {
      setErr(true);
      return;
    }
    if (combo) {
      addCombo(reel.id, reel.title, combo.price, rows.map((r) => ({ id: r.p.id, colour: colour[r.p.id], size: size[r.p.id], qty: r.qty })));
    } else {
      const left = leftNote;
      if (left !== null && qty > left) {
        setErr(true);
        return;
      }
      add(single.p.id, size[single.p.id], qty, colour[single.p.id]);
    }
    setAdded(true);
    onAdded?.();
  };

  const again = () => {
    setAdded(false);
    setSize({});
    setErr(false);
  };

  if (added) {
    return (
      <div className={`${t.text} rounded-xl border ${t.line} p-4 text-center`}>
        <p className="text-[14px] font-semibold">{combo ? "Combo added to your bag ✓" : "Added to your bag ✓"}</p>
        <p className={`mt-1 text-[12.5px] ${t.muted}`}>{combo ? `${reel.title} · ${inr(combo.price)}` : `${single.p.name} · ${colourLabel(single.p, picked(single)!)} · Size ${size[single.p.id]}`}</p>
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

      {rows.map((r, n) => {
        const v = picked(r);
        const sizes = sizesOfProduct(r.p);
        const soldOut = !r.variants.some((x) => x.inStock);
        return (
          <div key={r.p.id} className={`mt-4 ${n || true ? `border-t ${t.line} pt-4` : ""}`}>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset(imgSrcSmall((v ?? r.variants[0]).image))} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" loading="lazy" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold">{r.p.name}</p>
                <p className={`text-[12px] ${t.muted}`}>
                  {combo ? (r.qty > 1 ? `${r.qty} pieces` : "1 piece") : null}
                  {combo && v ? " · " : ""}
                  {v ? colourLabel(r.p, v) : combo ? "" : "Choose a colour"}
                </p>
              </div>
            </div>

            {soldOut ? (
              <p className={`mt-3 text-[12.5px] font-semibold ${t.err}`}>This design is sold out right now.</p>
            ) : (
              <>
                <p className={`mt-3 text-[10.5px] font-bold uppercase tracking-[0.14em] ${t.faint}`}>Colour</p>
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
                          setSize((cur) => (cur[r.p.id] && sizeState(c, cur[r.p.id]) !== "ok" ? { ...cur, [r.p.id]: "" } : cur));
                          setErr(false);
                        }}
                        className={[
                          "flex items-center gap-1.5 border px-2 py-1 text-[12px] transition-colors",
                          on ? t.chipOn : t.chipOff,
                          out ? `cursor-not-allowed opacity-45 line-through` : "cursor-pointer",
                        ].join(" ")}
                      >
                        <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/20" style={{ background: c.hex ?? "#cfc6ba" }} aria-hidden="true" />
                        {colourLabel(r.p, c)}
                        {out && <span className="sr-only"> (sold out)</span>}
                      </button>
                    );
                  })}
                </div>

                <p className={`mt-3 text-[10.5px] font-bold uppercase tracking-[0.14em] ${t.faint}`}>Size</p>
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
                          "min-w-[42px] border px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors",
                          on ? t.chipOn : ok ? t.chipOff : t.chipGone,
                          ok ? "cursor-pointer" : "cursor-not-allowed",
                        ].join(" ")}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      })}

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
            {leftNote !== null && qty > leftNote && missing === 0 ? `Only ${leftNote} left in that size.` : `Choose a colour and size for ${missing === 1 ? "the remaining design" : `all ${missing} remaining designs`}.`}
          </p>
        )}
        <button
          type="button"
          onClick={addToBag}
          className={`h-11 w-full cursor-pointer text-[11.5px] font-bold uppercase tracking-[0.14em] transition-colors ${complete ? t.btn : t.btnDim}`}
        >
          {soldOutRows.length ? "Currently unavailable" : `Add to bag — ${inr(price)}`}
        </button>
        {!combo && (
          <Link href={reel.href} className={`mt-3 block text-center text-[11px] uppercase tracking-[0.14em] underline underline-offset-4 ${t.muted}`}>
            Full details
          </Link>
        )}
      </div>
    </div>
  );
}
