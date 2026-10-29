import type { Metadata } from "next";
import Link from "@/components/Link";
import { waLink, HAS_WHATSAPP, igDmLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description:
    "How ANVEDA ships, how long it takes, and what happens if something arrives broken.",
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "How long does delivery take?",
    a: "Orders are packed within 1 to 2 working days. After dispatch, most metros receive in 3 to 5 working days and the rest of India in 5 to 8. Remote PIN codes can take a little longer.",
  },
  {
    q: "What does shipping cost?",
    a: "Delivery is priced by weight and by where it is going, using our courier's real rates. You see the exact amount at checkout before you pay. Big orders get a reduced fixed delivery price: your bag tells you how many more dozens to add. In Bengaluru you can also choose Porter, and we confirm its price with you on WhatsApp first.",
  },
  {
    q: "Do you ship outside India?",
    a: "Not at the moment. Glass bangles are fragile and international parcels change hands too many times for us to promise they will arrive intact.",
  },
  {
    q: "My bangles arrived broken. What now?",
    a: "Please record a continuous unboxing video, starting before you open the package, this is required to process a damage claim, since it's the only way to tell a transit breakage from damage after the fact. Only an unboxing video can be accepted: a photo, or a video recorded after the parcel is opened, cannot be considered. Send it to us " + (HAS_WHATSAPP ? "on WhatsApp" : "as a message on Instagram (@anveda.in)") + " within 24 hours of delivery. Breakages in transit are replaced free or refunded in full, that is on us, not on you.",
  },
  {
    q: "Can I return something I simply did not like?",
    a: "We can only accept a return or refund for a set that arrived broken, and only with the unboxing video as proof. We are not able to accept returns for a change of mind.",
  },
  {
    q: "I ordered the wrong size.",
    a: "Message us as soon as you notice. If the order has not shipped we will simply swap it before it leaves.",
  },
  {
    q: "How is the order packed?",
    a: "Each set is wrapped individually, cushioned in bubble wrap and boxed rigid so nothing shifts. We over-pack deliberately: Indian courier routes are hard on glass.",
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
            Everything about how your order reaches you. And what happens when
            something goes wrong.
          </p>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-6 md:py-16">
        <div className="mx-auto max-w-[1320px]">
          <div className="flex flex-wrap border border-line">
            {[
              ["Dispatch", "1 to 2 working days"],
              ["Delivery", "3 to 8 working days"],
              ["Shipping", "Shown at checkout"],
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
          <p className="text-[14px] leading-relaxed text-ink-soft">
            In Bengaluru, Porter can get your order to you the same day. See{" "}
            <Link href="/bengaluru-delivery" className="underline underline-offset-2">
              same-day delivery in Bengaluru
            </Link>
            .
          </p>

          <h2 className="mt-10 font-display text-[clamp(24px,3vw,36px)]">
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
              {HAS_WHATSAPP ? "Message us on WhatsApp" : "Message us on Instagram"}: a real person reads it.
            </p>
            <a
              href={HAS_WHATSAPP ? waLink("Hi ANVEDA! I have a question about shipping.") : igDmLink}
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
