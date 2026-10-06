"use client";

import Link from "@/components/Link";
import Tilt from "./Tilt";

export interface CategoryItem {
  slug: string;
  name: string;
  href: string;
  src: string;
  srcSmall: string;
}

/**
 * Shop By Category: the same tiles as before (a swipeable rail on phones, five
 * across on desktop), each now tilting toward the pointer under a glare.
 */
export default function CategoryTiles({ items }: { items: CategoryItem[] }) {
  return (
    <div className="no-bar mt-9 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:gap-6 md:overflow-visible">
      {items.map((c) => (
        <Tilt key={c.slug} className="w-[46%] shrink-0 snap-start md:w-auto" max={6}>
          <Link href={c.href} className="group block">
            <div className="aspect-square overflow-hidden bg-cream-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.src}
                srcSet={`${c.srcSmall} 480w, ${c.src} 1000w`}
                sizes="(max-width: 767px) 46vw, 20vw"
                alt=""
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="pt-3 text-center text-[13.5px] transition-colors group-hover:text-maroon">
              {c.name}
            </div>
          </Link>
        </Tilt>
      ))}
    </div>
  );
}
