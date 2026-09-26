import raw from "@/data/reels.json";
import { products, type Product } from "./catalog";

/**
 * One reel in the vertical feed.
 *
 * Two sources, and the priority is deliberate: an uploaded video always wins
 * over an Instagram link. A self-hosted file plays inline, silently, and
 * scroll-snaps like Shorts; an Instagram embed cannot be restyled, shows its
 * own chrome and login prompts, and breaks the feel. The link is the fallback
 * for reels that have not been uploaded yet — the card still shows the cover
 * and the Buy button, and "Watch on Instagram" opens the real thing.
 */
export interface Reel {
  id: string;
  /** Uploaded file in /public/video/reels. Takes priority when present. */
  video: string | null;
  /** Instagram permalink. Used only when `video` is null. */
  instagram: string | null;
  /** Portrait still shown before play, and as the poster frame. */
  cover: string;
  title: string;
  caption: string;
  /** Product this reel sells — drives the Buy button. */
  productId: string;
  /** Optional colourway to preselect on the product page. */
  colour: string | null;
}

const data = raw as { reels: Reel[] };

export interface ResolvedReel extends Reel {
  product: Product | undefined;
  /** Where the Buy button goes. */
  href: string;
  /** True when this plays inline rather than linking out. */
  playable: boolean;
}

export const reels = (): ResolvedReel[] =>
  data.reels
    .map((r) => {
      const product = products.find((p) => p.id === r.productId);
      return {
        ...r,
        product,
        href: product
          ? `/product/${product.id}/${r.colour ? `?c=${encodeURIComponent(r.colour)}` : ""}`
          : "/shop/glass/",
        // An uploaded file always wins; see the note above.
        playable: Boolean(r.video),
      };
    })
    // A reel with neither a video nor a link is not a reel.
    .filter((r) => r.video || r.instagram);

export const hasReels = (): boolean => reels().length > 0;
