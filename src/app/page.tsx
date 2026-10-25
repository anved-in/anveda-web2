import type { Metadata } from "next";
import Link from "@/components/Link";
import {
  allListings,
  collections,
  imgSrc,
  imgSrcSmall,
  newArrivalsManual,
  products,
  rangeHref,
  type Listing,
} from "@/lib/catalog";
import { asset, SITE } from "@/lib/site";
import { sc, scImage, fill } from "@/lib/siteContent";
import { HOME_TITLE, HOME_DESCRIPTION } from "@/lib/seo";
import ListingCard from "@/components/ListingCard";
import SectionHead from "@/components/SectionHead";
import Testimonials from "@/components/Testimonials";
import Hero3D from "@/components/home/Hero3D";
import Tilt from "@/components/home/Tilt";
import CategoryTiles from "@/components/home/CategoryTiles";

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

// New Arrivals: the owner's own picks, in the order set in the CMS (Homepage page).
// Nothing picked there (or none still exist) = the lead shade of the first four families.
const picked: Listing[] = newArrivalsManual.flatMap((id) => {
  for (const p of products) {
    const v = p.variants.find((x) => x.id === id);
    if (v) return [{ product: p, variant: v, href: `/product/${p.id}/?c=${encodeURIComponent(v.colour)}` }];
  }
  return [];
});
const arrivals: Listing[] = picked.length ? picked : collections.slice(0, 4).map((c) => lead(c.slug));

// Best Sellers: a different four, at a different shade, so the two grids do
// not repeat the same photographs down the page.
const bestsellers: Listing[] = collections.slice(4, 8).map((c) => lead(c.slug, 1));

// The owner can change the home page's words and photos in the CMS (CMS > Website pages); a box left alone keeps the
// wording / photo written here, and a slide's title, text, photo and link left empty come from its design.
export function generateMetadata(): Metadata {
  const title = sc("home.seo.title", HOME_TITLE);
  const description = sc("home.seo.description", HOME_DESCRIPTION);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "./" },
    openGraph: { title, description, type: "website", siteName: SITE.name, locale: "en_IN" },
    twitter: { card: "summary_large_image", title, description },
  };
}

// Hero slides: three wide, worked families make the strongest opening images.
const heroSlides = ["statement-bangles", "kada", "border-bangles"]
  .map((s) => collections.find((c) => c.slug === s))
  .filter((c): c is NonNullable<typeof c> => Boolean(c))
  .map((c, i) => {
    const l = lead(c.slug);
    const n = i + 1;
    const own = scImage(`home.hero${n}.image`);
    return {
      image: asset(imgSrc(own ?? l.variant.image)),
      title: sc(`home.hero${n}.title`, c.name),
      blurb: sc(`home.hero${n}.text`, c.blurb ?? ""),
      href: sc(`home.hero${n}.link`, rangeHref(c.slug)),
      eyebrow: sc("home.hero.eyebrow", "The ANVEDA Collection"),
      button: sc("home.hero.button", "Shop now"),
    };
  });

// Shop By Category tiles.
const categories = collections.map((c) => ({
  slug: c.slug,
  name: c.name,
  href: rangeHref(c.slug),
  src: asset(imgSrc(c.cover)),
  srcSmall: asset(imgSrcSmall(c.cover)),
}));

export default function Home() {
  return (
    <>
      {/* ---------------------------------------------------------- hero */}
      <Hero3D slides={heroSlides} />

      {/* The page's one heading, for search engines and screen readers (nothing shows on screen). The plain-words
          description of the shop and the Privacy / Terms links live in the footer. */}
      <h1 className="sr-only">ANVEDA: handpicked glass bangles online, delivered across India</h1>

      {/* -------------------------------------------------- new arrivals */}
      <section className="px-4 py-12 sm:px-6 md:py-16">
        <div className="mx-auto max-w-[1320px]">
          <SectionHead
            title={sc("home.arrivals.title", "New Arrivals")}
            sub={sc("home.arrivals.sub", "Freshly picked, straight from the latest batch")}
            viewAllHref="/shop/glass"
          />
          <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4 md:gap-x-6">
            {arrivals.map((l, i) => (
              <Tilt key={l.href}>
                <ListingCard l={l} delay={i * 60} priority={i < 4} />
              </Tilt>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------- shop by category */}
      <section className="px-4 py-12 sm:px-6 md:py-16">
        <div className="mx-auto max-w-[1320px]">
          <SectionHead title={sc("home.categories.title", "Shop By Category")} />
          <CategoryTiles items={categories} />
        </div>
      </section>

      {/* -------------------------------------------------- best sellers */}
      <section className="px-4 py-12 sm:px-6 md:py-16">
        <div className="mx-auto max-w-[1320px]">
          <SectionHead
            title={sc("home.best.title", "Best Sellers")}
            sub={sc("home.best.sub", "The shades that keep going out of stock")}
            viewAllHref="/shop/glass"
          />
          <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4 md:gap-x-6">
            {bestsellers.map((l, i) => (
              <Tilt key={l.href}>
                <ListingCard l={l} delay={i * 60} />
              </Tilt>
            ))}
          </div>
          <div className="mt-11 text-center">
            <Link
              href="/shop/glass/"
              className="rounded-md inline-block border border-ink px-9 py-3.5 text-[11.5px] uppercase tracking-[0.16em] transition-colors hover:bg-ink hover:text-white"
            >
              {fill(sc("home.best.button", "View all {count} designs"), { count: allListings().length })}
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ our story */}
      <section className="bg-cream-2 px-4 py-12 sm:px-6 md:py-16">
        <div className="mx-auto max-w-[1320px]">
          <SectionHead title={sc("home.story.title", "Our Story")} />
          <div className="mt-9 flex flex-wrap items-center gap-8 md:flex-nowrap md:gap-14">
            <div className="w-full md:w-1/2">
              <Tilt max={4}>
                <div className="reveal aspect-[4/3] overflow-hidden bg-cream-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset(imgSrc(scImage("home.story.image") ?? collections[0].cover))}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </Tilt>
            </div>
            <div className="reveal w-full md:w-1/2">
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
                {sc("home.story.p1", "ANVEDA is more than a bangle shop. Every batch is chosen by hand, held up to the light, checked for the cut and the colour, and kept only if it is good enough to gift.")}
              </p>
              <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
                {sc("home.story.p2", "Glass, kundan and antique pieces for the weddings, the festivals and the ordinary Tuesdays that deserve them too. Packed with care, set by set.")}
              </p>
              <Link
                href="/about"
                className="rounded-md mt-7 inline-block border border-ink px-8 py-3.5 text-[11.5px] uppercase tracking-[0.16em] transition-colors hover:bg-ink hover:text-white"
              >
                {sc("home.story.button", "Read our story")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Testimonials />

      {/* ------------------------------------------------------ instagram */}
      <section className="px-4 py-12 sm:px-6 md:py-16">
        <div className="mx-auto max-w-[1320px]">
          <SectionHead title={sc("home.insta.title", "Follow us @anveda.in")} />
          <div className="mt-9 grid grid-cols-3 gap-2.5 md:grid-cols-6 md:gap-4">
            {collections.slice(0, 6).map((c, i) => {
              const own = scImage(`home.insta${i + 1}.image`);
              return (
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
                  src={asset(imgSrcSmall(own ?? c.cover))}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  loading="lazy"
                  decoding="async"
                />
              </a>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
