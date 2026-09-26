import type { Metadata } from "next";
import { Suspense } from "react";
import ReelsRoute from "@/components/ReelsRoute";
import { reels } from "@/lib/reels";

export const metadata: Metadata = {
  title: "Reels",
  description:
    "Watch the bangles move — and buy what you see, straight from the reel.",
};

/**
 * A grid by default (see ReelsGrid); opening one hands off to the full-bleed
 * player (ReelFeed) that used to be this whole page. useSearchParams needs a
 * Suspense boundary to prerender in a static export.
 */
export default function ReelsPage() {
  return (
    <Suspense fallback={<div className="min-h-[60svh]" aria-hidden="true" />}>
      <ReelsRoute items={reels()} />
    </Suspense>
  );
}
