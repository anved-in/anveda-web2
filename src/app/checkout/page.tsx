import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your ANVEDA order. Secure payment by UPI, card or netbanking.",
};

export default function CheckoutPage() {
  return (
    <section className="px-5 py-8 sm:px-6 md:py-16">
      <div className="mx-auto max-w-[1080px]">
        <span className="eyebrow hidden md:inline-block">Almost there</span>
        <h1 className="font-display text-[clamp(32px,4.2vw,52px)] md:mt-3">Checkout</h1>
        <p className="mt-1 text-[15px] text-ink-soft md:hidden">Your bangles, on their way.</p>
        <CheckoutForm />
      </div>
    </section>
  );
}
