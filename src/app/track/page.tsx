import type { Metadata } from "next";
import TrackForm from "@/components/TrackForm";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Check the status of an ANVEDA order with your order reference and phone number.",
};

export default function TrackPage() {
  return (
    <section className="px-5 py-14 sm:px-6 md:py-20">
      <div className="mx-auto max-w-[520px]">
        <span className="eyebrow">Order status</span>
        <h1 className="mt-3 font-display text-[clamp(30px,4.4vw,46px)]">
          Track your order
        </h1>
        <p className="mt-4 text-[15px] text-ink-soft">
          Enter your order reference (from your confirmation) and the mobile
          number you ordered with.
        </p>
        <TrackForm />
      </div>
    </section>
  );
}
