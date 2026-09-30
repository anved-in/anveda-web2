import type { Metadata } from "next";
import { inr } from "@/lib/catalog";
import { SITE, waLink } from "@/lib/site";
import { SHIPPING_FROM } from "@/lib/shipping";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description:
    "How ANVEDA ships across India, what it costs, how long it takes, and what happens if something arrives broken.",
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "How long does delivery take?",
    a: "Orders are packed within 1–2 working days. After dispatch, most metros receive in 3–5 working days and the rest of India in 5–8. Remote PIN codes can take a little longer.",
  },
  {
    q: "What does shipping cost?",
    a: `It depends on where it is going. We send everything by ${SITE.courier}, whose rate is set by the destination PIN code and the parcel weight — for a bangle parcel that starts at ${inr(SHIPPING_FROM)} within Karnataka and rises with distance. Checkout works out the postage from your PIN code and includes it in the total you pay, so you see the full amount before you pay.`,
  },
  {
    q: "Do you ship outside India?",
    a: "Not at the moment. Glass bangles are fragile and international parcels change hands too many times for us to promise they will arrive intact.",
  },
  {
    q: "My bangles arrived broken. What now?",
    a: "Send us a photo on WhatsApp within 48 hours of delivery, with the parcel and packing visible. Breakages in transit are replaced free or refunded in full — that is on us, not on you.",
  },
  {
    q: "Can I return something I simply did not like?",
    a: "Yes, within 7 days of delivery, provided the set is unworn and in its original packing. Return postage is yours; the refund is the full item value. Sale and custom sets are final.",
  },
  {
    q: "I ordered the wrong size.",
    a: "Message us as soon as you notice. If the order has not shipped we will simply swap it. If it has, treat it as a return and we will send the right size once the first set is back with us.",
  },
  {
    q: "How is the order packed?",
    a: "Each set is wrapped individually, cushioned in bubble wrap and boxed rigid so nothing shifts. We over-pack deliberately — Indian courier routes are hard on glass.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function ShippingPage() {
  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section className="border-b border-line px-5 pb-10 pt-12 sm:px-6 md:pb-14 md:pt-16">
        <div className="mx-auto max-w-[1320px]">
          <span className="eyebrow">Practical things</span>
          <h1 className="mt-3 font-display text-[clamp(34px,5vw,62px)]">
            Shipping &amp; returns
          </h1>
          <p className="mt-4 max-w-[58ch] text-[15px] text-ink-soft">
            Everything about how your order reaches you — and what happens when
            something goes wrong.
          </p>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-6 md:py-16">
        <div className="mx-auto max-w-[1320px]">
          <div className="flex flex-wrap border border-line">
            {[
              ["Dispatch", "1–2 working days"],
              ["Delivery", "3–8 working days"],
              ["Shipping", `By ${SITE.courier} · from ${inr(SHIPPING_FROM)}, priced by PIN code`],
              ["Breakage", "Replaced or refunded"],
            ].map(([t, d], i) => (
              <div
                key={t}
                className={[
                  "flex-1 basis-1/2 border-line p-6 text-center md:basis-0",
                  i < 3 ? "md:border-r" : "",
                  i % 2 === 0 ? "border-r md:border-r" : "",
                  i < 2 ? "border-b md:border-b-0" : "",
                ].join(" ")}
              >
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-maroon">
                  {t}
                </div>
                <div className="mt-2 text-[15px] font-medium">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-6 md:pb-24">
        <div className="mx-auto max-w-[820px]">
          <h2 className="font-display text-[clamp(24px,3vw,36px)]">
            Common questions
          </h2>
          <div className="mt-8">
            {FAQ.map((f) => (
              // <details> gives real accordion behaviour with no JS at all.
              <details key={f.q} className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-[15.5px] font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="ml-4 shrink-0 text-[20px] font-normal text-maroon transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pb-5 pr-8 text-[15px] leading-relaxed text-ink-soft">
                  {f.a}
                </p>
              </details>
            ))}
          </div>

          <div className="mt-10 bg-cream-2 p-7 text-center">
            <h3 className="font-display text-[22px]">Something not covered here?</h3>
            <p className="mx-auto mt-2 max-w-[46ch] text-[14.5px] text-ink-soft">
              Message us on WhatsApp — a real person reads it.
            </p>
            <a
              href={waLink("Hi ANVEDA! I have a question about shipping.")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block bg-espresso px-8 py-3.5 text-[11.5px] font-bold uppercase tracking-[0.18em] text-cream transition-colors hover:bg-espresso-2"
            >
              Ask us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
