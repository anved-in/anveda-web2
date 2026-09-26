import { SITE } from "./site";

/**
 * Shipping, estimated from the destination PIN code.
 *
 * We ship by DTDC, whose price is set by the destination zone and the parcel
 * weight, so there is no single flat figure. The customer still needs a total
 * they can act on, so this derives one from the PIN code they already type at
 * checkout, using DTDC's own zone structure.
 *
 * The figures below are the ALL-IN price for a small (up to ~500g) bangle
 * parcel: DTDC's base surface rate, plus the fuel surcharge (~30%) and 18% GST
 * that always land on top of it. They are rounded to whole rupees and set at
 * the upper end of each band, because quoting low and asking for more later is
 * the one outcome worth avoiding.
 *
 * It is an ESTIMATE, and every surface that shows it says so: the real docket
 * price is settled by the courier at dispatch. Heavy orders (many dozens)
 * cost more, which `weightStep` covers approximately.
 */

/** Origin: ANVEDA ships from Karnataka (PIN 5xxxxx). */
const HOME_ZONE = "KA";

interface Zone {
  id: string;
  label: string;
  /** All-in price for a parcel up to the first weight step. */
  rate: number;
  /** Added per additional 500g beyond the first. */
  step: number;
  days: string;
}

const ZONES: Record<string, Zone> = {
  local: { id: "local", label: "Within Karnataka", rate: 90, step: 35, days: "2–4 days" },
  south: { id: "south", label: "South India", rate: 120, step: 45, days: "3–5 days" },
  metro: { id: "metro", label: "Metro cities", rate: 140, step: 50, days: "3–5 days" },
  rest: { id: "rest", label: "Rest of India", rate: 165, step: 60, days: "4–7 days" },
  far: { id: "far", label: "North-East, J&K, islands", rate: 220, step: 80, days: "6–10 days" },
};

/**
 * PIN prefixes by zone. India's PIN codes are regional: the first digit is the
 * zone and the first two identify the circle, which is enough to place a
 * parcel in the right band.
 */
const FIRST_TWO: Record<string, string> = {
  // North-East, J&K, Andaman — the surcharge belt.
  "78": "far", "79": "far", // Assam, NE states
  "18": "far", "19": "far", // J&K / Ladakh
  "744": "far", // Andaman & Nicobar (3-digit, checked first)
  // South, excluding Karnataka itself.
  "60": "south", "61": "south", "62": "south", "63": "south", // Tamil Nadu
  "64": "south", "65": "south", // TN / Puducherry
  "67": "south", "68": "south", "69": "south", // Kerala
  "50": "south", "51": "south", "52": "south", "53": "south", // Telangana / AP
  // Metros outside the south.
  "11": "metro", // Delhi
  "40": "metro", // Mumbai
  "70": "metro", // Kolkata
  "38": "metro", // Ahmedabad
  "41": "metro", // Pune
};

/** Karnataka: 56xxxx–59xxxx. */
const isHome = (pin: string) => /^5[6-9]/.test(pin);

export interface Quote {
  zone: string;
  label: string;
  amount: number;
  days: string;
  /** False when we could not read the PIN and fell back to a safe default. */
  known: boolean;
}

/** Roughly how many 500g steps an order of `pieces` bangles occupies. */
export const weightStep = (pieces: number): number =>
  Math.max(1, Math.ceil(pieces / 24));

/**
 * Quote shipping for a 6-digit PIN. An unreadable or empty PIN returns the
 * "Rest of India" rate, which is the honest middle: never the cheapest.
 */
export const quoteShipping = (pin: string, pieces = 12): Quote => {
  const clean = (pin ?? "").replace(/\D/g, "");
  const valid = /^\d{6}$/.test(clean);

  let zone: Zone;
  if (!valid) {
    zone = ZONES.rest;
  } else if (isHome(clean)) {
    zone = ZONES.local;
  } else {
    const three = clean.slice(0, 3);
    const two = clean.slice(0, 2);
    const id = FIRST_TWO[three] ?? FIRST_TWO[two] ?? "rest";
    zone = ZONES[id] ?? ZONES.rest;
  }

  const steps = weightStep(pieces);
  const amount = zone.rate + zone.step * (steps - 1);

  return {
    zone: zone.id,
    label: zone.label,
    amount,
    days: zone.days,
    known: valid,
  };
};

/** The lowest figure we ever quote — what "from ₹x" means on the site. */
export const SHIPPING_FROM = Math.min(...Object.values(ZONES).map((z) => z.rate));

export const COURIER = SITE.courier;
export { HOME_ZONE };
