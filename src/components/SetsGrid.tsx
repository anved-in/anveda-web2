"use client";

import { useState } from "react";
import Link from "@/components/Link";
import { asset } from "@/lib/site";
import ComboSheet from "@/components/ComboSheet";
import type { ResolvedReel } from "@/lib/reels";

/**
 * Styled Sets landing view: a plain grid of photos. Tapping a tile opens the same combo
 * picker a reel uses (ComboSheet/ReelPicker, unchanged), right there — no video, no feed.
 */
export default function SetsGrid({ items }: { items: ResolvedReel[] }) {
  const [open, setOpen] = useState<ResolvedReel | null>(null);

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-[28px]">Styled Sets are coming</h1>
        <p className="mt-3 max-w-[42ch] text-[14px] text-ink-soft">
          We are putting new sets together now. In the meantime, everything we carry is in the shop.
        </p>
        <Link
          href="/shop/glass/"
          className="rounded-md mt-6 border border-ink px-8 py-3.5 text-[11.5px] uppercase tracking-[0.16em] transition-colors hover:bg-ink hover:text-white"
        >
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-[26px]">Styled Sets</h1>
      <p className="mt-2 max-w-[56ch] text-[14px] text-ink-soft">
        Designs we have put together on purpose. Pick your colours, buy the set.
      </p>
      <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
        {items.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setOpen(s)}
            className="group relative block aspect-[3/4] w-full overflow-hidden rounded-md bg-cream-2 text-left"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset(s.cover)}
              alt={s.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-3">
              <span className="block truncate text-[13px] font-semibold text-white">{s.title}</span>
            </span>
          </button>
        ))}
      </div>
      {open && <ComboSheet reel={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
