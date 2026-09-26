import type { Line } from "./cart";
import { productById, inr, colourLabel } from "./catalog";
import { SITE } from "./site";

/**
 * -------------------------------------------------------------------------
 * PAYMENTS — how this works, and what its limits are.
 * -------------------------------------------------------------------------
 * The site is a STATIC export (GitHub Pages), so there is no server of ours in
 * the payment path. That rules out the standard Razorpay Orders flow, which
 * needs a secret key to create an order and to verify the signature afterwards.
 * A secret key shipped to the browser is a compromised key, so we do not.
 *
 * What we do instead, and why it is still real:
 *   - Razorpay Checkout is opened in the browser with the PUBLIC key only
 *     (key_id is designed to be public). The customer pays by UPI, card or
 *     netbanking on Razorpay's own widget. Money genuinely moves.
 *   - Razorpay itself emails the merchant and the customer on success, and the
 *     payment appears in the Razorpay dashboard. That dashboard — not this
 *     site — is the source of truth for what was paid.
 *   - The itemised order and shipping address travel WITH the payment, as
 *     Razorpay "notes" (see orderNotes), so every payment in the dashboard and
 *     in Razorpay's emails is already tied to what was bought and where it goes.
 *
 * What this CANNOT do without a server, stated plainly:
 *   - It cannot cryptographically verify the payment signature. A determined
 *     user could fake a "success" screen on this site. They cannot fake money
 *     arriving in the Razorpay account, which is what the owner ships against.
 *   - Therefore: ALWAYS confirm the payment in the Razorpay dashboard before
 *     dispatching. The success page says this to the customer too.
 *
 * Upgrading later is a contained change: deploy to a host with server routes
 * (Vercel/Cloudflare), add /api/order + /api/verify, and switch
 * `createOrder()` below to call it. Nothing else in the app changes.
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

    let settled = false;
    const rz = new window.Razorpay({
      key: RAZORPAY_KEY,
      // Razorpay works in paise.
      amount: Math.round(o.total * 100),
      currency: "INR",
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
