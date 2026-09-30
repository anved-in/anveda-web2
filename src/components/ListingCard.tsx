import Link from "@/components/Link";
import { imgSrc, imgSrcSmall, listingPrice, listingTitle, type Listing } from "@/lib/catalog";
import { asset } from "@/lib/site";
import Price from "./Price";
import FavButton from "./FavButton";

/**
 * Grid tile for one colourway, laid out the way the reference storefront lays
 * its product cards out: a plain square photo, then centred text beneath it.
 *
 * Deliberately only three things under the photo — name, price, colour count.
 * Pack size ("dozen", "set of 2") is never shown anywhere on the storefront:
 * it made the grid read as a wholesale list rather than a shop.
 */
export default function ListingCard({
  l,
  delay = 0,
  priority = false,
  withFamily = true,
}: {
  l: Listing;
  delay?: number;
  priority?: boolean;
  /** false on a collection page, where the heading already names the family. */
  withFamily?: boolean;
}) {
  const { product: p, variant: v, href } = l;
  const showColour = p.variants.length > 1;
  const price = listingPrice(l);

  return (
    <article className="reveal group relative" data-d={delay}>
      <FavButton id={p.id} colour={v.colour} name={listingTitle(p, v, withFamily)} />
      <Link href={href} className="block">
        <div className="relative aspect-square overflow-hidden bg-cream-2">
          {/* Plain <img>: the site builds to a static export, where the Next
              image optimizer is unavailable. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset(imgSrc(v.image))}
            srcSet={`${asset(imgSrcSmall(v.image))} 480w, ${asset(imgSrc(v.image))} 1000w`}
            sizes="(max-width: 767px) 46vw, (max-width: 1023px) 30vw, 300px"
            alt={`${p.name}${showColour ? ` — ${v.colour}` : ""}`}
            className={`h-full w-full object-cover ${v.zoom && v.zoom !== 1 ? "" : "transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]"}`}
            style={{
              ...(v.focal ? { objectPosition: v.focal } : undefined),
              // An inline transform beats the group-hover Tailwind utility
              // outright (higher specificity, can't compose with it), so a
              // zoomed photo loses the hover micro-effect — a fine trade for
              // not fighting CSS specificity over a decorative detail.
              ...(v.zoom && v.zoom !== 1 ? { transform: `scale(${v.zoom})` } : undefined),
            }}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
          />
          {!v.inStock && (
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/95 px-4 py-3 text-[10px] font-bold uppercase leading-tight tracking-[0.1em] text-ink">
              Sold
              <br />
              out
            </span>
          )}
        </div>

        <div className="px-1 pt-3.5 text-center">
          <h3 className="text-[13.5px] leading-snug">
            {listingTitle(p, v, withFamily)}
          </h3>
          <div className="mt-1.5">
            <Price price={price} size="sm" />
          </div>
          {/* No "N colours" line: every colourway is already its own tile in
              the grid, so the count restated the obvious under each one. */}
        </div>
      </Link>
    </article>
  );
}
