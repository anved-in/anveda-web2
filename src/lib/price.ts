/**
 * Pricing display.
 *
 * Every price on the storefront is shown as a discount: the real catalogue
 * price, next to a struck-through "was" figure set 20% above it. The uplift
 * lives here alone so the struck figure can never drift from the real one.
 *
 *   ₹320 real  ->  was ₹400, now ₹320   (a 20% uplift reads as a 20% saving)
 *
 * The uplift is rounded to a whole rupee so the struck price never shows
 * paise, which would read as a computed number rather than a former price.
 */

/** How far above the real price the struck-through figure sits. */
export const MARKUP = 0.2;

/** The struck-through "was" price for a real price. */
export const wasPrice = (price: number): number =>
  Math.round(price * (1 + MARKUP));

/** Whole-rupee rupee formatting: 1299 -> "₹1,299". */
export const rupees = (n: number): string =>
  `₹${Math.round(n).toLocaleString("en-IN")}`;

/** Both figures plus the saving, for a price tag component. */
export interface PriceTag {
  now: number;
  was: number;
  nowText: string;
  wasText: string;
  /** Percent off, as a whole number — always MARKUP expressed as a discount. */
  offPercent: number;
}

export const priceTag = (price: number): PriceTag => {
  const was = wasPrice(price);
  return {
    now: price,
    was,
    nowText: rupees(price),
    wasText: rupees(was),
    offPercent: Math.round(((was - price) / was) * 100),
  };
};
