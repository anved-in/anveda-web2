import type { Metadata } from "next";
import FaqAnswer from "@/components/FaqAnswer";
import { faqs } from "@/lib/faqs";
import ContactMethods from "@/components/ContactMethods";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to ANVEDA. Track an order, email or Instagram.",
};

export default function ContactPage() {
  const list = faqs();
  return (
    <section className="px-5 py-10 sm:px-6 md:py-14">
      <div className="mx-auto max-w-[640px]">
        <span className="eyebrow">Say hello</span>
        <h1 className="mt-2 font-display text-[clamp(26px,4vw,38px)]">
          Contact
        </h1>
        <p className="mt-2 text-[14px] text-ink-soft">
          Sizing, an order, a shade you cannot find. There is a person on
          the other end.
        </p>

        <div className="mt-8">
          <ContactMethods />
        </div>

        {list.length > 0 && (
          <div className="mt-10">
            <h3 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-maroon">
              Questions people ask
            </h3>
            <div className="mt-2">
              {list.map((f) => (
                <details key={f.id} className="group border-b border-line">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[14px] font-semibold [&::-webkit-details-marker]:hidden">
                    {f.question}
                    <span className="ml-4 shrink-0 text-[18px] font-normal text-maroon transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <div className="pb-4 pr-6 text-[13.5px] leading-relaxed text-ink-soft">
                    <FaqAnswer text={f.answer} />
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
