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

      {/* Desktop only (lg+): the page heading, blurb and ranges/designs
          count. Dropped on mobile entirely, not just hidden behind a
          toggle — the group tab right above already names where you are,
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
            {/* Group switcher — plain underlined tabs. The desktop sidebar
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
                        // size — truncating beats overlapping again.
                        "min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap border-b-2 px-1 py-3 text-center text-[9px] font-normal uppercase tracking-[0.02em] transition-colors",
                        on ? "border-ink text-ink" : "border-transparent text-ink-faint",
                      ].join(" ")}
                    >
                      {grp.name}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Jump list straight to a range by anchor — the desktop
                sidebar does this job from 1024px up instead. */}
            <div className="no-bar flex gap-2 overflow-x-auto border-b border-line px-4 py-3 sm:px-6">
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
        }
      />
    </>
  );
}
