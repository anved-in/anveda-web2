import type { Metadata } from "next";
import Link from "@/components/Link";
import ContactMethods from "@/components/ContactMethods";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to ANVEDA — track an order, WhatsApp, email or Instagram.",
};

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "Can I return something?",
    a: (
      <>
        Only if it arrived broken. Record a continuous unboxing video,
        starting before you open the package — without it, a return or
        refund cannot be processed. See our{" "}
        <Link href="/shipping" className="text-maroon underline underline-offset-2">
          shipping &amp; returns policy
        </Link>
        .
      </>
    ),
  },
  {
    q: "I ordered the wrong size — can I swap it?",
    a: "Message us as soon as you notice. If the order has not shipped yet, we will simply swap it before it leaves.",
  },
];

export default function ContactPage() {
  return (
    <section className="px-5 py-10 sm:px-6 md:py-14">
      <div className="mx-auto max-w-[640px]">
        <span className="eyebrow">Say hello</span>
        <h1 className="mt-2 font-display text-[clamp(26px,4vw,38px)]">
          Contact
        </h1>
        <p className="mt-2 text-[14px] text-ink-soft">
          Sizing, an order, a shade you cannot find — there is a person on
          the other end.
        </p>

        <div className="mt-8">
          <ContactMethods />
        </div>

        <div className="mt-10 flex flex-wrap gap-y-6">
          <div className="w-full sm:w-1/2">
            <h3 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-maroon">
              Where we are
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
              Karnataka, India.
              <br />
              Online only — we ship everywhere in India.
            </p>
          </div>
          <div className="w-full sm:w-1/2">
            <h3 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-maroon">
              When we reply
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
              Most messages within a few hours, 10am–8pm IST.
              <br />
              Sundays are slower.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-maroon">
            A couple of things
          </h3>
          <div className="mt-2">
            {FAQ.map((f) => (
              <details key={f.q} className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[14px] font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="ml-4 shrink-0 text-[18px] font-normal text-maroon transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pb-4 pr-6 text-[13.5px] leading-relaxed text-ink-soft">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
