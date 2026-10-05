import raw from "@/data/catalog.json";

export interface Collection {
  slug: string;
  name: string;
  blurb: string;
  story: string;
  cover: string;
  order: number;
  /** Top-level group this family sits under: "glass" | "ornate" | "layering". */
  group: string | null;
}

/**
 * The catalogue's three top-level groups — Glass, Ornate, Layering — with the
 * families hanging underneath. Taken from the ANVEDA catalog's own grouping
 * (see GROUPS in scripts/gen-catalog.py), so the shop and the catalogue can
 * never disagree about what belongs where.
 */
export interface Group {
  slug: string;
  name: string;
  blurb: string;
  /** "Glass Bangles" -> "Glass": the nav is tight at 1024px. */
  short: string;
}

/** One colourway of a product: its own photo, and a swatch hex when we know it. */
export interface Variant {
  /** CMS 2.0's own variant row id — used only for "notify me when back in stock". */
  id: number;
  colour: string;
  image: string;
  /** null when the shade has no single representative colour ("Assorted"). */
  hex: string | null;
  /** Colourways are priced individually — a family can span ₹180 to ₹899. */
  price: number | null;
  /** Bangles per set/dozen/pair for this colourway. */
  pieces: number | null;
  /** Sizes this colourway is actually stocked in. */
  sizes: string[];
  inStock: boolean;
  /** Admin-set crop focus, as a CSS object-position value. */
  focal: string | null;
  /** Admin-set crop zoom — a scale factor, 1 = no zoom. Paired with focal. */
  zoom: number | null;
}

export interface Product {
  id: string;
  collection: string;
  collectionName: string;
  /** Top-level group: "glass" | "ornate" | "layering". */
  group: string | null;
  name: string;
  /** Lowest colourway price — what "from ₹x" shows. */
  price: number;
  /** Highest colourway price; equals `price` when the family is flat-priced. */
  priceMax: number;
  pieces: number;
  /** How the pieces are counted: "dozen", "set" or "pair". */
  unit: string;
  sizes: string[];
  blurb: string;
  story: string;
  variants: Variant[];
  /** Lead photo — the first variant's image. */
  image: string;
}

const data = raw as {
  groups: Group[];
  collections: Collection[];
  products: Product[];
};

export const groups: Group[] = (data.groups ?? []).map((g) => ({
  ...g,
  short: g.name.replace(/\s*bangles?\s*$/i, "").trim() || g.name,
}));

export const collections: Collection[] = [...data.collections].sort(
  (a, b) => a.order - b.order,
);
export const products: Product[] = data.products;

export const productsIn = (slug: string): Product[] =>
  products.filter((p) => p.collection === slug);

export const collectionBySlug = (slug: string): Collection | undefined =>
  collections.find((c) => c.slug === slug);

export const productById = (id: string): Product | undefined =>
  products.find((p) => p.id === id);

/**
 * A single colourway, addressable on its own. Collection grids list these so a
 * shopper still browses by colour, but every one of them links to the same
 * product page with that colour preselected.
 */
export interface Listing {
  product: Product;
  variant: Variant;
  /** /product/<id>?c=<colour> — the product page reads `c` and preselects it. */
  href: string;
}

export const listingsIn = (slug: string): Listing[] =>
  productsIn(slug).flatMap((p) =>
    p.variants.map((v) => ({
      product: p,
      variant: v,
      href: `/product/${p.id}/?c=${encodeURIComponent(v.colour)}`,
    })),
  );

export const groupBySlug = (slug: string): Group | undefined =>
  groups.find((g) => g.slug === slug);

/** The families inside a group, in catalogue order. */
export const collectionsInGroup = (slug: string): Collection[] =>
  collections.filter((c) => c.group === slug);

/** Every colourway inside a group. */
export const listingsInGroup = (slug: string): Listing[] =>
  collectionsInGroup(slug).flatMap((c) => listingsIn(c.slug));

export const allListings = (): Listing[] =>
  products.flatMap((p) =>
    p.variants.map((v) => ({
      product: p,
      variant: v,
      href: `/product/${p.id}/?c=${encodeURIComponent(v.colour)}`,
    })),
  );

/** Image path for a product photo living in /public/img/products. */
export const imgSrc = (file: string): string => `/img/products/${file}`;

/**
 * The 480px-wide companion of a product photo (see scripts/optimize-images.js)
 * — for srcset on grid tiles, which never render wider than a few hundred
 * pixels but were downloading the full ~1000px master on every device.
 */
export const imgSrcSmall = (file: string): string => {
  const dot = file.lastIndexOf(".");
  return `/img/products/${file.slice(0, dot)}@480${file.slice(dot)}`;
};

/** Prices are whole rupees; format them the way an Indian customer expects. */
export const inr = (n: number): string =>
  "₹" + Math.round(n).toLocaleString("en-IN");

/** Other products to show alongside this one. */
export const related = (p: Product, n = 4): Listing[] =>
  products
    .filter((x) => x.id !== p.id)
    .slice(0, n)
    .map((x) => ({
      product: x,
      variant: x.variants[0],
      href: `/product/${x.id}/`,
    }));

