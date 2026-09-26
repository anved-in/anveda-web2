import Link from "@/components/Link";
import { asset } from "@/lib/site";
import type { ResolvedReel } from "@/lib/reels";

/**
 * Reels landing view: a plain grid of covers, the way Instagram's own Reels
 * tab opens — not the swipeable player. Tapping a tile is what drops into
 * that (see ReelsRoute), starting on the tile that was tapped.
 */
export default function ReelsGrid({ items }: { items: ResolvedReel[] }) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-[28px]">Reels are coming</h1>
        <p className="mt-3 max-w-[42ch] text-[14px] text-ink-soft">
          We are filming the new batches now. In the meantime, everything we
          carry is in the shop.
        </p>
        <Link
          href="/shop/glass/"
          className="mt-6 border border-ink px-8 py-3.5 text-[11.5px] uppercase tracking-[0.16em] transition-colors hover:bg-ink hover:text-white"
        >
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] py-[1px] sm:px-4 sm:py-6">
      <div className="grid grid-cols-3 gap-[2px] sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map((r) => (
          <Link
            key={r.id}
            href={`/reels/?v=${encodeURIComponent(r.id)}`}
            className="group relative block aspect-[9/16] overflow-hidden bg-cream-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset(r.cover)}
              alt={r.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            {/* The small reel glyph is Instagram's own marker for "this tile
                is a reel, not a photo" — keeping it, rather than a big central
                play button, is what makes the grid read as Instagram's. */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="pointer-events-none absolute bottom-2 left-2 drop-shadow-[0_1px_3px_rgba(0,0,0,.6)]"
            >
              <rect x="2" y="4" width="20" height="16" rx="3" />
              <path d="M2 9h20M8 4l3 5M14 4l3 5" />
            </svg>
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="block truncate text-[11px] font-semibold text-white">
                {r.title}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
