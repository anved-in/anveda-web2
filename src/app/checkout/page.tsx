import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your ANVEDA order — secure payment by UPI, card or netbanking.",
};

export default function CheckoutPage() {
  return (
    <section className="px-5 py-12 sm:px-6 md:py-16">
      <div className="mx-auto max-w-[1080px]">
        <span className="eyebrow">Almost there</span>
        <h1 className="mt-3 font-display text-[clamp(30px,4.2vw,52px)]">Checkout</h1>
        <CheckoutForm />
      </div>
    </section>
  );
}
