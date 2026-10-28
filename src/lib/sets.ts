import raw from "@/data/sets.json";
import { products, imgSrc, type Product } from "./catalog";
import type { ResolvedReel, ReelCombo } from "./reels";

/**
 * Styled Sets: the same combo picker as a reel (ReelPicker/ComboSheet, unchanged), but a single still
 * photo and its own page instead of a video in a feed. `ResolvedReel`'s shape is reused as-is (video and
 * instagram simply stay null, playable stays false) so the existing picker needs no changes at all.
 */
export interface StyledSet {
  id: string;
  cover: string;
  title: string;
  caption: string;
  productId: string;
  colour: string | null;
  combo?: ReelCombo | null;
}

const data = raw as { sets: StyledSet[] };

export const sets = (): ResolvedReel[] =>
  data.sets
    .map((s) => {
      const product = products.find((p) => p.id === s.productId);
      return {
        ...s,
        video: null,
        instagram: null,
        cover: (s.cover || (product?.image ? imgSrc(product.image) : "")) as string,
        product,
        href: product ? `/product/${product.id}/${s.colour ? `?c=${encodeURIComponent(s.colour)}` : ""}` : "/shop/glass/",
        playable: false,
      };
    })
    .filter((s) => s.cover);

export const setById = (id: string): ResolvedReel | undefined => sets().find((s) => s.id === id);

export const hasSets = (): boolean => sets().length > 0;

export type { Product };
