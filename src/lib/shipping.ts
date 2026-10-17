/**
 * Shipping is a flat amount for every order and every PIN code. It is shown only
 * at checkout (and in the order total); nowhere else on the site names a price
 * or a courier.
 */
export const SHIPPING_FLAT = 150;

export interface Quote {
  zone: string;
  label: string;
  amount: number;
  days: string;
  /** Always true: the flat amount does not depend on the PIN code. */
  known: boolean;
}

/** The checkout's shipping charge. The arguments are accepted so callers need not change. */
export const quoteShipping = (_pin?: string, _pieces?: number): Quote => ({
  zone: "flat",
  label: "",
  amount: SHIPPING_FLAT,
  days: "",
  known: true,
});
