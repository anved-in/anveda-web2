import type { Metadata } from "next";
import { SITE, waLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to ANVEDA — WhatsApp, email or Instagram. A real person replies.",
};

export default function ContactPage() {
  return (
    <>
      <section className="border-b border-line px-5 pb-10 pt-12 sm:px-6 md:pb-14 md:pt-16">
        <div className="mx-auto max-w-[1320px]">
          <span className="eyebrow">Say hello</span>
          <h1 className="mt-3 font-display text-[clamp(34px,5vw,62px)]">Contact</h1>
          <p className="mt-4 max-w-[58ch] text-[15px] text-ink-soft">
            Sizing, an order, a shade you cannot find — whatever it is, there is
            a person on the other end.
          </p>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-[1320px]">
          <div className="flex flex-wrap gap-y-6">
            {[
              {
                t: "WhatsApp",
                d: "The fastest way to reach us. Orders, sizing help and photos of what is in stock.",
                cta: "Start a chat",
                href: waLink("Hi ANVEDA! I would like to know more about your bangles."),
                primary: true,
              },
              {
                t: "Email",
                d: "For anything longer, or if you would like an invoice for an order.",
                cta: SITE.email,
                href: `mailto:${SITE.email}`,
                primary: false,
              },
              {
                t: "Instagram",
                d: "New batches, restocks and what the colours actually look like in daylight.",
                cta: "@anveda.in",
                href: SITE.instagram,
                primary: false,
              },
            ].map((x) => (
              <div key={x.t} className="w-full md:w-1/3 md:px-3 first:md:pl-0 last:md:pr-0">
                <div className="flex h-full flex-col border border-line p-7">
                  <h2 className="font-display text-[24px]">{x.t}</h2>
                  <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-ink-soft">
                    {x.d}
                  </p>
                  <a
                    href={x.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={[
                      "mt-6 inline-block px-6 py-3.5 text-center text-[11.5px] font-bold uppercase tracking-[0.18em] transition-colors",
                      x.primary
                        ? "bg-espresso text-cream hover:bg-espresso-2"
                        : "border border-ink hover:bg-ink hover:text-cream",
                    ].join(" ")}
                  >
                    {x.cta}
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 border-t border-line pt-10">
            <div className="flex flex-wrap gap-y-6">
              <div className="w-full sm:w-1/2 lg:w-1/3">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-maroon">
                  Where we are
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
                  Karnataka, India.
                  <br />
                  Online only — we ship everywhere in India.
                </p>
              </div>
              <div className="w-full sm:w-1/2 lg:w-1/3">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-maroon">
                  When we reply
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
                  Most messages within a few hours, 10am–8pm IST.
                  <br />
                  Sundays are slower.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
