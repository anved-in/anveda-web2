"use client";

import { products, colourFamily, type Listing } from "@/lib/catalog";
import { useSelectedColour } from "@/components/ColourContext";
import ListingCard from "@/components/ListingCard";

type Lab = [number, number, number];
const dist = (a: Lab, b: Lab) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/**
 * "You may also like", in the colour the shopper is looking at. For every other
 * design we take its colourway whose photo is closest in colour (hue, saturation
 * and lightness together) to the one on screen; the four designs with the
 * closest match are shown. A design with no similar colour simply ranks lower,
 * so when the same colour is not available other colours fill the row.
 * Sold-out colourways rank last.
 */
export default function RelatedByColour({
  currentId,
  labs,
  count = 4,
}: {
  currentId: string;
  labs: Record<string, Lab>;
  count?: number;
}) {
  const { colour } = useSelectedColour();
  const target = labs[`${currentId}|${colour}`];
  const targetFamily = colourFamily(colour);

  const scored = products
    .filter((x) => x.id !== currentId)
    .map((x, order) => {
      let best = x.variants[0];
      let bestScore = Infinity;
      for (const v of x.variants) {
        const lab = labs[`${x.id}|${v.colour}`];
        const d = target && lab ? dist(target, lab) : 0.4;
        // Same colour word in the name ("Pink" ~ "Rose Pink") beats everything; a different
        // colour word ranks below the photo-colour matches; no colour word: photo colour only.
        const fam = colourFamily(v.colour);
        const base = targetFamily && fam ? (fam === targetFamily ? -1 + Math.min(d, 0.4) * 0.5 : d + 0.3) : d;
        const score = base + (v.inStock ? 0 : 5);
        if (score < bestScore) {
          bestScore = score;
          best = v;
        }
      }
      return { x, v: best, score: bestScore, order };
    })
    .sort((a, b) => a.score - b.score || a.order - b.order)
    .slice(0, count);

  const listings: Listing[] = scored.map(({ x, v }) => ({
    product: x,
    variant: v,
    href: `/product/${x.id}/?c=${encodeURIComponent(v.colour)}`,
  }));

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4 md:gap-x-6">
      {listings.map((l, i) => (
        // `instant`: this list is rebuilt every time the shopper taps another colour, and a card that mounts later is never
        // seen by the page's scroll-reveal observer, so it would sit at opacity 0 (clickable but invisible).
        <ListingCard key={l.product.id} l={l} delay={(i % 4) * 70} instant />
      ))}
    </div>
  );
}
