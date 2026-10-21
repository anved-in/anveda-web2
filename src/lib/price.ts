/**
 * Price display: the real catalogue price, nothing else.
 * (There used to be an invented struck-through "was" price 20% above the real one and a "20% off" tag.
 * Both were removed on the owner's instruction: they looked fake. Do not bring them back.)
 */

/** Whole-rupee formatting: 1299 -> "₹1,299". */
export const rupees = (n: number): string =>
  `₹${Math.round(n).toLocaleString("en-IN")}`;

export interface PriceTag {
  now: number;
  nowText: string;
}

export const priceTag = (price: number): PriceTag => ({ now: price, nowText: rupees(price) });
