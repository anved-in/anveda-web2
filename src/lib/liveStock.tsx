"use client";

import { useEffect, useSyncExternalStore } from "react";
import { products } from "@/lib/catalog";

/**
 * The shop is built from a copy of the catalogue, so its stock counts are as old as the last build.
 * This lays the REAL counts (from the CMS, already net of pieces other shoppers are checking out with)
 * over that copy, in place, so every price/size/sold-out check in the app sees the live numbers.
 */

type Live = { i: number; q: number; s?: Record<string, number> };

let version = 0;
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const snapshot = () => version;

/** Call in any component that shows stock, so it redraws when the live counts arrive. */
export function useLiveStock(): number {
  return useSyncExternalStore(subscribe, snapshot, () => 0);
}

function apply(live: Record<string, Live>) {
  let changed = false;
  for (const p of products) {
    for (const v of p.variants) {
      const l = live[String(v.id)];
      if (!l) continue;
      const inStock = l.i === 1;
      const qty = l.q > 0 ? l.q : undefined;
      const sizeStock = l.s ?? v.sizeStock;
      if (v.inStock !== inStock || v.stockQty !== qty || JSON.stringify(v.sizeStock) !== JSON.stringify(sizeStock)) {
        v.inStock = inStock;
        v.stockQty = qty;
        v.sizeStock = sizeStock;
        changed = true;
      }
    }
  }
  if (changed) {
    version++;
    listeners.forEach((fn) => fn());
  }
}

async function refresh() {
  try {
    const res = await fetch("/api/stock", { method: "POST", cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { ok?: boolean; v?: Record<string, Live> };
    if (data.ok && data.v) apply(data.v);
  } catch {
    /* offline or the server is busy: keep the build-time numbers */
  }
}

/** Mounted once in the layout: fetch on load, when the tab comes back, and every minute while it is open. */
export default function LiveStockSync() {
  useEffect(() => {
    refresh();
    const onShow = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onShow);
    const t = window.setInterval(onShow, 60000);
    return () => {
      document.removeEventListener("visibilitychange", onShow);
      window.clearInterval(t);
    };
  }, []);
  return null;
}
