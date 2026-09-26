"use client";

import { useSearchParams } from "next/navigation";
import ReelsGrid from "./ReelsGrid";
import ReelFeed from "./ReelFeed";
import type { ResolvedReel } from "@/lib/reels";

/**
 * `/reels` is one route with two faces, switched on the `?v=<id>` query —
 * mirrors Instagram's own Reels tab: a grid by default, and tapping a tile
 * drops into the swipeable player already built (ReelFeed), opened on that
 * tile. `?v` also makes a single reel a real, shareable link.
 */
export default function ReelsRoute({ items }: { items: ResolvedReel[] }) {
  const openId = useSearchParams().get("v");
  const open = openId ? items.find((r) => r.id === openId) : undefined;

  if (open) return <ReelFeed items={items} initialId={open.id} />;
  return <ReelsGrid items={items} />;
}
