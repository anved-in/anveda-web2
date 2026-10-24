import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import ShopBrowser from "@/components/ShopBrowser";
import {
  groups,
  groupBySlug,
  collectionsInGroup,
  listingsIn,
} from "@/lib/catalog";
import { breadcrumbJsonLd } from "@/lib/breadcrumbs";

/**
 * A top-level group, Glass, Ornate or Layering, and the ONLY place its
 * products are listed. Each range is a titled section on this one page, so
 * browsing a group is a scroll, not a click per range. The sidebar and the
 * chips below jump to a section by anchor.
 */

// What each shelf is called in search results (the words shoppers type, then the domain from the layout's template).
const GROUP_SEO: Record<string, { title: string; description: string }> = {
  glass: {
    title: "Glass Bangles Online | Pastel, Jelly & Stone-Set Bangles",
    description:
      "Shop glass bangles online in India: pastel, jelly, petal, phool and stone-set designs in every colour. Handpicked in small batches and delivered across India.",
  },
  ornate: {
    title: "Kada & Statement Bangles Online | Ornate Bangles",
    description:
      "Shop ornate bangles online: wide statement bangles, solid kadas and designer side bangles to build your stack around. Delivered across India.",
  },
  layering: {
    title: "Layering Bangles Online | Border & Gunghroo Bangles",
    description:
      "Layering bangles, border bangles and gunghroo (ghungroo) bangles to stack with your glass bangles. Handpicked colours, delivered across India.",
  },
  kids: {
    title: "Kids Bangles Online | Small Sizes for Little Girls",
    description:
      "Bangles for kids: small sizes made for little hands, in soft colours. Handpicked and packed with care, delivered across India.",
  },
};

export function generateStaticParams() {
  return groups.map((g) => ({ group: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ group: string }>;
}): Promise<Metadata> {
  const { group } = await params;
  const g = groupBySlug(group);
  if (!g) return {};
  const seo = GROUP_SEO[g.slug];
  return {
    title: seo?.title ?? `${g.name} Online`,
    description: seo?.description ?? g.blurb,
    alternates: { canonical: `/shop/${g.slug}/` },
  };
}

export default async function GroupPage({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const { group } = await params;
  const g = groupBySlug(group);
  if (!g) notFound();

  const ranges = collectionsInGroup(g.slug);
  const total = ranges.reduce((n, c) => n + listingsIn(c.slug).length, 0);
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: g.name, url: `/shop/${g.slug}/` },
  ]);

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      {/* Phones hide the visible heading below, so search engines and screen readers still get one (nothing changes on screen). */}
      <h1 className="sr-only lg:hidden">{g.name} Online</h1>

      {/* Desktop only (lg+): the page heading, blurb and ranges/designs
          count. Dropped on mobile entirely, not just hidden behind a
          toggle: the group tab right above already names where you are,
          and each range repeats its own name + blurb immediately above its
          own grid a few lines down, so this block was saying the same two
          things twice before any products even appeared. */}
      <section className="hidden border-b border-line px-4 pb-8 pt-9 sm:px-6 md:pb-10 md:pt-12 lg:block">
        <div className="mx-auto max-w-[1320px]">
          <h1 className="font-display text-[clamp(30px,4.4vw,54px)]">{g.name}</h1>
          <p className="mt-3 max-w-[56ch] text-[13px] text-ink-soft">{g.blurb}</p>
          <p className="mt-2 text-[12.5px] text-ink-faint">
            {ranges.length} ranges · {total} designs
          </p>
        </div>
      </section>

      <ShopBrowser
        sections={ranges.map((c) => ({
          slug: c.slug,
          name: c.name,
          blurb: c.blurb,
          items: listingsIn(c.slug),
        }))}
        header={
          <div className="lg:hidden">
            {/* Group switcher, plain underlined tabs. The desktop sidebar
                (ShopShell) does this job from 1024px up instead. */}
            <nav aria-label="Browse bangle types" className="border-b border-line px-4 sm:px-6">
              <div className="mx-auto flex max-w-[1320px]">
                {groups.map((grp) => {
                  const on = grp.slug === g.slug;
                  return (
                    <Link
                      key={grp.slug}
                      href={`/shop/${grp.slug}`}
                      aria-current={on ? "page" : undefined}
                      className={[
                        // min-w-0 is load-bearing: a flex item's default
                        // min-width is auto (its content size), so without
                        // this a label wider than its 1/3 share pushes past
                        // its own column and overlaps the next one instead
                        // of shrinking. overflow-hidden + ellipsis is the
                        // fallback if a label is ever still too wide at this
                        // size, truncating beats overlapping again.
                        "min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap border-b-2 px-1 py-3 text-center text-[9px] font-normal uppercase tracking-[0.02em] transition-colors",
                        on ? "border-ink text-ink" : "border-transparent text-ink-faint",
                      ].join(" ")}
                    >
                      {grp.short}
                    </Link>
                  );
                })}
              </div>
            </nav>

          </div>
        }
      />
    </>
  );
}
