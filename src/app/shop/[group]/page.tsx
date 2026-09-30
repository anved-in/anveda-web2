import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import ListingCard from "@/components/ListingCard";
import {
  groups,
  groupBySlug,
  collectionsInGroup,
  listingsIn,
} from "@/lib/catalog";
import { breadcrumbJsonLd } from "@/lib/breadcrumbs";

/**
 * A top-level group — Glass, Ornate or Layering — and the ONLY place its
 * products are listed. Each range is a titled section on this one page, so
 * browsing a group is a scroll, not a click per range. The sidebar and the
 * chips below jump to a section by anchor.
 */

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
  return { title: g.name, description: g.blurb };
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

      <section className="border-b border-line px-4 pb-8 pt-9 sm:px-6 md:pb-10 md:pt-12">
        <div className="mx-auto max-w-[1320px]">
          <h1 className="font-display text-[clamp(30px,4.4vw,54px)]">{g.name}</h1>
          <p className="mt-3 max-w-[56ch] text-[15px] text-ink-soft">{g.blurb}</p>
          <p className="mt-2 text-[12.5px] text-ink-faint">
            {ranges.length} ranges · {total} designs
          </p>

          {/* Jump list. The desktop sidebar does this job from 1024px up. */}
          <div className="no-bar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 lg:hidden">
            {ranges.map((c) => (
              <Link
                key={c.slug}
                href={`#${c.slug}`}
                className="shrink-0 rounded-full border border-line-strong px-3.5 py-1.5 text-[10.5px] uppercase tracking-[0.08em]"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {ranges.map((c, i) => {
        const items = listingsIn(c.slug);
        return (
          <section
            key={c.slug}
            id={c.slug}
            className={[
              "scroll-mt-[64px] px-4 py-12 sm:px-6 md:py-16",
              i % 2 === 1 ? "bg-cream-2" : "",
            ].join(" ")}
          >
            <div className="mx-auto max-w-[1320px]">
              <div className="mb-8 border-b border-line pb-5">
                <span className="eyebrow">
                  {items.length} {items.length === 1 ? "design" : "designs"}
                </span>
                <h2 className="mt-2.5 font-display text-[clamp(24px,3vw,38px)]">
                  {c.name}
                </h2>
                <p className="mt-3 max-w-[60ch] text-[15px] text-ink-soft">{c.blurb}</p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
                {items.map((l, j) => (
                  <ListingCard
                    key={l.variant.colour}
                    l={l}
                    delay={(j % 4) * 70}
                    priority={i === 0 && j < 4}
                    withFamily={false}
                  />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
