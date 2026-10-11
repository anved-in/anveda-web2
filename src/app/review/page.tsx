import type { Metadata } from "next";
import { Suspense } from "react";
import ReviewForm from "@/components/ReviewForm";

// A private, per-order link: keep it out of search results.
export const metadata: Metadata = {
  title: "Rate your order",
  robots: { index: false, follow: false },
};

export default function ReviewPage() {
  return (
    <section className="px-5 py-10 sm:px-6 md:py-16">
      <div className="mx-auto max-w-[520px]">
        <span className="eyebrow">Your feedback</span>
        <h1 className="mt-3 font-display text-[clamp(26px,4vw,40px)]">Rate your order</h1>
        <Suspense fallback={<p className="mt-6 text-[14px] text-ink-soft">Loading…</p>}>
          <ReviewForm />
        </Suspense>
      </div>
    </section>
  );
}
