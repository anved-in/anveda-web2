import type { Metadata } from "next";
import Link from "@/components/Link";
import { products, imgSrc, collections } from "@/lib/catalog";
import { asset } from "@/lib/site";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "ANVEDA began at home, with a tray of bangles on a dining table. We still choose every batch by hand.",
};

export default function AboutPage() {
  return (
    <>
      <section className="on-dark relative flex min-h-[44svh] items-end overflow-hidden bg-espresso md:min-h-[52svh]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset(imgSrc(products[12]?.image ?? products[0].image))}
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
          <span className="eyebrow">Est. Karnataka · India</span>
          <h1 className="mt-3 max-w-[18ch] font-display text-[clamp(34px,5.4vw,66px)] text-[#f7f2ec]">
            Small batches, chosen by hand.
          </h1>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-[720px]">
          <div className="space-y-5 text-[16px] leading-[1.8] text-ink-soft">
            <p className="text-[18px] leading-[1.75] text-ink">
              ANVEDA began the way most good things do at home — with a tray of
              bangles on a dining table and far too many opinions about which
              green was the right green.
            </p>
            <p>
              We still work that way. Nothing is mass-ordered from a catalogue
              photo. Each batch is picked in person, checked piece by piece, and
              packed with enough padding to survive Indian post. If a shade is
              not quite right, it simply does not make it to you.
            </p>
            <p>
              That is also why some designs sell out and stay out for a while. A
              glass bangle is not a thing you can hurry — the colour has to be
              right, the finish has to be even, and the set has to sit together
              on the wrist. We would rather wait for the right batch than send
              you an approximate one.
            </p>
            <p>
              Today we carry {products.length} designs across{" "}
              {collections.length} collections — everyday glass, jelly and
              acrylic for the ordinary days, and the heavier kundan, antique and
              statement pieces for the ones that are not.
            </p>
          </div>

          <blockquote className="my-12 border-l-2 border-gold pl-6">
            <p className="font-display text-[clamp(20px,2.6vw,30px)] leading-[1.35]">
              “A bangle is never really about the bangle. It is about the sound
              it makes when someone you love walks into the room.”
            </p>
            <cite className="mt-4 block text-[11.5px] not-italic uppercase tracking-[0.24em] text-maroon">
              The ANVEDA promise
            </cite>
          </blockquote>
        </div>
      </section>

      {/* What we promise — the trust block, kept concrete rather than florid. */}
      <section className="bg-cream-2 px-5 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-[1320px]">
          <span className="eyebrow">What you can count on</span>
          <h2 className="mt-3 font-display text-[clamp(26px,3.4vw,42px)]">
            How we work
          </h2>
          <div className="mt-9 flex flex-wrap gap-y-8">
            {[
              ["Picked in person", "Every batch is chosen by hand — never ordered from a photograph."],
              ["Checked piece by piece", "Chips, uneven finishes and off shades are pulled before packing."],
              ["Packed to survive post", "Bubble wrap, rigid boxes and enough padding for Indian courier routes."],
              ["A real person replies", "WhatsApp reaches us directly, not a call centre."],
            ].map(([t, d], i) => (
              <div key={t} className="w-full pr-8 sm:w-1/2 lg:w-1/4">
                <div className="font-display text-[30px] text-gold">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-2.5 text-[15px] font-semibold">{t}</h3>
                <p className="mt-1.5 max-w-[30ch] text-[14px] leading-relaxed text-ink-soft">
                  {d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 text-center sm:px-6 md:py-20">
        <h2 className="font-display text-[clamp(26px,3.4vw,42px)]">
          Come and have a look.
        </h2>
        <Link
          href="/shop/glass/"
          className="mt-7 inline-block bg-espresso px-9 py-4 text-[12px] font-bold uppercase tracking-[0.2em] text-cream transition-colors hover:bg-espresso-2"
        >
          Shop the collection
        </Link>
      </section>
    </>
  );
}
