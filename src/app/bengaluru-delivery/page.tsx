import type { Metadata } from "next";
import Link from "@/components/Link";
import { waLink, HAS_WHATSAPP, igDmLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Same-Day Glass Bangles Delivery in Bengaluru",
  description:
    "Order glass bangles online and get them the same day in Bengaluru with Porter, arranged with you on WhatsApp. Porter's fee is paid directly to Porter.",
  alternates: { canonical: "/bengaluru-delivery/" },
};

interface Faq {
  q: string;
  a: string;
}

const FAQ: Faq[] = [
  {
    q: "Does ANVEDA deliver glass bangles the same day in Bengaluru?",
    a: "Yes. ANVEDA offers same-day glass bangle delivery within Bengaluru when you choose Porter at checkout instead of DTDC courier. We confirm the pickup and timing with you on WhatsApp, then send your order by Porter the same day.",
  },
  {
    q: "Who do I pay for Porter delivery?",
    a: "You make two separate payments. You pay ANVEDA for the glass bangles at checkout, as usual. The Porter delivery fee is paid directly to Porter by you, not to ANVEDA, and it is never added to your order total.",
  },
  {
    q: "Is same-day delivery available everywhere in Bengaluru?",
    a: "Porter covers most of Bengaluru, but availability and the fee depend on your exact address and the time of day. We confirm both with you on WhatsApp before anything is dispatched, so there is no surprise.",
  },
  {
    q: "What if I am outside Bengaluru?",
    a: "Porter only works within the city. Everywhere else in India, we ship by DTDC courier, usually 3 to 8 working days depending on where you are. See our shipping and returns page for details.",
  },
  {
    q: "Can I still choose regular courier in Bengaluru?",
    a: "Yes. Courier (DTDC) is the default at checkout; Porter is simply the faster option when you want your bangles the same day.",
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

export default function BengaluruDeliveryPage() {
  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section className="border-b border-line px-5 pb-10 pt-12 sm:px-6 md:pb-14 md:pt-16">
        <div className="mx-auto max-w-[1320px]">
          <span className="eyebrow">Bengaluru only</span>
          <h1 className="mt-3 font-display text-[clamp(34px,5vw,62px)]">
            Same-day glass bangles delivery in Bengaluru
          </h1>
          <p className="mt-4 max-w-[58ch] text-[15px] text-ink-soft">
            ANVEDA delivers glass bangles the same day to addresses within
            Bengaluru when you choose Porter at checkout instead of DTDC
            courier. The Porter fee is paid directly to Porter by you, not
            to ANVEDA, and pickup is confirmed with you on WhatsApp first.
          </p>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-6 md:py-16">
        <div className="mx-auto max-w-[1320px]">
          <div className="flex flex-wrap border border-line">
            {[
              ["Who it's for", "Bengaluru addresses only"],
              ["How", "Choose Porter at checkout"],
              ["Porter's fee", "Paid by you, direct to Porter"],
              ["Confirmed", "With you on WhatsApp first"],
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
            How it works
          </h2>
          <ol className="mt-6 list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-ink-soft">
            <li>Shop and add your bangles to the bag as normal.</li>
            <li>
              At checkout, under &quot;How should we deliver?&quot;, choose
              &quot;Porter, within Bengaluru&quot; instead of courier.
            </li>
            <li>
              Send us the WhatsApp message the checkout prepares for you,
              with your address and what is in your order.
            </li>
            <li>
              We confirm the Porter fee and pickup time with you on WhatsApp.
              That fee is paid directly to Porter, it is never added to what
              you pay ANVEDA.
            </li>
            <li>Your bangles are on their way to you the same day.</li>
          </ol>

          <div className="mt-10 bg-cream-2 p-7">
            <h3 className="font-display text-[20px]">Good to know</h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
              Porter is only available for addresses within Bengaluru. Exact
              coverage and the fee depend on your address and the time of
              day, which is why we confirm both with you before anything is
              packed and sent. Outside Bengaluru, orders go by DTDC courier
              instead, see{" "}
              <Link href="/shipping" className="underline underline-offset-2">
                shipping &amp; returns
              </Link>
              .
            </p>
          </div>

          <h2 className="mt-14 font-display text-[clamp(24px,3vw,36px)]">
            Common questions
          </h2>
          <div className="mt-8">
            {FAQ.map((f) => (
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
            <h3 className="font-display text-[22px]">Ready to order?</h3>
            <p className="mx-auto mt-2 max-w-[46ch] text-[14.5px] text-ink-soft">
              {HAS_WHATSAPP ? "Message us on WhatsApp" : "Message us on Instagram"}{" "}
              if you want to check Porter coverage for your address first.
            </p>
            <a
              href={HAS_WHATSAPP ? waLink("Hi ANVEDA! Is same-day Porter delivery available at my address in Bengaluru?") : igDmLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block bg-espresso px-8 py-3.5 text-[11.5px] font-bold uppercase tracking-[0.18em] text-cream transition-colors hover:bg-espresso-2"
            >
              Ask us
            </a>
            <div className="mt-4">
              <Link
                href="/shop/glass/"
                className="inline-block border border-ink px-9 py-4 text-[11.5px] font-bold uppercase tracking-[0.2em] transition-colors hover:bg-ink hover:text-cream"
              >
                Shop glass bangles
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
