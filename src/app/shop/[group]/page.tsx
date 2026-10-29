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

interface GroupGuide {
  title: string;
  seoTitle: string;
  seoDescription: string;
  leadParagraph: string;
  paragraphs: string[];
  faqs?: { q: string; a: string }[];
}

const GROUP_CONTENT: Record<string, GroupGuide> = {
  glass: {
    title: "Glass Bangles Online India",
    seoTitle: "Glass Bangles Online India | Pastel, Jelly & Stone-Set Bangles",
    seoDescription:
      "Shop authentic glass bangles online in India: pastel, jelly, petal, phool and stone-set designs in 90+ colours. Handpicked in small batches and delivered across India.",
    leadParagraph:
      "Glass bangles hold a cherished place in Indian tradition and everyday elegance, celebrated for their delicate chime, vibrant brilliance, and timeless cultural heritage. At ANVEDA, we curate small, handcrafted batches from master artisans across heritage bangle craft centers in India, offering 90+ nuanced shades.",
    paragraphs: [
      "Our core glass collection brings together silky pastel palettes, ultra-glossy jelly finishes, intricate cut-glass patterns, and shimmering stone-set floral work. Whether you are seeking a traditional scarlet red set for bridal celebrations, Karwa Chauth, or Diwali, subtle emerald and bottle greens for festive silk sarees, or soothing blush and mint pastels for contemporary occasions, our collection is curated to match every outfit.",
      "Every ANVEDA glass bangle set is available in standard Indian sizing from 2.2 (extra small) to 2.12 (large). Each parcel is shipped in a corrugated packaging box with bubble wrap and proper safety measures, for safe, crack-free delivery to your doorstep anywhere in India.",
    ],
    faqs: [
      {
        q: "Where can I buy authentic glass bangles online in India?",
        a: "You can purchase authentic, handcrafted glass bangles directly at ANVEDA (www.anveda.in). We stock 90+ curated colours across pastel, jelly, and stone-cut finishes with safe delivery to all Indian PIN codes.",
      },
      {
        q: "What sizes are available in glass bangles?",
        a: "Our glass bangles are stocked in standard Indian sizing: 2.2, 2.4, 2.6, 2.8, and select designs in 2.10 and 2.12. Check our Sizing Guide to measure your inner wrist diameter accurately.",
      },
      {
        q: "How are fragile glass bangles packed for delivery?",
        a: "Every bangle order ships in a corrugated packaging box with bubble wrap and proper safety measures to protect it in transit.",
      },
    ],
  },
  ornate: {
    title: "Kada & Statement Glass Bangles",
    seoTitle: "Kada & Statement Glass Bangles Online India | Ornate Bangles",
    seoDescription:
      "Shop ornate and statement glass bangles online: wide bridal pieces, solid kadas and designer side bangles to build your stack. Delivered across India.",
    leadParagraph:
      "Ornate bangles and kadas provide the focal point and grandeur of any traditional bangle stack. Crafted with raised stone-work, antique detailing, and solid profiles, our ornate pieces lend weight and regal beauty to your wrists.",
    paragraphs: [
      "From standalone statement kadas that pair effortlessly with fusion and contemporary festive wear, to intricate designer side bangles meant to anchor your glass dozens, this collection is made for brides, wedding guests, and festive occasions.",
      "Finished with premium stone settings and rounded inner borders for all-day comfort, our ornate bangles are hand-tested for finish quality and delivered safely across India.",
    ],
    faqs: [
      {
        q: "How do I style kada and statement bangles?",
        a: "Place a statement kada in the center of your wrist or wear matching pairs on either end of a 12-piece glass bangle stack to give your ensemble structure and bridal richness.",
      },
    ],
  },
  layering: {
    title: "Layering Bangles & Ghungroo Bangles",
    seoTitle: "Layering Bangles & Ghungroo Glass Bangles Online India",
    seoDescription:
      "Layering glass bangles, border bangles and gunghroo (ghungroo) bangles to stack with traditional glass bangles. Handpicked colours, delivered across India.",
    leadParagraph:
      "Layering bangles are the secret to building a cohesive, magazine-worthy bangle arrangement. Our collection features slim textured borders, metallic spacers, and chime-producing ghungroo bangles.",
    paragraphs: [
      "Interspersing delicate ghungroo bangles between solid glass sets introduces the iconic rhythmic chiming synonymous with Indian celebrations, while border bangles provide clean transitions between contrasting colours.",
      "Explore diverse tones and textures crafted to harmonize seamlessly with both plain glass bangles and ornate kadas.",
    ],
  },
  kids: {
    title: "Kids Glass Bangles Online",
    seoTitle: "Kids Glass Bangles Online India | Small Sizes for Girls",
    seoDescription:
      "Glass bangles for kids and baby girls: small sizes (1.10 to 2.0) crafted for little hands in sweet pastel colours. Handpicked and packed safely across India.",
    leadParagraph:
      "Finding authentic glass bangles in delicate proportions for infants, toddlers, and young girls is often difficult. ANVEDA’s Lil Charms collection features petite sizes 1.10, 1.12, 1.14, and 2.0.",
    paragraphs: [
      "Designed with smooth, polished inner rims for gentle skin contact, our kids' glass bangles come in enchanting pastel and jelly shades perfect for naming ceremonies, birthdays, and festivals.",
      "Shipped in a corrugated packaging box with bubble wrap and proper safety measures, for safe arrival anywhere in India.",
    ],
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
  const content = GROUP_CONTENT[g.slug];
  return {
    title: content?.seoTitle ?? `${g.name} Online`,
    description: content?.seoDescription ?? g.blurb,
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

  const guide = GROUP_CONTENT[g.slug];
  const faqJsonLd = guide?.faqs?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: guide.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a,
          },
        })),
      }
    : null;

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {faqJsonLd && (
        /* eslint-disable-next-line react/no-danger */
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

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

      {guide && (
        <section aria-label="Buying guide and collection background" className="border-t border-line bg-cream-1/40 px-4 py-12 sm:px-6 md:py-16">
          <div className="mx-auto max-w-[880px]">
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-faint">
              Guide & Heritage
            </span>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl text-ink">
              {guide.title}
            </h2>
            <p className="mt-4 text-[13.5px] leading-relaxed text-ink-soft">
              {guide.leadParagraph}
            </p>
            {guide.paragraphs.map((p, i) => (
              <p key={i} className="mt-3 text-[13.5px] leading-relaxed text-ink-soft">
                {p}
              </p>
            ))}

            {guide.faqs && guide.faqs.length > 0 && (
              <div className="mt-8 border-t border-line pt-8">
                <h3 className="text-base font-semibold text-ink">
                  Frequently Asked Questions
                </h3>
                <dl className="mt-4 space-y-4">
                  {guide.faqs.map((faq, i) => (
                    <div key={i} className="rounded-lg bg-white/70 p-4 border border-line/60">
                      <dt className="text-[13.5px] font-medium text-ink">
                        {faq.q}
                      </dt>
                      <dd className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                        {faq.a}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
