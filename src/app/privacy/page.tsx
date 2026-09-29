import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What ANVEDA collects, why, and how it is kept.",
};

const SECTIONS: { h: string; body: string }[] = [
  {
    h: "What we collect",
    body: "When you place an order, we collect your name, phone number, email, and delivery address — enough to pack, ship and contact you about that order. We do not ask for or store your card number, UPI ID or bank details; those go directly to Razorpay, our payment processor, and never pass through our systems.",
  },
  {
    h: "Why we collect it",
    body: "Strictly to fulfil your order: to ship it to the right address, to reach you if there is a question about it, and to keep a record in case of a return, replacement or dispute. We do not sell, rent or share your details with anyone for marketing purposes.",
  },
  {
    h: "Payment data",
    body: "All payment processing is handled by Razorpay, which is PCI-DSS compliant. We receive confirmation that a payment succeeded, and a reference id — never your card or bank details themselves.",
  },
  {
    h: "Cookies and local storage",
    body: "This site keeps your shopping bag and favourites in your browser's own local storage, so they survive a page reload. That data stays on your device — it is not sent to us or to any third party until you actually place an order.",
  },
  {
    h: "How long we keep it",
    body: "Order records are kept as long as needed for accounting, warranty and dispute purposes, in line with what Indian law requires of a business selling goods. You can ask us to tell you what we hold on you, or to delete it where we are not legally required to keep it, by writing to us.",
  },
  {
    h: "Contacting us about your data",
    body: `Write to ${SITE.email} with any question about what we hold on you, or to ask for it to be corrected or removed.`,
  },
];

export default function PrivacyPage() {
  return (
    <>
      <section className="border-b border-line px-5 pb-10 pt-12 sm:px-6 md:pb-14 md:pt-16">
        <div className="mx-auto max-w-[1320px]">
          <span className="eyebrow">Legal</span>
          <h1 className="mt-3 font-display text-[clamp(34px,5vw,62px)]">
            Privacy Policy
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
