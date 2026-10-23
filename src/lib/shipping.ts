"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Line } from "./cart";
import { productById, inr, colourLabel } from "./catalog";

/**
 * Delivery prices. The WEBSITE never works out a price itself: every figure comes from the shop's server
 * (/api/shipping-quote), which prices the real bag from the real DTDC rate card (editable in the CMS).
 * The checkout asks again when the order is placed, so a stale or edited figure can never be charged.
 */

/** The number customers message to agree a Porter price (Bengaluru only). Deliberately NOT SITE.whatsapp,
 *  which would switch WhatsApp on across the whole site. */
export const PORTER_WHATSAPP = "917996009966";
export const PORTER_WHATSAPP_DISPLAY = "+91 79960 09966";

export interface ShipOffer {
  on: boolean;
  minDozens: number;
  maxDozens: number;
  /** the offer price for THIS destination (North East and J&K get the higher one) */
  price: number;
  unlocked: boolean;
  /** the real rupees saved against the normal price; only meaningful when `show` is true */
  saving: number;
  /** true only when the saving is big enough to be worth saying out loud */
  show: boolean;
  dozensToGo: number;
}

export interface ShipQuote {
  known: boolean;
  label: string;
  days: string;
  grams: number;
  pieces: number;
  dozens: number;
  insurance: number;
  /** the normal DTDC price (with insurance), before any offer */
  normal: number;
  /** what the customer pays by courier */
  amount: number;
  /** the lowest price in any area, shown before the address is known */
  from: number;
  offer: ShipOffer;
}

export interface ShipInfo {
  quote: ShipQuote;
  porter: { on: boolean; available: boolean; quote: { amount: number; expiresAt: string } | null };
}

export interface ShipInput {
  lines: Line[];
  pin: string;
  state: string;
  phone: string;
}

/** The bag in the shape the server prices: ordinary lines, and combinations separately. */
export const bagPayload = (lines: Line[]) => ({
  lines: lines.filter((l) => !l.combo).map((l) => ({ productId: l.id, colour: l.colour, qty: l.qty })),
  combos: lines.filter((l) => l.combo).map((l) => ({
    reelId: l.combo!.reelId,
    qty: l.qty,
    picks: l.combo!.picks.map((k) => ({ productId: k.id, colour: k.colour, size: k.size })),
  })),
});

/** Pieces in the bag (a dozen = 12), used only to show "add N more dozens" in the bag drawer. */
export const bagPieces = (lines: Line[]): number =>
  lines.reduce((n, l) => {
    if (l.combo) {
      return n + l.qty * l.combo.picks.reduce((s, k) => {
        const cp = productById(k.id);
        const cv = cp?.variants.find((x) => x.colour === k.colour);
        return s + (cv?.pieces ?? cp?.pieces ?? 12) * k.qty;
      }, 0);
    }
    const p = productById(l.id);
    const v = p?.variants.find((x) => x.colour === l.colour);
    return n + (v?.pieces ?? p?.pieces ?? 12) * l.qty;
  }, 0);

async function postJson<T>(url: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    return res.ok && data.ok ? (data as T) : null;
  } catch {
    return null;
  }
}

/** Debounced live quote for the checkout. `refresh()` asks again straight away (used after a Porter price is confirmed). */
export function useShipping(input: ShipInput, pollWhile = false) {
  const [info, setInfo] = useState<ShipInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const seq = useRef(0);
  const key = JSON.stringify([bagPayload(input.lines), input.pin.trim(), input.state, input.pin.trim().startsWith("560") ? input.phone.replace(/\D/g, "").slice(-10) : ""]);
  const latest = useRef(input);
  useEffect(() => {
    latest.current = input;
  });

  const load = useCallback(async () => {
    const cur = latest.current;
    if (cur.lines.length === 0) return;
    const mine = ++seq.current;
    setBusy(true);
    const res = await postJson<{ quote: ShipQuote; porter: ShipInfo["porter"] }>("/api/shipping-quote", {
      ...bagPayload(cur.lines),
      pin: cur.pin.trim(),
      state: cur.state,
      phone: cur.phone,
    });
    if (mine !== seq.current) return;
    setBusy(false);
    if (res) { setInfo({ quote: res.quote, porter: res.porter }); setFailed(false); }
    else setFailed(true);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(load, 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, load]);

  // while the customer waits for the owner to confirm a Porter price, look again every few seconds
  useEffect(() => {
    if (!pollWhile) return;
    const id = window.setInterval(() => { if (document.visibilityState === "visible") load(); }, 8000);
    return () => window.clearInterval(id);
  }, [pollWhile, load]);

  return { info, busy, failed, refresh: load };
}

export interface OfferConfig { on: boolean; minDozens: number; maxDozens: number; price: number; priceFar: number; minSaving: number }
let offerCache: Promise<OfferConfig | null> | null = null;
/** The offer settings, for the bag drawer (no address there yet). Fetched once per visit. */
export const loadOffer = (): Promise<OfferConfig | null> => {
  if (!offerCache) offerCache = postJson<{ offer: OfferConfig }>("/api/shipping-config", {}).then((r) => r?.offer ?? null);
  return offerCache;
};

/** The WhatsApp text that asks for a Porter price: who, where, and exactly what is in the bag. */
export const porterMessage = (c: { name: string; phone: string; address: string; city: string; pin: string }, lines: Line[]): string => {
  const items = lines.map((l) => {
    if (l.combo) return `${l.combo.title} (combo) x${l.qty}`;
    const p = productById(l.id);
    const v = p?.variants.find((x) => x.colour === l.colour);
    return `${p?.name ?? l.id}${p && v ? ` (${colourLabel(p, v)})` : ""} size ${l.size} x${l.qty}`;
  });
  return [
    "Hi ANVEDA! I would like Porter delivery in Bengaluru. Please confirm the Porter price.",
    "",
    `Name: ${c.name || "-"}`,
    `Mobile: ${c.phone || "-"}`,
    `Address: ${[c.address, c.city, c.pin].filter(Boolean).join(", ") || "-"}`,
    "",
    "My bag:",
    ...items.map((i) => `- ${i}`),
  ].join("\n");
};

export const porterLink = (message: string): string => `https://wa.me/${PORTER_WHATSAPP}?text=${encodeURIComponent(message)}`;

/** One short line for the offer, or null when there is nothing honest to say. */
export const offerLine = (q: ShipQuote): string | null => {
  const o = q.offer;
  if (!q.known || !o.on || !o.show) return null;
  if (o.unlocked) return `Big order offer applied: you save ${inr(o.saving)} on delivery.`;
  if (o.dozensToGo > 0) return `Add ${o.dozensToGo} more ${o.dozensToGo === 1 ? "dozen" : "dozens"} and delivery drops to ${inr(o.price)}. You would save ${inr(o.saving)}.`;
  return null;
};
