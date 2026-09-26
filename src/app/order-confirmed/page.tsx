import type { Metadata } from "next";
import { Suspense } from "react";
import Confirmation from "@/components/Confirmation";

export const metadata: Metadata = {
  title: "Order confirmed",
  description: "Thank you for your ANVEDA order.",
};

export default function OrderConfirmedPage() {
  return (
    // useSearchParams needs a Suspense boundary to prerender in a static export.
    <Suspense
      fallback={
        <section className="px-5 py-20 text-center sm:px-6">
          <p className="text-ink-soft">Loading…</p>
        </section>
      }
    >
      <Confirmation />
    </Suspense>
  );
}
