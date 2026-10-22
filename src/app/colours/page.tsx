import type { Metadata } from "next";
import Link from "@/components/Link";
import { colourFlow } from "@/lib/colourflow";
import { asset } from "@/lib/site";
import { imgSrc, imgSrcSmall, framingStyle, colourLabel } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop by colour",
  description: "Every ANVEDA bangle, laid out colour by colour.",
};

/**
 * One wall of photographs, no text: every bangle in stock, ordered so the
 * colours flow from one into the next. Each tile opens that colourway.
 */
export default async function ColoursPage() {
  const tiles = await colourFlow();
  return (
    <section aria-label="All bangles by colour">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {tiles.map((l, i) => (
          <Link
            key={`${l.product.id}-${l.variant.colour}`}
            href={l.href}
            aria-label={`${l.product.name} · ${colourLabel(l.product, l.variant)}`}
            className="relative block aspect-square overflow-hidden bg-cream-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset(imgSrcSmall(l.variant.image))}
              srcSet={`${asset(imgSrcSmall(l.variant.image))} 480w, ${asset(imgSrc(l.variant.image))} 1000w`}
              sizes="(max-width: 639px) 34vw, (max-width: 767px) 25vw, (max-width: 1023px) 17vw, 12.5vw"
              alt=""
              className="h-full w-full object-cover"
              style={framingStyle(l.variant)}
              loading={i < 12 ? "eager" : "lazy"}
              decoding="async"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
