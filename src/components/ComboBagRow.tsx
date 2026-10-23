"use client";

import { asset } from "@/lib/site";
import { colourLabel, framingStyle, imgSrcSmall, inr, productById } from "@/lib/catalog";
import { lineTotal, type Line } from "@/lib/cart";
import QtyStepper from "@/components/QtyStepper";

/** A combination in the bag or on the checkout summary: the designs it holds, the one price, quantity and remove. */
export default function ComboBagRow({
  l,
  setQty,
  remove,
  pad = "py-5",
}: {
  l: Line;
  setQty: (id: string, size: string, colour: string, qty: number) => void;
  remove: (id: string, size: string, colour: string) => void;
  pad?: string;
}) {
  const c = l.combo!;
  return (
    <div className={`flex gap-3.5 border-b border-line ${pad}`}>
      <div className="flex w-[70px] shrink-0 flex-col gap-1" aria-hidden="true">
        {c.picks.slice(0, 3).map((k, i) => {
          const p = productById(k.id);
          const v = p?.variants.find((x) => x.colour === k.colour);
          return v ? (
            // eslint-disable-next-line @next/next/no-img-element
            <span key={`${k.id}-${i}`} className="block h-[40px] w-full overflow-hidden">
              <img src={asset(imgSrcSmall(v.image))} alt="" className="h-full w-full object-cover" style={framingStyle(v)} loading="lazy" />
            </span>
          ) : null;
        })}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-maroon">Combo</div>
        <div className="mt-0.5 truncate text-[14px] font-semibold">{c.title}</div>
        <ul className="mt-1 space-y-0.5 text-[12px] text-ink-soft">
          {c.picks.map((k, i) => {
            const p = productById(k.id);
            const v = p?.variants.find((x) => x.colour === k.colour);
            return (
              <li key={`${k.id}-${i}`}>
                {p?.name ?? k.id}
                {v && p ? ` · ${colourLabel(p, v)}` : ` · ${k.colour}`} · Size {k.size}
                {k.qty > 1 ? ` × ${k.qty}` : ""}
              </li>
            );
          })}
        </ul>
        <div className="mt-2.5 flex items-center justify-between gap-3">
          <QtyStepper
            qty={l.qty}
            onDecrease={() => setQty(l.id, l.size, l.colour, l.qty - 1)}
            onIncrease={() => setQty(l.id, l.size, l.colour, l.qty + 1)}
            label={c.title}
            size="sm"
          />
          <span className="text-[14px] font-semibold">{inr(lineTotal(l))}</span>
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
}
