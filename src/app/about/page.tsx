import type { Metadata } from "next";
import Link from "@/components/Link";
import { products, imgSrc, collections } from "@/lib/catalog";
import { asset, HAS_WHATSAPP } from "@/lib/site";
import { sc, scImage, fill } from "@/lib/siteContent";

// The owner can change this page's words and photo in the CMS (CMS > Website pages > About page). A box left alone keeps the
// wording written here (the second argument of sc), which must match the CMS's list: node scripts/check-site-content.mjs.
export function generateMetadata(): Metadata {
  return {
    title: sc("about.seo.title", "Our Story"),
    description: sc(
      "about.seo.description",
      "ANVEDA began at home, with a tray of bangles on a dining table. We still choose every batch by hand.",
    ),
    alternates: { canonical: "/about/" },
  };
}

export default function AboutPage() {
  const heroImage = scImage("about.hero.image") ?? products[12]?.image ?? products[0].image;
  const channel = HAS_WHATSAPP ? "WhatsApp" : "Instagram";
  return (
    <>
      <section className="on-dark relative flex min-h-[44svh] items-end overflow-hidden bg-espresso md:min-h-[52svh]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset(imgSrc(heroImage))}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45"
          fetchPriority="high"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(24,21,19,.6) 0%, rgba(24,21,19,.4) 40%, rgba(24,21,19,.9) 100%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-[1320px] px-5 pb-12 pt-20 sm:px-6">
          <span className="eyebrow">{sc("about.hero.eyebrow", "Est. Karnataka · India")}</span>
          <h1 className="mt-3 max-w-[18ch] font-display text-[clamp(34px,5.4vw,66px)] text-[#f7f2ec]">
            {sc("about.hero.headline", "Small batches, chosen by hand.")}
          </h1>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-[720px]">
          <div className="space-y-5 text-[16px] leading-[1.8] text-ink-soft">
            <p className="whitespace-pre-line text-[18px] leading-[1.75] text-ink">
              {sc("about.story.p1", "ANVEDA began the way most good things do at home. With a tray of bangles on a dining table and far too many opinions about which green was the right green.")}
            </p>
            <p className="whitespace-pre-line">
              {sc("about.story.p2", "We still work that way. Nothing is mass-ordered from a catalogue photo. Each batch is picked in person, checked piece by piece, and packed with enough padding to survive Indian post. If a shade is not quite right, it simply does not make it to you.")}
            </p>
            <p className="whitespace-pre-line">
              {sc("about.story.p3", "That is also why some designs sell out and stay out for a while. A glass bangle is not a thing you can hurry. The colour has to be right, the finish has to be even, and the set has to sit together on the wrist. We would rather wait for the right batch than send you an approximate one.")}
            </p>
            <p className="whitespace-pre-line">
              {fill(
                sc("about.story.p4", "Today we carry {designs} designs across {collections} collections: everyday glass, jelly and acrylic for the ordinary days, and the heavier kundan, antique and statement pieces for the ones that are not."),
                { designs: products.length, collections: collections.length },
              )}
            </p>
          </div>

          <blockquote className="my-12 border-l-2 border-gold pl-6">
            <p className="whitespace-pre-line font-display text-[clamp(20px,2.6vw,30px)] leading-[1.35]">
              {sc("about.quote.text", "“A bangle is never really about the bangle. It is about the sound it makes when someone you love walks into the room.”")}
            </p>
            <cite className="mt-4 block text-[11.5px] not-italic uppercase tracking-[0.24em] text-maroon">
              {sc("about.quote.cite", "The ANVEDA promise")}
            </cite>
          </blockquote>
        </div>
      </section>

      {/* What we promise, the trust block, kept concrete rather than florid. */}
      <section className="bg-cream-2 px-5 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-[1320px]">
          <span className="eyebrow">{sc("about.how.eyebrow", "What you can count on")}</span>
          <h2 className="mt-3 font-display text-[clamp(26px,3.4vw,42px)]">
            {sc("about.how.title", "How we work")}
          </h2>
          <div className="mt-9 flex flex-wrap gap-y-8">
            {[
              [sc("about.how1.title", "Picked in person"), sc("about.how1.text", "Every batch is chosen by hand. Never ordered from a photograph.")],
              [sc("about.how2.title", "Checked piece by piece"), sc("about.how2.text", "Chips, uneven finishes and off shades are pulled before packing.")],
              [sc("about.how3.title", "Packed to survive post"), sc("about.how3.text", "Bubble wrap, rigid boxes and enough padding for Indian courier routes.")],
              [sc("about.how4.title", "A real person replies"), fill(sc("about.how4.text", "{channel} reaches us directly, not a call centre."), { channel })],
            ].map(([t, d], i) => (
              <div key={i} className="w-full pr-8 sm:w-1/2 lg:w-1/4">
                <div className="font-display text-[30px] text-gold">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-2.5 text-[15px] font-semibold">{t}</h3>
                <p className="mt-1.5 max-w-[30ch] whitespace-pre-line text-[14px] leading-relaxed text-ink-soft">
                  {d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 text-center sm:px-6 md:py-20">
        <h2 className="font-display text-[clamp(26px,3.4vw,42px)]">
          {sc("about.closing.title", "Come and have a look.")}
        </h2>
        <Link
          href="/shop/glass/"
          className="rounded-md mt-7 inline-block bg-espresso px-9 py-4 text-[12px] font-bold uppercase tracking-[0.2em] text-cream transition-colors hover:bg-espresso-2"
        >
          {sc("about.closing.button", "Shop the collection")}
        </Link>
      </section>
    </>
  );
}
