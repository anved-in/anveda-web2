import type { Metadata } from "next";
import Link from "@/components/Link";
import { groups, collectionsInGroup, rangeHref } from "@/lib/catalog";
import { breadcrumbJsonLd } from "@/lib/breadcrumbs";

export const metadata: Metadata = {
  title: "Glass vs Kundan vs Antique Bangles — What's the Difference",
  description:
    "A plain-language guide to glass, kundan-set and antique-style bangles — what each is actually made of, how they wear, what they cost, and which to pick for your stack.",
};

const breadcrumb = breadcrumbJsonLd([
  { name: "Home", url: "/" },
  { name: "Guides", url: "/guides/glass-vs-kundan-vs-antique/" },
  { name: "Glass vs Kundan vs Antique", url: "/guides/glass-vs-kundan-vs-antique/" },
]);

export default function MaterialGuidePage() {
  const glassCollections = collectionsInGroup("glass");
  const ornateCollections = collectionsInGroup("ornate");
  const layeringCollections = collectionsInGroup("layering");

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <section className="border-b border-line px-5 pb-10 pt-12 sm:px-6 md:pb-14 md:pt-16">
        <div className="mx-auto max-w-[1320px]">
          <span className="eyebrow">Guide</span>
          <h1 className="mt-3 max-w-[20ch] font-display text-[clamp(32px,4.8vw,58px)]">
            Glass, kundan or antique — what's actually different
          </h1>
          <p className="mt-4 max-w-[62ch] text-[15px] text-ink-soft">
            "Bangles" covers a lot of ground — coloured glass, hand-set stonework,
            and the heavier antique-look pieces are three different kinds of
            object, worn for different reasons. Here's what each actually is,
            so you're picking by what suits you, not by a product photo alone.
          </p>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-[900px] space-y-14">
          {/* ---------------------------------------------------- glass */}
          <div>
            <h2 className="font-display text-[clamp(22px,2.8vw,32px)]">
              Glass bangles
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
              Exactly what it sounds like: coloured glass, shaped into a bangle
              and worn as-is or cut and stone-set for extra sparkle. This is the
              lightest option on the wrist, the one made for stacking six or
              eight at once, and — because a plain glass bangle needs no
              hand-set work — the most affordable. Our {glassCollections.length}{" "}
              glass ranges run from clear jelly-finish colour to fine-cut,
              stone-set detail:
            </p>
            <ul className="mt-4 space-y-1.5 text-[14.5px]">
              {glassCollections.map((c) => (
                <li key={c.slug}>
                  <Link href={rangeHref(c.slug)} className="text-maroon underline underline-offset-2 hover:no-underline">
                    {c.name}
                  </Link>{" "}
                  <span className="text-ink-soft">— {c.blurb}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[14.5px] leading-relaxed text-ink-soft">
              The trade-off: glass has no give. It doesn't bend to fit like a
              metal bracelet would, which is exactly why getting your{" "}
              <Link href="/sizing" className="text-maroon underline underline-offset-2 hover:no-underline">
                size
              </Link>{" "}
              right matters more here than for almost anything else you'd wear.
            </p>
          </div>

          {/* --------------------------------------------------- kundan */}
          <div>
            <h2 className="font-display text-[clamp(22px,2.8vw,32px)]">
              Kundan and stone-set work
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
              Kundan is a setting technique, not a material — small stones (or
              polished glass standing in for them) set by hand into a border or
              motif, traditionally backed in gold-toned foil so the light
              catches from underneath as well as on top. It's slower, more
              detailed work than a plain bangle, which is why it costs more and
              why two kundan-set pieces are never quite identical — each one is
              set by hand. Our{" "}
              <Link href={rangeHref("border-bangles")} className="text-maroon underline underline-offset-2 hover:no-underline">
                Border Bangles
              </Link>{" "}
              range is built entirely around this: the body stays plain glass so
              the worked border — kundan, pearl-and-gold stone, or a premium
              non-bendable stone setting — is what carries the whole piece.
            </p>
          </div>

          {/* -------------------------------------------------- antique */}
          <div>
            <h2 className="font-display text-[clamp(22px,2.8vw,32px)]">
              Antique-style and statement pieces
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
              "Antique" here describes a look, not age — an oxidised or matte
              gold-toned finish and heavier, more worked designs styled after
              traditional temple jewellery. These are the pieces a stack gets
              built around rather than filled out with: worn one or two at a
              time, not six. Our Ornate group covers this ground —{" "}
              {ornateCollections.map((c, i) => (
                <span key={c.slug}>
                  <Link href={rangeHref(c.slug)} className="text-maroon underline underline-offset-2 hover:no-underline">
                    {c.name}
                  </Link>
                  {i < ornateCollections.length - 2 ? ", " : i === ornateCollections.length - 2 ? " and " : ""}
                </span>
              ))}{" "}
              — the wide, worked bangles, solid kada meant to be worn singly,
              and the slimmer designer sides made to flank them.
            </p>
          </div>

          {/* ------------------------------------------------- layering */}
          <div>
            <h2 className="font-display text-[clamp(22px,2.8vw,32px)]">
              Layering pieces
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
              Not a material at all — a role. Slim, quieter designs made to sit
              either side of something bigger, not to lead a stack themselves.{" "}
              {layeringCollections.map((c, i) => (
                <span key={c.slug}>
                  <Link href={rangeHref(c.slug)} className="text-maroon underline underline-offset-2 hover:no-underline">
                    {c.name}
                  </Link>
                  {i < layeringCollections.length - 1 ? " and " : ""}
                </span>
              ))}{" "}
              both fall here: pick one of these once you already have a
              statement piece or a kundan border bangle to build around.
            </p>
          </div>

          {/* --------------------------------------------------- table */}
          <div>
            <h2 className="font-display text-[clamp(22px,2.8vw,32px)]">
              Side by side
            </h2>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-ink">
                    {["Type", "Weight on wrist", "Best worn", "Starts around"].map((h) => (
                      <th key={h} className="py-3 pr-4 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-soft">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-[14px]">
                  {[
                    ["Glass", "Lightest", "Stacked, 4–8 at once", "₹120"],
                    ["Kundan / stone-set", "Light–medium", "1–2 as the stack's focal point", "₹240"],
                    ["Antique / statement", "Heaviest", "Alone or one per wrist", "₹300"],
                    ["Layering", "Light", "Either side of a statement piece", "₹150"],
                  ].map((row) => (
                    <tr key={row[0]} className="border-b border-line">
                      {row.map((cell, i) => (
                        <td key={i} className={i === 0 ? "py-4 pr-4 font-semibold" : "py-4 pr-4 text-ink-soft"}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[12.5px] text-ink-faint">
              Indicative starting prices across current stock — see each range for
              exact pricing by colourway.
            </p>
          </div>

          <div className="border-t border-line pt-10 text-center">
            <h3 className="font-display text-[22px]">Not sure where to start?</h3>
            <p className="mx-auto mt-2 max-w-[46ch] text-[14.5px] text-ink-soft">
              Most stacks are one statement or kundan piece, filled out with
              glass and layering bangles either side. Browse by group:
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {groups.map((g) => (
                <Link
                  key={g.slug}
                  href={`/shop/${g.slug}/`}
                  className="border border-ink px-6 py-3 text-[11.5px] font-bold uppercase tracking-[0.16em] transition-colors hover:bg-ink hover:text-cream"
                >
                  {g.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
