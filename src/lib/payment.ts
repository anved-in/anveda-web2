import type { Line } from "./cart";
import { productById, inr, colourLabel } from "./catalog";
import { SITE } from "./site";

/**
 * -------------------------------------------------------------------------
 * PAYMENTS — how this works.
 * -------------------------------------------------------------------------
 * The site is a static export, but it deploys as a Cloudflare Worker with one
 * small server route: POST /api/checkout (see worker/index.js at the repo
 * root). That route holds the Razorpay secret key and CMS 2.0's shared
 * secret — neither ever reaches the browser.
 *
 * The real flow:
 *   1. createOrder() below calls /api/checkout, which creates a genuine
 *      Razorpay order (locking the amount server-side, before payment opens —
 *      the browser can no longer influence what gets charged) and saves the
 *      structured order in CMS 2.0 as 'pending'.
 *   2. Razorpay Checkout opens with that real order_id, not a raw amount.
 *   3. CMS 2.0's webhook (webhook-razorpay.ts) is the source of truth for
 *      whether payment actually succeeded — signature-verified server to
 *      server, independent of anything the browser reports back. It flips
 *      the order to 'paid' regardless of what happens in this tab afterwards.
 *
 * The success screen in this browser is a convenience, not a receipt — always
 * confirm 'paid' in the CMS 2.0 dashboard before dispatching, same as before.
 */

export interface Customer {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  notes?: string;
}

export interface OrderSummary {
  lines: Line[];
  subtotal: number;
  /** Estimated postage for the destination PIN — see lib/shipping.ts. */
  shipping: number;
  /** subtotal + shipping: what the customer is actually charged. */
  total: number;
}

/** Razorpay's public key. Safe to ship; it identifies the account, not authorises it. */
export const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";

/** Payments are only live once a real key is configured. */
export const paymentsEnabled = (): boolean =>
  RAZORPAY_KEY.startsWith("rzp_");

/**
 * Same-origin server route (worker/index.js) that creates the real Razorpay
 * order and saves it in CMS 2.0 before checkout opens. See that file for why
 * this exists — the short version is that a secret key belongs on a server,
 * and until now this static export had none.
 */
const createOrder = async (
  ref: string,
  o: OrderSummary,
  c: Customer,
): Promise<{ razorpay_order_id: string; key_id: string }> => {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ref,
      customer: c,
      lines: o.lines,
      subtotal: o.subtotal,
      shipping: o.shipping,
      total: o.total,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Could not start payment. Please try again.");
  }
  return data;
};

/**
 * Shipping comes from the destination PIN code — see lib/shipping.ts, which
 * carries DTDC's zone bands. Re-exported here so callers have one import.
 */
export { quoteShipping } from "./shipping";

/** A short human-readable reference the customer and owner can both quote. */
export const makeRef = (): string =>
  "AV" +
  Date.now().toString(36).toUpperCase().slice(-6) +
  Math.random().toString(36).toUpperCase().slice(2, 5);

/**
 * The itemised order, as Razorpay "notes".
 *
 * There is no WhatsApp handoff any more, so the payment itself has to tell the
 * owner what was bought and where it goes. Notes appear on the payment in the
 * Razorpay dashboard and in its notification emails. Razorpay allows 15 keys
 * of up to 256 characters each, so the item list is packed into as few keys as
 * fit; anything beyond the cap is flagged rather than silently dropped.
 */
export const orderNotes = (
  ref: string,
  o: OrderSummary,
  c: Customer,
): Record<string, string> => {
  const items = o.lines
    .map((l) => {
      const p = productById(l.id);
      if (!p) return null;
      const v = p.variants.find((x) => x.colour === l.colour);
      const shade = v ? colourLabel(p, v) : l.colour;
      return `${p.name} (${shade}) size ${l.size} x${l.qty}`;
    })
    .filter((x): x is string => Boolean(x));

  const notes: Record<string, string> = {
    ref,
    customer: `${c.name} / ${c.phone}${c.email ? ` / ${c.email}` : ""}`.slice(0, 250),
    ship_to: `${c.address}, ${c.city}, ${c.state} ${c.pin}`.slice(0, 250),
    postage: `${inr(o.shipping)} (${SITE.courier}, estimated)`,
  };
  if (c.notes) notes.buyer_notes = c.notes.slice(0, 250);

  const MAX_ITEM_KEYS = 15 - Object.keys(notes).length;
  const chunks: string[] = [];
  let cur = "";
  for (const it of items) {
    if (cur && cur.length + it.length + 3 > 250) {
      chunks.push(cur);
      cur = "";
    }
    cur = cur ? `${cur} | ${it}` : it;
  }
  if (cur) chunks.push(cur);

  chunks.slice(0, MAX_ITEM_KEYS).forEach((ch, i) => {
    notes[`items_${i + 1}`] = ch;
  });
  if (chunks.length > MAX_ITEM_KEYS) {
    notes[`items_${MAX_ITEM_KEYS}`] =
      notes[`items_${MAX_ITEM_KEYS}`].slice(0, 230) + " ...MORE, see order ref";
  }
  return notes;
};

/** Minimal shape of the Razorpay checkout global we actually use. */
interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}
interface RazorpayInstance {
  open: () => void;
  on: (ev: string, cb: (e: unknown) => void) => void;
}
declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => RazorpayInstance;
  }
}

/** Load Razorpay's script once, on demand. */
export const loadRazorpay = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

/**
 * Open Razorpay checkout. Resolves with the payment id on success, or null if
 * the customer dismissed the widget.
 */
export const payWithRazorpay = (
  ref: string,
  o: OrderSummary,
  c: Customer,
): Promise<string | null> =>
  new Promise(async (resolve, reject) => {
    const ok = await loadRazorpay();
    if (!ok || !window.Razorpay) {
      reject(new Error("Could not reach Razorpay. Check your connection."));
      return;
    }

    let order: { razorpay_order_id: string; key_id: string };
    try {
      order = await createOrder(ref, o, c);
    } catch (e) {
      reject(e instanceof Error ? e : new Error("Could not start payment."));
      return;
    }

    let settled = false;
    const rz = new window.Razorpay({
      key: order.key_id,
      order_id: order.razorpay_order_id,
      name: SITE.name,
      description: `Order ${ref}`,
      prefill: { name: c.name, email: c.email, contact: c.phone },
      notes: orderNotes(ref, o, c),
      theme: { color: "#2b2724" },
      handler: (res: RazorpayResponse) => {
        settled = true;
        resolve(res.razorpay_payment_id);
      },
      modal: {
        ondismiss: () => {
          if (!settled) resolve(null);
        },
      },
    });

    rz.on("payment.failed", (e: unknown) => {
      settled = true;
      const msg =
        (e as { error?: { description?: string } })?.error?.description ??
        "Payment failed. No money was taken.";
      reject(new Error(msg));
    });

    rz.open();
  });
