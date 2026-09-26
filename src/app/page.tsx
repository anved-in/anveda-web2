import Link from "@/components/Link";
import { collections, products, allListings, imgSrc, type Listing, rangeHref } from "@/lib/catalog";
import { asset, SITE } from "@/lib/site";
import ListingCard from "@/components/ListingCard";
import SectionHead from "@/components/SectionHead";
import HeroSlider from "@/components/HeroSlider";

/** One listing for a product, at its lead colourway (or the nth shade). */
const lead = (slug: string, n = 0): Listing => {
  const p = products.find((x) => x.collection === slug)!;
  const v = p.variants[Math.min(n, p.variants.length - 1)];
  return {
    product: p,
    variant: v,
    href: `/product/${p.id}/?c=${encodeURIComponent(v.colour)}`,
  };
};

// New Arrivals — the lead shade of the first four families.
const arrivals: Listing[] = collections.slice(0, 4).map((c) => lead(c.slug));

// Best Sellers — a different four, at a different shade, so the two grids do
// not repeat the same photographs down the page.
const bestsellers: Listing[] = collections.slice(4, 8).map((c) => lead(c.slug, 1));

// Hero slides: three wide, worked families make the strongest opening images.
const heroSlides = ["statement-bangles", "kada", "border-bangles"]
  .map((s) => collections.find((c) => c.slug === s))
  .filter((c): c is NonNullable<typeof c> => Boolean(c))
  .map((c) => {
    const l = lead(c.slug);
    return {
      image: asset(imgSrc(l.variant.image)),
      title: c.name,
      blurb: c.blurb,
      href: rangeHref(c.slug),
    };
  });

export default function Home() {
  return (
    <>
      {/* ---------------------------------------------------------- hero */}
      <HeroSlider slides={heroSlides} />

      {/* -------------------------------------------------- new arrivals */}
      <section className="px-4 py-12 sm:px-6 md:py-16">
        <div className="mx-auto max-w-[1320px]">
          <SectionHead
            title="New Arrivals"
            sub="Freshly picked, straight from the latest batch"
          />
          <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4 md:gap-x-6">
            {arrivals.map((l, i) => (
              <ListingCard key={l.href} l={l} delay={i * 60} priority={i < 4} />
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------- shop by category */}
      <section className="px-4 py-12 sm:px-6 md:py-16">
        <div className="mx-auto max-w-[1320px]">
          <SectionHead title="Shop By Category" />
          <div className="no-bar mt-9 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:gap-6 md:overflow-visible">
            {collections.map((c) => (
              <Link
                key={c.slug}
                href={rangeHref(c.slug)}
                className="group w-[46%] shrink-0 snap-start md:w-auto"
              >
                <div className="aspect-square overflow-hidden bg-cream-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset(imgSrc(c.cover))}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="pt-3 text-center text-[13.5px] transition-colors group-hover:text-maroon">
                  {c.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- best sellers */}
      <section className="px-4 py-12 sm:px-6 md:py-16">
        <div className="mx-auto max-w-[1320px]">
          <SectionHead
            title="Best Sellers"
            sub="The shades that keep going out of stock"
          />
          <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4 md:gap-x-6">
            {bestsellers.map((l, i) => (
              <ListingCard key={l.href} l={l} delay={i * 60} />
            ))}
          </div>
          <div className="mt-11 text-center">
            <Link
              href="/shop/glass/"
              className="inline-block border border-ink px-9 py-3.5 text-[11.5px] uppercase tracking-[0.16em] transition-colors hover:bg-ink hover:text-white"
            >
              View all {allListings().length} designs
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ our story */}
      <section className="bg-cream-2 px-4 py-12 sm:px-6 md:py-16">
        <div className="mx-auto max-w-[1320px]">
          <SectionHead title="Our Story" />
          <div className="mt-9 flex flex-wrap items-center gap-8 md:flex-nowrap md:gap-14">
            <div className="w-full md:w-1/2">
              <div className="reveal aspect-[4/3] overflow-hidden bg-cream-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset(imgSrc(collections[0].cover))}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
            <div className="reveal w-full md:w-1/2">
              <p className="text-[15px] leading-relaxed text-ink-soft">
                ANVEDA is more than a bangle shop. Every batch is chosen by hand
                — held up to the light, checked for the cut and the colour, and
                kept only if it is good enough to gift.
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
                Glass, kundan and antique pieces for the weddings, the festivals
                and the ordinary Tuesdays that deserve them too. Packed with
                care and delivered right across India.
              </p>
              <Link
                href="/about"
                className="mt-7 inline-block border border-ink px-8 py-3.5 text-[11.5px] uppercase tracking-[0.16em] transition-colors hover:bg-ink hover:text-white"
              >
                Read our story
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ instagram */}
      <section className="px-4 py-12 sm:px-6 md:py-16">
        <div className="mx-auto max-w-[1320px]">
          <SectionHead title="Follow us @anveda.in" />
          <div className="mt-9 grid grid-cols-3 gap-2.5 md:grid-cols-6 md:gap-4">
            {collections.slice(0, 6).map((c) => (
              <a
                key={c.slug}
                href={SITE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="reveal group relative aspect-square overflow-hidden bg-cream-2"
                aria-label="ANVEDA on Instagram"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset(imgSrc(c.cover))}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  loading="lazy"
                  decoding="async"
                />
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
