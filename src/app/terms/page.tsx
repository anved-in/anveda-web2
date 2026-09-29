import type { Metadata } from "next";
import Link from "@/components/Link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms that apply when you buy from ANVEDA.",
};

const SECTIONS: { h: string; body: React.ReactNode }[] = [
  {
    h: "Who we are",
    body: (
      <>
        ANVEDA sells glass, antique and kundan bangles direct to customers
        across India, through this website. You can reach us at{" "}
        <a href={`mailto:${SITE.email}`} className="underline underline-offset-2">
          {SITE.email}
        </a>{" "}
        or on WhatsApp — see the{" "}
        <Link href="/contact" className="underline underline-offset-2">
          Contact
        </Link>{" "}
        page.
      </>
    ),
  },
  {
    h: "Using this site",
    body: "By placing an order on this site, you confirm that the information you give us — name, address, phone number and email — is accurate, and that you are authorised to use the payment method you check out with. We reserve the right to refuse or cancel an order where the details given appear false, or where we reasonably suspect fraud.",
  },
  {
    h: "Products, pricing and availability",
    body: "Every bangle set is handpicked in small batches, so stock of a given colourway can run out between when a photo was taken and when you order. Prices shown at checkout are the prices you pay — they include the item and, once you enter your delivery PIN code, an itemised shipping charge. We do not add hidden fees at any later step.",
  },
  {
    h: "Payment",
    body: "Payment is processed by Razorpay, a licensed payment aggregator. We do not see or store your card, UPI or netbanking credentials at any point — they are entered directly into Razorpay's own secure checkout. Once payment succeeds, Razorpay confirms it to us and your order is placed.",
  },
  {
    h: "Shipping, returns and refunds",
    body: (
      <>
        Delivery timelines, return eligibility and how refunds work are set
        out in full on the{" "}
        <Link href="/shipping" className="underline underline-offset-2">
          Shipping &amp; returns
        </Link>{" "}
        page — that page is part of these terms.
      </>
    ),
  },
  {
    h: "Colour and appearance",
    body: "Glass and stone-set bangles catch light differently depending on the screen you view them on and the light in the room you open the parcel in. We photograph every batch as accurately as we can, but small variation in shade between what you see on screen and what arrives is expected of handmade glasswork, not a fault.",
  },
  {
    h: "Changes to these terms",
    body: "We may update these terms as the business grows — a new courier, a new payment option, a policy we clarify. The version live on this page at the time you place an order is the one that applies to that order.",
  },
];

export default function TermsPage() {
  return (
    <>
      <section className="border-b border-line px-5 pb-10 pt-12 sm:px-6 md:pb-14 md:pt-16">
        <div className="mx-auto max-w-[1320px]">
          <span className="eyebrow">Legal</span>
          <h1 className="mt-3 font-display text-[clamp(34px,5vw,62px)]">
            Terms &amp; Conditions
          </h1>
          <p className="mt-4 max-w-[58ch] text-[15px] text-ink-soft">
            Last updated {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long" })}.
          </p>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-[720px] space-y-9">
          {SECTIONS.map((s) => (
            <div key={s.h}>
              <h2 className="font-display text-[20px]">{s.h}</h2>
              <p className="mt-2.5 text-[15px] leading-[1.8] text-ink-soft">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
