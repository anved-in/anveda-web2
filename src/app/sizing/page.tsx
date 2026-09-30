import type { Metadata } from "next";
import Link from "@/components/Link";
import { SIZE_GUIDE } from "@/lib/catalog";
import { waLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sizing Guide",
  description:
    "Indian bangle sizing explained — measure once, order confidently. Sizes 2.2 to 2.8.",
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to find your bangle size at home",
  description: "Two ways to work out your Indian bangle size without a jeweller — using a bangle you already own, or measuring your hand.",
  step: [
    {
      "@type": "HowToStep",
      name: "Use a bangle you own",
      text: "Take a bangle that already fits comfortably and measure straight across the inside, edge to edge, in inches. That number is your size.",
    },
    {
      "@type": "HowToStep",
      name: "Or measure your hand",
      text: "Bring your thumb across to touch your little finger, as if slipping a bangle on. Wrap a measuring tape or strip of paper around the widest part and mark where it meets — that length in centimetres is your circumference. Match it against the size chart.",
    },
    {
      "@type": "HowToStep",
      name: "Between two sizes",
      text: "Go up rather than down. A bangle that is slightly loose still wears well; one that won't pass the knuckle cannot be worn at all.",
    },
  ],
};

export default function SizingPage() {
  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <section className="border-b border-line px-5 pb-10 pt-12 sm:px-6 md:pb-14 md:pt-16">
        <div className="mx-auto max-w-[1320px]">
          <span className="eyebrow">Find your fit</span>
          <h1 className="mt-3 font-display text-[clamp(34px,5vw,62px)]">
            Bangle sizing
          </h1>
          <p className="mt-4 max-w-[58ch] text-[15px] text-ink-soft">
            Indian bangle sizing runs in inches of inner diameter. Get this right
            once and every order afterwards is easy.
          </p>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-[1320px]">
          <div className="flex flex-wrap gap-y-10">
            {/* How to measure — two honest methods, the easy one first. */}
            <div className="w-full lg:w-1/2 lg:pr-14">
              <h2 className="font-display text-[clamp(22px,2.6vw,32px)]">
                How to measure
              </h2>

              <div className="mt-6 space-y-7">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-maroon">
                    Easiest — use a bangle you own
                  </div>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
                    Take a bangle that already fits comfortably and measure
                    straight across the <em>inside</em>, edge to edge, in inches.
                    That number is your size. A bangle measuring 2.4 inches
                    across the inside is a size 2.4.
                  </p>
                </div>

                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-maroon">
                    No bangle handy — measure your hand
                  </div>
                  <ol className="mt-2 list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-ink-soft">
                    <li>
                      Bring your thumb across to touch your little finger, as if
                      slipping a bangle on.
                    </li>
                    <li>
                      Wrap a measuring tape or a strip of paper around the widest
                      part of that shape and mark where it meets.
                    </li>
                    <li>
                      Measure the length in centimetres, then find it in the
                      table — that is the circumference, not the diameter.
                    </li>
                  </ol>
                </div>

                <div className="bg-cream-2 p-5">
                  <p className="text-[14px] leading-relaxed text-ink-soft">
                    <strong className="font-semibold text-ink">If you are between sizes,</strong>{" "}
                    go up rather than down. A bangle that is slightly loose still
                    wears beautifully; one that will not pass the knuckle cannot
                    be worn at all.
                  </p>
                </div>
              </div>
            </div>

            {/* The table */}
            <div className="w-full lg:w-1/2">
              <h2 className="font-display text-[clamp(22px,2.6vw,32px)]">
                Size chart
              </h2>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[400px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-ink">
                      {["Size", "Fit", "Inner diameter", "Circumference"].map((h) => (
                        <th
                          key={h}
                          className="py-3 pr-4 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-soft"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SIZE_GUIDE.map((s) => {
                      const cm = parseFloat(s.cm);
                      return (
                        <tr key={s.size} className="border-b border-line">
                          <td className="py-4 pr-4 font-display text-[24px] text-maroon">
                            {s.size}
                          </td>
                          <td className="py-4 pr-4 text-[14px] font-medium">{s.label}</td>
                          <td className="py-4 pr-4 text-[14px] text-ink-soft">
                            {s.size}″ · {s.cm}
                          </td>
                          <td className="py-4 text-[14px] text-ink-soft">
                            {(cm * Math.PI).toFixed(1)} cm
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="mt-5 text-[13.5px] leading-relaxed text-ink-soft">
                Sizes 2.4 and 2.6 fit most adults and are what we sell the most
                of. Glass bangles have no give, so the measurement matters more
                than it does for a metal bracelet.
              </p>

              <div className="mt-8 border border-line p-6">
                <h3 className="font-display text-[20px]">Still not sure?</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
                  Send us a photo of your bangle against a ruler and we will tell
                  you your size. It takes about a minute.
                </p>
                <a
                  href={waLink("Hi ANVEDA! Could you help me work out my bangle size?")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block bg-espresso px-7 py-3.5 text-[11.5px] font-bold uppercase tracking-[0.18em] text-cream transition-colors hover:bg-espresso-2"
                >
                  Ask on WhatsApp
                </a>
              </div>
            </div>
          </div>

          <div className="mt-14 border-t border-line pt-10 text-center">
            <Link
              href="/shop/glass/"
              className="inline-block border border-ink px-9 py-4 text-[11.5px] font-bold uppercase tracking-[0.2em] transition-colors hover:bg-ink hover:text-cream"
            >
              Shop by size
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
