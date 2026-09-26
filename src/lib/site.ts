/**
 * Single source of truth for the things that differ between environments or
 * that the owner may want to change without touching components.
 *
 * BASE_PATH: GitHub Pages serves a project site from /<repo>, so every internal
 * link and asset must be prefixed. Next handles this via `basePath` in
 * next.config, but raw <img src> and manual hrefs need `asset()`.
 */
export const SITE = {
  name: "ANVEDA",
  tagline: "Handpicked Glass Bangles",
  description:
    "Handpicked glass, antique and kundan bangles. Chosen in small batches, packed with care, delivered across India.",
  /**
   * The owner's WhatsApp number, digits only, with country code.
   *
   * Deliberately NOT read from an environment variable. It used to be, and a
   * stale NEXT_PUBLIC_WHATSAPP repository variable then silently overrode the
   * source at build time — the number was correct in the code and in a local
   * build, and wrong on the live site, which is the worst way to get this
   * wrong. There is one number, it belongs in version control, and changing
   * it should be a commit like any other.
   */
  whatsapp: "917996009966",
  email: "anveda.in@gmail.com",
  instagram: "https://www.instagram.com/anveda.in/",

  /**
   * Shipping.
   *
   * There is no free-shipping threshold — every order pays postage, and the
   * total the customer agrees to is item value PLUS shipping.
   *
   * We ship by DTDC, whose price depends on the destination zone and the
   * parcel weight, so a single number would be wrong for most orders. DTDC's
   * published domestic rates for a small parcel run roughly ₹40–100 (Lite) to
   * ₹150–250 (Plus) before fuel surcharge (~30%) and 18% GST, which is why a
   * real bangle parcel almost always lands above ₹100.
   *
   * So the site does NOT quote a fixed figure. It shows `shippingFrom` as an
   * indicative minimum, states that the exact amount depends on the PIN code,
   * and the final figure is confirmed on WhatsApp before payment. That is
   * honest, and it is what actually happens.
   */
  shippingFrom: 100,
  courier: "DTDC",
} as const;

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix a /public asset path for the deployed base path. */
export const asset = (p: string): string =>
  `${BASE_PATH}${p.startsWith("/") ? p : `/${p}`}`;

export const waLink = (text: string): string =>
  `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