/** Bangle sizes, in inches of inner diameter, with a plain-language note. */
export const SIZE_GUIDE: { size: string; label: string; cm: string }[] = [
  { size: "2.2", label: "Petite", cm: "5.6 cm" },
  { size: "2.4", label: "Small", cm: "6.1 cm" },
  { size: "2.6", label: "Regular", cm: "6.5 cm" },
  { size: "2.8", label: "Medium", cm: "7.0 cm" },
  { size: "2.10", label: "Large", cm: "7.6 cm" },
];

/**
 * Every size is offered on every design.
 *
 * The catalogue records which sizes a colourway happens to be holding right
 * now, but that is a stock snapshot, not a range: anything not on the shelf is
 * sourced. Showing only the stocked sizes turned a sourcing question into a
 * dead end for the customer, so the picker always offers the full range.
 */
export const ALL_SIZES: string[] = SIZE_GUIDE.map((s) => s.size);

/** True when a family's colourways are not all the same price. */
export const hasPriceRange = (p: Product): boolean => p.priceMax > p.price;

/** The price to show for a listing — the colourway's own, or the family's. */
export const listingPrice = (l: Listing): number =>
  l.variant.price ?? l.product.price;

/**
 * The price of one unit of a cart line. Colourways are priced individually,
 * so the line's colour decides the price; the family's lowest price is the
 * fallback for a line saved before per-colour pricing existed.
 */
export const unitPrice = (id: string, colour: string): number => {
  const p = productById(id);
  if (!p) return 0;
  const v = p.variants.find((x) => x.colour === colour);
  return v?.price ?? p.price;
};

/** The price for a chosen variant of a product, with the same fallback. */
export const variantPrice = (p: Product, v: Variant): number =>
  v.price ?? p.price;

/**
 * A colourway's name, cleaned for display.
 *
 * The catalogue stores pack size inside some shade names ("Bell Pearl Flower
 * Set of 4", "Kundan Border Bangles"). Pack size does not belong in a NAME — it
 * is stated properly next to the quantity picker, via packLabel() — and
 * repeating the family name inside the shade produces tiles like "Border
 * Bangles — Kundan Border Bangles", so both are stripped here.
 */
export const colourLabel = (p: Product, v: Variant): string => {
  let c = v.colour
    // "... Set of 4" / "... Pair of 2" — pack size is never shown.
    .replace(/\s*[-–—]?\s*\b(set|pair|pack)\s+of\s+\d+\b/gi, "")
    // A trailing repeat of the family's own noun ("Kundan Border Bangles").
    .replace(/\s*\b(glass\s+)?bangles?\b\s*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Drop any leading family words the shade repeats, so "Square Edge Glass
  // Bangles" + "Square Edge Aqua" reads as "Aqua" rather than repeating it.
  //
  // Done by comparing word lists rather than by building a RegExp from the
  // family name: the name is data, and interpolating data into a pattern both
  // needs escaping and lets a stray character in the catalogue break the rule.
  const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
  const fam = new Set(p.name.split(/\s+/).map(norm).filter(Boolean));
  const parts = c.split(/\s+/).filter(Boolean);
  let start = 0;
  while (start < parts.length - 1 && fam.has(norm(parts[start]))) start += 1;
  c = parts.slice(start).join(" ");

  return c || v.colour;
};

/**
 * The title shown on a grid tile: the family name, plus the shade when the
 * family has more than one. Kept short — the reference storefront's tiles are
 * a single readable line, not a full product description.
 */
export const listingTitle = (
  p: Product,
  v: Variant,
  /** false inside a collection grid, where the heading already names the
      family and repeating it on every tile is pure noise. */
  withFamily = true,
): string => {
  if (p.variants.length < 2) return p.name;
  const c = colourLabel(p, v);
  if (!withFamily) return c;
  // If the cleaned shade name still contains the family's distinguishing
  // words, it already describes the product on its own.
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (norm(c).includes(norm(p.name)) || norm(c) === norm(p.name)) return c;
  return `${p.name} — ${c}`;
};

/**
 * How many bangles one unit of a colourway contains, as a short phrase:
 * "set of 4", "pair", "dozen".
 *
 * Pack size is NOT shown on grid tiles — it made the listing read as a
 * wholesale sheet — but on the product page the customer is about to choose a
 * quantity, and there it is exactly what they need to know: "1" means one set
 * of four, not one bangle. Returns null when we do not have a count.
 */
export const packLabel = (p: Product, v: Variant): string | null => {
  // `?? p.pieces` only when the variant has NO figure at all. A variant that
  // genuinely holds one piece — several kada are sold singly — must read as
  // "single", never inherit the family's count and claim to be a dozen.
  const n = v.pieces ?? p.pieces;
  if (!n) return null;
  if (n === 1) return "single";
  if (n === 12) return "dozen";
  if (n === 2) return "pair";
  return `set of ${n}`;
};

/** The same thing spelled out: "12 bangles", "2 bangles", "1 bangle". */
export const packCount = (p: Product, v: Variant): string | null => {
  const n = v.pieces ?? p.pieces;
  if (!n) return null;
  return n === 1 ? "1 bangle" : `${n} bangles`;
};

/**
 * Where a range lives. There is no page per range: every product is listed on
 * its group's page (/shop/glass, /shop/ornate, /shop/layering), one titled
 * section per range, so a range is a jump-to anchor on that page.
 */
export const rangeHref = (slug: string): string =>
  `/shop/${collectionBySlug(slug)?.group ?? groups[0].slug}/#${slug}`;
