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

      {/* Group switcher — plain underlined tabs, mobile only. The desktop
          sidebar (ShopShell) already does this job from 1024px up. */}
      <nav aria-label="Browse bangle types" className="border-b border-line px-4 sm:px-6 lg:hidden">
        <div className="mx-auto flex max-w-[1320px]">
          {groups.map((grp) => {
            const on = grp.slug === g.slug;
            return (
              <Link
                key={grp.slug}
                href={`/shop/${grp.slug}`}
                aria-current={on ? "page" : undefined}
                className={[
                  // min-w-0 is load-bearing: a flex item's default min-width
                  // is auto (its content size), so without this a label
                  // wider than its 1/3 share pushes past its own column and
                  // overlaps the next one instead of wrapping.
                  "min-w-0 flex-1 border-b-2 px-1 py-3 text-center text-[11px] font-bold uppercase leading-tight tracking-[0.04em] transition-colors",
                  on ? "border-ink text-ink" : "border-transparent text-ink-faint",
                ].join(" ")}
              >
                {grp.name}
              </Link>
            );
          })}
        </div>
      </nav>

      <section className="border-b border-line px-4 pb-8 pt-9 sm:px-6 md:pb-10 md:pt-12">
        <div className="mx-auto max-w-[1320px]">
          <h1 className="font-display text-[clamp(30px,4.4vw,54px)]">{g.name}</h1>
          <p className="mt-3 max-w-[56ch] text-[13px] text-ink-soft">{g.blurb}</p>
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

      <ShopBrowser
        sections={ranges.map((c) => ({
          slug: c.slug,
          name: c.name,
          blurb: c.blurb,
          items: listingsIn(c.slug),
        }))}
      />
    </>
  );
}
